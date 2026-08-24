const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verificarToken } = require('../middlewares/auth');

// 1. LISTAR TODOS OS CLIENTES
router.get('/', verificarToken(['Administrador', 'RH', 'Vendedor']), async (req, res) => {
    try {
        const [clientes] = await db.query('SELECT * FROM clientes ORDER BY nome_razao ASC');
        res.json(clientes);
    } catch (error) { res.status(500).json({ erro: "Erro ao buscar clientes" }); }
});

// 2. CADASTRAR CLIENTE
router.post('/', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { tipo_pessoa, nome_razao, nome_fantasia, cpf_cnpj, rg_ie, cep, endereco, numero, complemento, bairro, cidade, uf, email, telefone, celular_whats, observacao } = req.body;
    try {
        await db.query(`
            INSERT INTO clientes 
            (tipo_pessoa, nome_razao, nome_fantasia, cpf_cnpj, rg_ie, cep, endereco, numero, complemento, bairro, cidade, uf, email, telefone, celular_whats, observacao) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tipo_pessoa, nome_razao, nome_fantasia, cpf_cnpj, rg_ie, cep, endereco, numero, complemento, bairro, cidade, uf, email, telefone, celular_whats, observacao]);
        res.status(201).json({ mensagem: "Cliente cadastrado com sucesso!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao salvar cliente" }); }
});

// 3. EDITAR CLIENTE
router.put('/:id', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { tipo_pessoa, nome_razao, nome_fantasia, cpf_cnpj, rg_ie, cep, endereco, numero, complemento, bairro, cidade, uf, email, telefone, celular_whats, observacao } = req.body;
    try {
        await db.query(`
            UPDATE clientes SET 
            tipo_pessoa=?, nome_razao=?, nome_fantasia=?, cpf_cnpj=?, rg_ie=?, cep=?, endereco=?, numero=?, complemento=?, bairro=?, cidade=?, uf=?, email=?, telefone=?, celular_whats=?, observacao=?
            WHERE id=?
        `, [tipo_pessoa, nome_razao, nome_fantasia, cpf_cnpj, rg_ie, cep, endereco, numero, complemento, bairro, cidade, uf, email, telefone, celular_whats, observacao, req.params.id]);
        res.json({ mensagem: "Cliente atualizado com sucesso!" });
    } catch (error) { 
        console.error("ERRO NO CADASTRO DE CLIENTE:", error); // Imprime no terminal
        res.status(500).json({ erro: error.message });        // Envia o erro real para o JS
    }
});

// 4. ALTERAR STATUS
router.patch('/:id/status', verificarToken(['Administrador', 'RH']), async (req, res) => {
    try {
        await db.query('UPDATE clientes SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ mensagem: `Status atualizado!` });
    } catch (error) { res.status(500).json({ erro: "Erro ao atualizar status" }); }
});

module.exports = router;