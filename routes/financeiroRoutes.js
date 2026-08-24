const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verificarToken } = require('../middlewares/auth');

// 1. BUSCAR O RESUMO DOS CARDS (Já ignora os cancelados)
router.get('/resumo', verificarToken(['Administrador']), async (req, res) => {
    try {
        const [linhas] = await db.query(`
            SELECT 
                SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS total_receitas,
                SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS total_despesas
            FROM financeiro_movimentacoes
            WHERE status = 'efetivado'
        `);
        const receitas = parseFloat(linhas[0].total_receitas || 0);
        const despesas = parseFloat(linhas[0].total_despesas || 0);
        const saldo = receitas - despesas;
        
        res.json({ saldo, receitas, despesas });
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao calcular resumo financeiro" }); 
    }
});

// 2. LISTAR MOVIMENTAÇÕES (IFNULL garante que se a data for nula, ele bloqueia por segurança)
router.get('/', verificarToken(['Administrador']), async (req, res) => {
    try {
        const [movimentacoes] = await db.query(`
            SELECT m.*, 
                   u.nome as usuario_nome,
                   e.nome as editor_nome,
                   IFNULL(TIMESTAMPDIFF(MINUTE, m.data_registro, NOW()), 999) as minutos_passados
            FROM financeiro_movimentacoes m
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            LEFT JOIN usuarios e ON m.editado_por = e.id
            ORDER BY m.data_movimentacao DESC, m.id DESC
        `);
        res.json(movimentacoes);
    } catch (error) { res.status(500).json({ erro: "Erro ao buscar movimentações" }); }
});

// 3. CADASTRAR NOVA MOVIMENTAÇÃO (Forçando a Data de Registro exata com NOW())
router.post('/', verificarToken(['Administrador']), async (req, res) => {
    const { descricao, valor, tipo, categoria, data_movimentacao } = req.body;
    const usuario_id = req.usuario.userId; 

    try {
        await db.query(`
            INSERT INTO financeiro_movimentacoes 
            (descricao, valor, tipo, categoria, data_movimentacao, usuario_id, data_registro) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [descricao, valor, tipo, categoria, data_movimentacao, usuario_id]);
        res.status(201).json({ mensagem: "Movimentação registrada com sucesso!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao salvar movimentação" }); }
});

// 4. EDITAR MOVIMENTAÇÃO FINANCEIRA
router.put('/:id', verificarToken(['Administrador']), async (req, res) => {
    const { descricao, valor, tipo, categoria, data_movimentacao } = req.body;
    const editado_por = req.usuario.userId; 
    const movId = req.params.id;

    try {
        const [movs] = await db.query('SELECT status, IFNULL(TIMESTAMPDIFF(MINUTE, data_registro, NOW()), 999) as minutos_passados FROM financeiro_movimentacoes WHERE id = ?', [movId]);
        if (movs.length === 0) return res.status(404).json({ erro: "Registro não encontrado." });
        
        if (movs[0].status === 'cancelado') return res.status(400).json({ erro: "Não é possível editar um registro cancelado." });
        if (movs[0].minutos_passados > 5) return res.status(400).json({ erro: "O prazo de 5 minutos para edição já expirou." });

        await db.query(`
            UPDATE financeiro_movimentacoes 
            SET descricao = ?, valor = ?, tipo = ?, categoria = ?, data_movimentacao = ?, editado_por = ?, editado_em = NOW() 
            WHERE id = ?
        `, [descricao, valor, tipo, categoria, data_movimentacao, editado_por, movId]);
        res.json({ mensagem: "Movimentação atualizada com sucesso!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao atualizar movimentação" }); }
});

// 5. CANCELAR MOVIMENTAÇÃO
router.put('/:id/cancelar', verificarToken(['Administrador']), async (req, res) => {
    try {
        const [movs] = await db.query('SELECT status FROM financeiro_movimentacoes WHERE id = ?', [req.params.id]);
        if (movs.length === 0) return res.status(404).json({ erro: "Registro não encontrado." });
        if (movs[0].status === 'cancelado') return res.status(400).json({ erro: "Este registro já está cancelado." });

        await db.query("UPDATE financeiro_movimentacoes SET status = 'cancelado' WHERE id = ?", [req.params.id]);
        res.json({ mensagem: "Movimentação cancelada com sucesso!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao cancelar movimentação" }); }
});

module.exports = router;