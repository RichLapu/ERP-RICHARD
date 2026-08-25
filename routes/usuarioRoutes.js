const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { verificarToken } = require('../middlewares/auth');

// Função auxiliar para blindar o admin
async function isSuperAdmin(id) {
    const [user] = await db.query('SELECT email FROM usuarios WHERE id = ?', [id]);
    return user.length > 0 && user[0].email === 'admin@empresa.com';
}

// APENAS ADM E RH PODEM CADASTRAR
router.post('/', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { nome, email, senha, role } = req.body;
    try {
        // Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        
        await db.query('INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)', [nome, email, senhaHash, role]);
        res.status(201).json({ mensagem: "Funcionário cadastrado!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
        res.status(500).json({ erro: "Erro ao salvar." });
    }
});

// TODOS ESSES CARGOS PODEM VISUALIZAR A LISTA DE USUÁRIOS
router.get('/', verificarToken(['Administrador', 'RH', 'T.I', 'Segurança do Trabalho', 'Medicina', 'Juridico']), async (req, res) => {
    try {
        const [usuarios] = await db.query('SELECT id, nome, email, role, status, permissoes FROM usuarios');
        res.json(usuarios);
    } catch (error) { res.status(500).json({ erro: "Erro ao buscar usuários" }); }
});

// APENAS ADM E RH PODEM INATIVAR ALGUÉM
router.patch('/:id/status', verificarToken(['Administrador', 'RH']), async (req, res) => {
    try {
        if (await isSuperAdmin(req.params.id)) return res.status(403).json({ erro: "O Super Admin não pode ser desativado." });
        
        await db.query('UPDATE usuarios SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ mensagem: "Status atualizado" });
    } catch (error) { res.status(500).json({ erro: "Erro ao atualizar status" }); }
});

// APENAS ADM E RH PODEM EDITAR DADOS E SENHAS DE OUTROS
router.put('/:id', verificarToken(['Administrador', 'RH']), async (req, res) => {
    const { nome, email, role, senha } = req.body;
    try {
        if (await isSuperAdmin(req.params.id)) return res.status(403).json({ erro: "Os dados do Super Admin são bloqueados para edição." });

        if (senha && senha.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);
            await db.query('UPDATE usuarios SET nome = ?, email = ?, role = ?, senha = ? WHERE id = ?', [nome, email, role, senhaHash, req.params.id]);
        } else {
            await db.query('UPDATE usuarios SET nome = ?, email = ?, role = ? WHERE id = ?', [nome, email, role, req.params.id]);
        }
        res.json({ mensagem: "Usuário atualizado!" });
    } catch (error) { 
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ erro: "Este e-mail já está em uso." });
        res.status(500).json({ erro: "Erro ao atualizar" }); 
    }
});

// APENAS ADM PODE MUDAR PERMISSÕES DOS MÓDULOS
router.put('/:id/permissoes', verificarToken(['Administrador']), async (req, res) => {
    try {
        if (await isSuperAdmin(req.params.id)) return res.status(403).json({ erro: "As permissões do Super Admin são fixas pelo sistema." });

        await db.query('UPDATE usuarios SET permissoes = ? WHERE id = ?', [req.body.permissoes.join(','), req.params.id]);
        res.json({ mensagem: "Permissões atualizadas!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao salvar permissões" }); }
});

module.exports = router;