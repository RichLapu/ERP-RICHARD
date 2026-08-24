const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { SECRET_KEY } = require('../middlewares/auth');

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [linhas] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (linhas.length === 0) return res.status(401).json({ erro: "E-mail ou senha inválidos" });

        const usuario = linhas[0];
        if (usuario.status !== 'ativo') return res.status(403).json({ erro: "Sua conta está desativada. Procure o RH." });

        if (senha === usuario.senha) {
            const payload = { userId: usuario.id, role: usuario.role };
            const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '8h' });

            return res.json({ 
                mensagem: "Login realizado com sucesso", 
                token: token,
                usuarioLogado: { nome: usuario.nome, cargo: usuario.role, permissoes: usuario.permissoes }
            });
        }
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    } catch (error) { res.status(500).json({ erro: "Erro interno no servidor" }); }
});

module.exports = router;