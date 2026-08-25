const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Biblioteca de criptografia adicionada
const db = require('../config/database');
const { SECRET_KEY } = require('../middlewares/auth');

// Lista mestre de todas as permissões do sistema
const TODAS_AS_PERMISSOES = 'mod-cadastro,mod-listar,mod-permissoes,mod-estoque-itens,mod-estoque-mov,mod-estoque-fornecedores,mod-clientes,mod-financeiro,mod-agenda';

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [linhas] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (linhas.length === 0) return res.status(401).json({ erro: "E-mail ou senha inválidos" });

        const usuario = linhas[0];
        if (usuario.status !== 'ativo') return res.status(403).json({ erro: "Sua conta está desativada. Procure o RH." });

        // Valida a senha (agora usando criptografia)
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (senhaValida) {
            const payload = { userId: usuario.id, role: usuario.role };
            const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '8h' });

            // INJEÇÃO DO SUPER ADMIN: Se for o admin, injeta todas as permissões
            let permissoesAtuais = usuario.permissoes;
            if (usuario.email === 'admin@empresa.com') {
                permissoesAtuais = TODAS_AS_PERMISSOES;
            }

            return res.json({ 
                mensagem: "Login realizado com sucesso", 
                token: token,
                usuarioLogado: { nome: usuario.nome, cargo: usuario.role, permissoes: permissoesAtuais }
            });
        }
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    } catch (error) { res.status(500).json({ erro: "Erro interno no servidor" }); }
});

module.exports = router;