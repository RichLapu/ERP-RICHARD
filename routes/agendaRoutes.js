const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verificarToken } = require('../middlewares/auth');

// 1. LISTAR EVENTOS (Para preencher o calendário)
router.get('/', verificarToken(['Administrador', 'RH', 'T.I']), async (req, res) => {
    try {
        const [eventos] = await db.query(`
            SELECT a.*, u.nome as colaborador_nome 
            FROM agenda_eventos a
            JOIN usuarios u ON a.colaborador_id = u.id
            WHERE a.status != 'cancelado'
        `);
        res.json(eventos);
    } catch (error) { res.status(500).json({ erro: "Erro ao buscar agenda" }); }
});

// 2. CADASTRAR NOVO EVENTO
router.post('/', verificarToken(['Administrador', 'RH', 'T.I']), async (req, res) => {
    const { colaborador_id, nome_externo, titulo, data_hora_inicio, data_hora_fim, cor, observacoes } = req.body;
    try {
        await db.query(`
            INSERT INTO agenda_eventos 
            (colaborador_id, nome_externo, titulo, data_hora_inicio, data_hora_fim, cor, observacoes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [colaborador_id, nome_externo, titulo, data_hora_inicio, data_hora_fim, cor, observacoes]);
        res.status(201).json({ mensagem: "Agendamento criado com sucesso!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao salvar agendamento" }); }
});

// 3. EDITAR EVENTO (Ex: Arrastar e soltar no calendário)
router.put('/:id', verificarToken(['Administrador', 'RH', 'T.I']), async (req, res) => {
    const { colaborador_id, nome_externo, titulo, data_hora_inicio, data_hora_fim, cor, observacoes } = req.body;
    try {
        await db.query(`
            UPDATE agenda_eventos 
            SET colaborador_id=?, nome_externo=?, titulo=?, data_hora_inicio=?, data_hora_fim=?, cor=?, observacoes=?
            WHERE id=?
        `, [colaborador_id, nome_externo, titulo, data_hora_inicio, data_hora_fim, cor, observacoes, req.params.id]);
        res.json({ mensagem: "Agendamento atualizado!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao atualizar agendamento" }); }
});

// 4. CANCELAR EVENTO
router.patch('/:id/cancelar', verificarToken(['Administrador', 'RH', 'T.I']), async (req, res) => {
    try {
        await db.query("UPDATE agenda_eventos SET status = 'cancelado' WHERE id = ?", [req.params.id]);
        res.json({ mensagem: "Agendamento cancelado!" });
    } catch (error) { res.status(500).json({ erro: "Erro ao cancelar evento" }); }
});

module.exports = router;