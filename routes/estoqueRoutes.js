const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verificarToken } = require('../middlewares/auth');

// 1. LISTAR TODOS OS ITENS (Com o nome do Fornecedor)
router.get('/itens', verificarToken(['Administrador', 'RH']), async (req, res) => {
    try {
        const [itens] = await db.query(`
            SELECT i.*, f.nome_fantasia as fornecedor_nome 
            FROM estoque_itens i
            LEFT JOIN fornecedores f ON i.fornecedor_id = f.id
            ORDER BY i.nome ASC
        `);
        res.json(itens);
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao buscar itens" }); 
    }
});

// 2. CADASTRAR NOVO ITEM
router.post('/itens', verificarToken(['Administrador', 'RH']), async (req, res) => {
    // Agora o backend recebe a marca e o fornecedor_id do frontend
    const { codigo_sku, nome, marca, fornecedor_id, categoria, preco_custo, preco_venda, estoque_minimo, descricao } = req.body;
    
    try {
        await db.query(`
            INSERT INTO estoque_itens 
            (codigo_sku, nome, marca, fornecedor_id, categoria, preco_custo, preco_venda, estoque_minimo, descricao) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [codigo_sku, nome, marca, fornecedor_id || null, categoria, preco_custo || 0, preco_venda || 0, estoque_minimo || 0, descricao]);
        
        res.status(201).json({ mensagem: "Produto cadastrado com sucesso!" });
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao cadastrar produto" }); 
    }
});

// 3. LISTAR MOVIMENTAÇÕES (Com nome do Editor)
router.get('/movimentacoes', verificarToken(['Administrador', 'RH']), async (req, res) => {
    try {
        const [movs] = await db.query(`
            SELECT m.*, 
                   i.nome as produto_nome, 
                   u.nome as usuario_nome,
                   e.nome as editor_nome,
                   TIMESTAMPDIFF(MINUTE, m.data_movimentacao, NOW()) as minutos_passados
            FROM estoque_movimentacoes m
            JOIN estoque_itens i ON m.item_id = i.id
            JOIN usuarios u ON m.usuario_id = u.id
            LEFT JOIN usuarios e ON m.editado_por = e.id
            ORDER BY m.data_movimentacao DESC
            LIMIT 100
        `);
        res.json(movs);
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao buscar movimentações" }); 
    }
});

// 7. EDITAR MOVIMENTAÇÃO (Com trava de segurança de 5 minutos)
router.put('/movimentacoes/:id', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { quantidade, observacao } = req.body;
    const movId = req.params.id;
    const usuario_id = req.usuario.userId; // Captura quem está logado fazendo a edição

    const conn = await db.getConnection(); 
    try {
        await conn.beginTransaction();

        const [movs] = await conn.query('SELECT *, TIMESTAMPDIFF(MINUTE, data_movimentacao, NOW()) as minutos_passados FROM estoque_movimentacoes WHERE id = ?', [movId]);
        if (movs.length === 0) throw new Error("Movimentação não encontrada.");
        
        const mov = movs[0];
        if (mov.status === 'cancelado') throw new Error("Não é possível editar um registro cancelado.");
        if (mov.minutos_passados > 5) throw new Error("O prazo de 5 minutos para edição já expirou.");

        let multiplicador = (mov.tipo === 'entrada' || mov.tipo === 'devolucao') ? 1 : -1;
        let diferenca = quantidade - mov.quantidade; 
        let alteracao_estoque = multiplicador * diferenca;

        if (alteracao_estoque !== 0) {
            await conn.query(`UPDATE estoque_itens SET quantidade_atual = quantidade_atual + ? WHERE id = ?`, [alteracao_estoque, mov.item_id]);
        }

        // SALVA OS DADOS NOVOS E REGISTRA O EDITOR
        await conn.query(`
            UPDATE estoque_movimentacoes 
            SET quantidade = ?, observacao = ?, editado_por = ?, editado_em = NOW() 
            WHERE id = ?
        `, [quantidade, observacao, usuario_id, movId]);

        await conn.commit();
        res.json({ mensagem: "Movimentação atualizada com sucesso!" });
    } catch (error) {
        await conn.rollback();
        res.status(400).json({ erro: error.message || "Erro ao editar movimentação" });
    } finally {
        conn.release();
    }
});

// 4. REGISTRAR MOVIMENTAÇÃO (ATUALIZA O SALDO AUTOMATICAMENTE)
router.post('/movimentacoes', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { item_id, tipo, quantidade, observacao } = req.body;
    const usuario_id = req.usuario.userId; // Pega o ID de quem está logado pelo Token JWT

    const conn = await db.getConnection(); 
    try {
        await conn.beginTransaction(); // Inicia uma transação segura no banco

        // A. Salva o registro no histórico
        await conn.query(`
            INSERT INTO estoque_movimentacoes (item_id, usuario_id, tipo, quantidade, observacao) 
            VALUES (?, ?, ?, ?, ?)
        `, [item_id, usuario_id, tipo, quantidade, observacao]);

        // B. Define se vai somar ou subtrair o estoque
        let operador = (tipo === 'entrada' || tipo === 'devolucao') ? '+' : '-';
        
        // C. Atualiza o saldo real do produto
        await conn.query(`
            UPDATE estoque_itens 
            SET quantidade_atual = quantidade_atual ${operador} ? 
            WHERE id = ?
        `, [quantidade, item_id]);

        await conn.commit(); // Salva tudo na AWS
        res.status(201).json({ mensagem: "Movimentação registrada com sucesso!" });
    } catch (error) {
        await conn.rollback(); // Se der erro, desfaz a alteração para não corromper o estoque
        res.status(500).json({ erro: "Erro ao registrar movimentação" });
    } finally {
        conn.release();
    }
});

// 5. EDITAR ITEM DO ESTOQUE
router.put('/itens/:id', verificarToken(['Administrador', 'RH']), async (req, res) => {
    // Agora recebe marca e fornecedor_id
    const { codigo_sku, nome, marca, fornecedor_id, categoria, preco_custo, preco_venda, estoque_minimo, descricao } = req.body;
    
    try {
        await db.query(`
            UPDATE estoque_itens 
            SET codigo_sku = ?, nome = ?, marca = ?, fornecedor_id = ?, categoria = ?, preco_custo = ?, preco_venda = ?, estoque_minimo = ?, descricao = ?
            WHERE id = ?
        `, [codigo_sku, nome, marca, fornecedor_id || null, categoria, preco_custo || 0, preco_venda || 0, estoque_minimo || 0, descricao, req.params.id]);
        
        res.json({ mensagem: "Produto atualizado com sucesso!" });
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao atualizar produto" }); 
    }
});

// 6. ESTORNAR / CANCELAR MOVIMENTAÇÃO
router.put('/movimentacoes/:id/cancelar', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const conn = await db.getConnection(); 
    try {
        await conn.beginTransaction();

        // A. Busca a movimentação original
        const [movs] = await conn.query('SELECT * FROM estoque_movimentacoes WHERE id = ?', [req.params.id]);
        if (movs.length === 0) throw new Error("Movimentação não encontrada.");
        
        const mov = movs[0];
        if (mov.status === 'cancelado') throw new Error("Esta movimentação já está cancelada.");

        // B. Inverte a matemática (Se foi entrada, agora tira. Se foi retirada, agora devolve)
        let operador = (mov.tipo === 'entrada' || mov.tipo === 'devolucao') ? '-' : '+';
        
        // C. Atualiza o saldo real do produto revertendo a ação
        await conn.query(`
            UPDATE estoque_itens 
            SET quantidade_atual = quantidade_atual ${operador} ? 
            WHERE id = ?
        `, [mov.quantidade, mov.item_id]);

        // D. Marca a movimentação no histórico como cancelada
        await conn.query(`UPDATE estoque_movimentacoes SET status = 'cancelado' WHERE id = ?`, [req.params.id]);

        await conn.commit(); 
        res.json({ mensagem: "Movimentação estornada e estoque revertido com sucesso!" });
    } catch (error) {
        await conn.rollback(); 
        res.status(400).json({ erro: error.message || "Erro ao estornar movimentação" });
    } finally {
        conn.release();
    }
});

module.exports = router;