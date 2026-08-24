const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/uptime', (req, res) => {
    res.json({ uptime_segundos: process.uptime() });
});

router.get('/teste-banco', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT NOW() AS hora_atual_servidor');
        res.json({ mensagem: "Conexão OK!", horaServidorRDS: rows[0].hora_atual_servidor });
    } catch (error) { res.status(500).json({ erro: "Falha ao conectar", detalhes: error.message }); }
});

router.get('/setup', async (req, res) => {
    // Código de setup de banco mantido...
    res.json({ mensagem: "Ferramentas de Setup" });
});

router.get('/setup-estoque', async (req, res) => {
    try {
        // Tabela 1: Cadastro dos Itens (Padrão Universal)
        await db.query(`
            CREATE TABLE IF NOT EXISTS estoque_itens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo_sku VARCHAR(50), 
                nome VARCHAR(100) NOT NULL,
                categoria VARCHAR(50),
                descricao TEXT,
                preco_custo DECIMAL(10,2) DEFAULT 0.00,
                preco_venda DECIMAL(10,2) DEFAULT 0.00,
                estoque_minimo INT DEFAULT 0,
                quantidade_atual INT DEFAULT 0,
                status VARCHAR(20) DEFAULT 'ativo'
            )
        `);
        
        // Tabela 2: Log de Movimentações
        await db.query(`
            CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                item_id INT NOT NULL,
                usuario_id INT NOT NULL,
                tipo ENUM('entrada', 'retirada', 'devolucao') NOT NULL,
                quantidade INT NOT NULL,
                observacao VARCHAR(255),
                data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES estoque_itens(id),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        `);
        
        res.json({ mensagem: "Tabelas de estoque criadas com sucesso na AWS!" });
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao criar tabelas", detalhes: error.message }); 
    }
});

router.get('/atualizar-movimentacoes', async (req, res) => {
    try {
        await db.query("ALTER TABLE estoque_movimentacoes ADD COLUMN status VARCHAR(20) DEFAULT 'concluido'");
        res.json({ mensagem: "Coluna 'status' adicionada nas movimentações!" });
    } catch (error) { 
        res.status(500).json({ erro: error.message }); 
    }
});

router.get('/atualizar-auditoria', async (req, res) => {
    try {
        await db.query("ALTER TABLE estoque_movimentacoes ADD COLUMN editado_por INT NULL");
        await db.query("ALTER TABLE estoque_movimentacoes ADD COLUMN editado_em TIMESTAMP NULL");
        res.json({ mensagem: "Colunas de auditoria adicionadas com sucesso!" });
    } catch (error) { 
        res.status(500).json({ erro: error.message }); 
    }
});

router.get('/setup-fornecedores', async (req, res) => {
    try {
        // 1. Cria a tabela do Módulo de Fornecedores
        await db.query(`
            CREATE TABLE IF NOT EXISTS fornecedores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome_fantasia VARCHAR(100) NOT NULL,
                cnpj VARCHAR(20),
                telefone VARCHAR(20),
                email VARCHAR(100),
                status VARCHAR(20) DEFAULT 'ativo'
            )
        `);

        // 2. Adiciona os novos campos na tabela de Produtos
        await db.query("ALTER TABLE estoque_itens ADD COLUMN marca VARCHAR(50) DEFAULT NULL");
        await db.query("ALTER TABLE estoque_itens ADD COLUMN fornecedor_id INT DEFAULT NULL");
        
        // 3. Cria a ponte (Relacionamento) entre o Produto e o Fornecedor
        await db.query(`
            ALTER TABLE estoque_itens 
            ADD CONSTRAINT fk_fornecedor 
            FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) 
            ON DELETE SET NULL
        `);

        res.json({ mensagem: "Módulo de Fornecedores criado e integrado aos Produtos com sucesso!" });
    } catch (error) { 
        res.status(500).json({ erro: error.message }); 
    }
});

router.get('/setup-clientes', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo_pessoa ENUM('PF', 'PJ') DEFAULT 'PF',
                nome_razao VARCHAR(150) NOT NULL,
                nome_fantasia VARCHAR(150),
                cpf_cnpj VARCHAR(20),
                rg_ie VARCHAR(50),
                cep VARCHAR(10),
                endereco VARCHAR(150),
                numero VARCHAR(20),
                complemento VARCHAR(100),
                bairro VARCHAR(100),
                cidade VARCHAR(100),
                uf CHAR(2),
                email VARCHAR(100),
                telefone VARCHAR(20),
                celular_whats VARCHAR(20),
                observacao TEXT,
                status VARCHAR(20) DEFAULT 'ativo',
                data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        res.json({ mensagem: "Módulo de Clientes criado com sucesso!" });
    } catch (error) { 
        res.status(500).json({ erro: error.message }); 
    }
});

router.get('/setup-financeiro', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS financeiro_movimentacoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                descricao VARCHAR(150) NOT NULL,
                valor DECIMAL(10, 2) NOT NULL,
                tipo ENUM('receita', 'despesa') NOT NULL,
                categoria VARCHAR(100) NOT NULL,
                data_movimentacao DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'efetivado',
                data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        res.json({ mensagem: "Módulo Financeiro criado com sucesso no banco de dados!" });
    } catch (error) { 
        res.status(500).json({ erro: error.message }); 
    }
});

router.get('/setup-agenda', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS agenda_eventos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                colaborador_id INT NOT NULL,
                nome_externo VARCHAR(150),
                titulo VARCHAR(150) NOT NULL,
                data_hora_inicio DATETIME NOT NULL,
                data_hora_fim DATETIME NOT NULL,
                cor VARCHAR(20) DEFAULT '#4e73df',
                observacoes TEXT,
                status VARCHAR(20) DEFAULT 'agendado',
                data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (colaborador_id) REFERENCES usuarios(id)
            )
        `);
        res.json({ mensagem: "Módulo de Agenda criado com sucesso no banco de dados!" });
    } catch (error) { 
        res.status(500).json({ erro: error.message }); 
    }
});

module.exports = router;