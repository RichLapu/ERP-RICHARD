const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verificarToken } = require('../middlewares/auth');

// LISTAR FORNECEDORES (Será usado para preencher a lista do HTML)
router.get('/', verificarToken(['Administrador', 'RH']), async (req, res) => {
    try {
        const [fornecedores] = await db.query('SELECT * FROM fornecedores ORDER BY nome_fantasia ASC');
        res.json(fornecedores);
    } catch (error) { res.status(500).json({ erro: "Erro ao buscar fornecedores" }); }
});

// CADASTRAR FORNECEDOR
router.post('/', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { nome_fantasia, cnpj, telefone, email } = req.body;
    try {
        await db.query(`INSERT INTO fornecedores (nome_fantasia, cnpj, telefone, email) VALUES (?, ?, ?, ?)`, 
        [nome_fantasia, cnpj, telefone, email]);
        res.status(201).json({ mensagem: "Fornecedor cadastrado!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao salvar fornecedor" }); }
});

// EDITAR FORNECEDOR
router.put('/:id', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { nome_fantasia, cnpj, telefone, email } = req.body;
    try {
        await db.query(`
            UPDATE fornecedores 
            SET nome_fantasia = ?, cnpj = ?, telefone = ?, email = ? 
            WHERE id = ?
        `, [nome_fantasia, cnpj, telefone, email, req.params.id]);
        res.json({ mensagem: "Fornecedor atualizado com sucesso!" });
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao atualizar fornecedor" }); 
    }
});

// ALTERAR STATUS (Ativar / Inativar)
router.patch('/:id/status', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE fornecedores SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ mensagem: `Status do fornecedor alterado para ${status}` });
    } catch (error) { 
        res.status(500).json({ erro: "Erro ao atualizar status" }); 
    }
});

module.exports = router;