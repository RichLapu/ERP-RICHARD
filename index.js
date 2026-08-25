const express = require('express');
const app = express();

// 1. Configurações Iniciais
app.use(express.json());
app.use(express.static('public'));

// 2. Importação das Rotas Modulares
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const sistemaRoutes = require('./routes/sistemaRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const agendaRoutes = require('./routes/agendaRoutes');

// 3. Definição dos Endpoints Base da API
// Toda requisição que chegar no Node será direcionada para o arquivo correto
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/sistema', sistemaRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/agenda', agendaRoutes);

// 4. Exportação para Vercel e Inicialização Local
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log("Servidor MVC da Intranet rodando na porta 3000!");
    });
}

// A Vercel precisa desta exportação para rodar o backend
module.exports = app;