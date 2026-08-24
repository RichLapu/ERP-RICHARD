const jwt = require('jsonwebtoken');
const SECRET_KEY = "minha_chave_super_secreta_intranet";

const verificarToken = (rolesPermitidas) => {
    return (req, res, next) => {
        const tokenHeader = req.headers['authorization'];
        
        if (!tokenHeader) {
            return res.status(403).json({ erro: "Nenhum token fornecido" });
        }

        const token = tokenHeader.split(' ')[1];

        jwt.verify(token, SECRET_KEY, (err, payloadDecodificado) => {
            if (err) return res.status(401).json({ erro: "Token inválido ou expirado" });

            if (rolesPermitidas.length > 0 && !rolesPermitidas.includes(payloadDecodificado.role)) {
                return res.status(403).json({ erro: "Acesso negado. Você não tem permissão." });
            }

            req.usuario = payloadDecodificado;
            next();
        });
    };
};

module.exports = { verificarToken, SECRET_KEY };