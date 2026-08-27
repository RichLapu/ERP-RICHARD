// Toda a inteligência de manipulação visual (Menu, Relógio, Toasts, Abas).
function mostrarAlerta(mensagem, tipo = 'success') {
    const toastEl = document.getElementById('toastAlerta');
    const toastMsg = document.getElementById('toast-mensagem');
    toastEl.className = `toast align-items-center border-0 shadow-lg text-bg-${tipo}`;
    toastMsg.innerHTML = mensagem;
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
}

function aplicarPermissoesVisuais(permissoesString) {
    const perms = permissoesString || '';
    
    // Função inteligente: Usa classes do Bootstrap ao invés de forçar o display no HTML
    const alternarVisibilidade = (id, temPermissao) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            // Limpa qualquer estilo inline antigo que possa estar quebrando o layout
            elemento.style.display = ''; 
            
            if (temPermissao) {
                elemento.classList.remove('d-none');
            } else {
                elemento.classList.add('d-none');
            }
        }
    };

    // 1. Regras dos botões individuais e permissões internas
    alternarVisibilidade('menu-lista', perms.includes('mod-listar'));
    
    // Controla o botão de criar usuário DENTRO da aba de listagem
    alternarVisibilidade('btn-novo-usuario', perms.includes('mod-cadastro'));
    
    alternarVisibilidade('menu-permissoes', perms.includes('mod-permissoes'));
    alternarVisibilidade('menu-estoque-itens', perms.includes('mod-estoque-itens'));
    alternarVisibilidade('menu-estoque-mov', perms.includes('mod-estoque-mov'));
    alternarVisibilidade('menu-estoque-fornecedores', perms.includes('mod-estoque-fornecedores'));
    alternarVisibilidade('menu-clientes', perms.includes('mod-clientes'));
    alternarVisibilidade('menu-financeiro', perms.includes('mod-financeiro'));
    alternarVisibilidade('menu-agenda', perms.includes('mod-agenda'));

    // 2. Regras dos Cabeçalhos
    // Retiramos o 'mod-cadastro' daqui, pois ele não dita mais a exibição do menu lateral
    const showSistema = perms.includes('mod-listar') || perms.includes('mod-permissoes');
    alternarVisibilidade('header-sistema', showSistema);

    const showEstoque = perms.includes('mod-estoque-itens') || perms.includes('mod-estoque-mov') || perms.includes('mod-estoque-fornecedores');
    alternarVisibilidade('header-estoque', showEstoque);

    const showClientes = perms.includes('mod-clientes');
    alternarVisibilidade('header-clientes', showClientes);

    const showFinanceiro = perms.includes('mod-financeiro');
    alternarVisibilidade('header-financeiro', showFinanceiro);
    
    const showAgenda = perms.includes('mod-agenda');
    alternarVisibilidade('header-agenda', showAgenda);

    // ========================================================
    // PERMISSÕES DA PÁGINA INICIAL (DASHBOARD)
    // ========================================================
    
    // Mostra o card de Clientes apenas se tiver a permissão mod-clientes
    alternarVisibilidade('dash-card-clientes', perms.includes('mod-clientes'));
    
    // Mostra o card de Estoque se tiver alguma permissão relacionada a estoque
    alternarVisibilidade('dash-card-estoque', perms.includes('mod-estoque-itens') || perms.includes('mod-estoque-mov'));
    
    // Mostra as Últimas Movimentações apenas se tiver permissão de movimentar estoque
    alternarVisibilidade('dash-movimentacoes', perms.includes('mod-estoque-mov'));
    
    // Mostra o Gráfico Financeiro apenas se tiver permissão do módulo financeiro
    alternarVisibilidade('dash-grafico-financeiro', perms.includes('mod-financeiro'));
    
    // Mostra a Mini-Agenda apenas se tiver permissão do módulo de agenda
    alternarVisibilidade('dash-agenda', perms.includes('mod-agenda'));

}

function iniciarRelogio() {
    if (relogioInterval) clearInterval(relogioInterval);
    const atualizarTempo = () => {
        const agora = new Date();
        const spanDataHora = document.getElementById('data-hora-topo');
        if (spanDataHora) {
            const formatadorData = new Intl.DateTimeFormat('pt-BR', { 
                weekday: 'long', day: '2-digit', month: 'long', 
                hour: '2-digit', minute: '2-digit' 
            });
            spanDataHora.innerText = formatadorData.format(agora).replace('-feira', '');
        }

        const hora = agora.getHours();
        let saudacao = hora >= 18 ? "Boa noite" : (hora >= 12 ? "Boa tarde" : "Bom dia");
        const msgBoasVindas = document.getElementById('msg-boas-vindas');
        if (msgBoasVindas) msgBoasVindas.innerText = `${saudacao}, ${usuarioAtualNome}!`;
        carregarUptime(); 
    };
    atualizarTempo();
    relogioInterval = setInterval(atualizarTempo, 60000); 
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }

function alternarAba(aba, elementoClicado) {
    const perms = localStorage.getItem('intranet_permissoes') || '';
    
    // Travas de segurança baseadas nas permissões oficiais
    if (aba === 'cadastro' && !perms.includes('mod-cadastro')) return;
    if (aba === 'lista' && !perms.includes('mod-listar')) return;
    if (aba === 'permissoes' && !perms.includes('mod-permissoes')) return;
    if (aba === 'estoque-itens' && !perms.includes('mod-estoque-itens')) return;
    if (aba === 'estoque-mov' && !perms.includes('mod-estoque-mov')) return;
    if (aba === 'estoque-fornecedores' && !perms.includes('mod-estoque-fornecedores')) return;
    if (aba === 'clientes' && !perms.includes('mod-clientes')) return;
    if (aba === 'financeiro' && !perms.includes('mod-financeiro')) return;
    if (aba === 'agenda' && !perms.includes('mod-agenda')) return;

    document.querySelectorAll('#dashboard-wrapper > .main-content > .p-4 > div').forEach(div => {
        div.classList.add('d-none');
        div.classList.remove('d-block');
    });
    
    const secao = document.getElementById(`secao-${aba}`);
    if (secao) {
        secao.classList.remove('d-none');
        secao.classList.add('d-block');
    }

    const titulos = { 
        'home': 'Início', 'cadastro': 'Cadastrar Novo Usuário', 
        'lista': 'Gestão de Usuários', 'permissoes': 'Controle de Permissões',
        'estoque-itens': 'Cadastro de Itens do Estoque', 'estoque-mov': 'Movimentações de Estoque',
        'estoque-fornecedores': 'Gestão de Fornecedores',
        'clientes': 'Gestão de Clientes',
        'financeiro': 'Controle Financeiro',
        'agenda': 'Agenda Corporativa'
    };
    document.getElementById('header-title').innerText = titulos[aba] || 'DASHBOARD';

    if (elementoClicado) {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            link.classList.add('text-dark');
        });
        elementoClicado.classList.add('active');
        elementoClicado.classList.remove('text-dark');
    }

    // =======================================================
    // Atualiza os dados toda vez que a aba for clicada
    // =======================================================
    if (aba === 'home') {
        carregarUsuariosGeral();
        
        // A MÁGICA FOI INSERIDA AQUI:
        if (typeof carregarWidgetsDashboard === 'function') {
            carregarWidgetsDashboard(); 
        }
    }
    
    if (aba === 'lista' || aba === 'permissoes') carregarUsuariosGeral();
    if (aba === 'estoque-itens') carregarEstoqueItens();
    if (aba === 'estoque-mov') carregarMovimentacoes();
    if (aba === 'estoque-fornecedores') carregarFornecedoresTabela();
    if (aba === 'clientes') carregarClientesTabela();
    if (aba === 'financeiro') carregarFinanceiro();
    if (aba === 'agenda') inicializarCalendario();
}

// ================= CONTROLE DO MODO ESCURO ================= //

function alternarTema() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('temaEscuro', isDark);
    atualizarBotaoTema(isDark);
}

function atualizarBotaoTema(isDark) {
    const btn = document.getElementById('btn-tema');
    if(!btn) return;

    if (isDark) {
        // Modo Escuro: Fundo escuro com o Sol amarelo
        btn.classList.replace('btn-light', 'btn-dark');
        btn.innerHTML = '<i class="bi bi-sun-fill text-warning fs-5"></i>';
    } else {
        // Modo Claro: Fundo claro com a Lua escura
        btn.classList.replace('btn-dark', 'btn-light');
        btn.innerHTML = '<i class="bi bi-moon-stars-fill text-dark fs-5"></i>';
    }
}

async function carregarWidgetsDashboard() {
    try {
        // 1. Carrega e conta os Clientes
        const resClientes = await fetch('/api/clientes', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        if (resClientes.ok) {
            const clientes = await resClientes.json();
            document.getElementById('widget-clientes').innerText = clientes.length;
        }

        // 2. Carrega o Estoque e verifica os alertas usando a ROTA CORRETA
        const resEstoque = await fetch('/api/estoque/itens', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        if (resEstoque.ok) {
            const estoque = await resEstoque.json();
            
            // Filtra usando EXATAMENTE as colunas do seu banco: quantidade_atual e estoque_minimo
            const alertas = estoque.filter(item => {
                const qtd = Number(item.quantidade_atual) || 0;
                const min = Number(item.estoque_minimo) || 0;
                return qtd <= min;
            });
            
            const widgetAlertas = document.getElementById('widget-alertas-estoque');
            widgetAlertas.innerText = alertas.length;
            
            // Muda a cor para vermelho se houver alertas
            if (alertas.length > 0) {
                widgetAlertas.classList.replace('text-dark', 'text-danger');
            } else {
                widgetAlertas.classList.replace('text-danger', 'text-dark');
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados dos widgets:", error);
    }

    carregarPaineisSecundarios();

}

let graficoFinanceiroInstancia = null;

async function carregarPaineisSecundarios() {
    // 1. Clima de Rio Grande/RS (Open-Meteo - Gratuita)
    try {
        const resClima = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-32.0332&longitude=-52.0986&current_weather=true');
        const clima = await resClima.json();
        document.getElementById('clima-temp').innerText = `${clima.current_weather.temperature}°C`;
        document.getElementById('clima-desc').innerText = `Velocidade do vento: ${clima.current_weather.windspeed} km/h`;
    } catch(e) { document.getElementById('clima-desc').innerText = 'Clima indisponível'; }

    // 2. Moedas (AwesomeAPI - Gratuita)
    try {
        const resMoedas = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL');
        const moedas = await resMoedas.json();
        document.getElementById('cambio-dolar').innerText = `R$ ${parseFloat(moedas.USDBRL.ask).toFixed(2).replace('.', ',')}`;
        document.getElementById('cambio-euro').innerText = `R$ ${parseFloat(moedas.EURBRL.ask).toFixed(2).replace('.', ',')}`;
    } catch(e) { console.log('Erro ao carregar câmbio'); }

    // 3. Gráfico Financeiro (Dados Reais Blindados)
    try {
        const resFin = await fetch('/api/financeiro', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        
        if (resFin.ok) {
            const movimentacoes = await resFin.json();
            
            const diasSemana = [];
            const receitas = [0, 0, 0, 0, 0, 0, 0];
            const despesas = [0, 0, 0, 0, 0, 0, 0];
            let saldoTotalGeral = 0; // <--- Variável para guardar o Saldo Atual
            
            const hoje = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(hoje.getDate() - i);
                diasSemana.push(d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' }).replace('.', '').toLowerCase());
            }

            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - 6);
            dataLimite.setHours(0, 0, 0, 0);

            movimentacoes.forEach(mov => {
                let tipo = (mov.tipo || '').toLowerCase();
                let status = (mov.status || '').toLowerCase();
                
                if (status === 'cancelado' || tipo === 'cancelado') return;

                // Tratamento perfeito de valores
                let valor = 0;
                if (mov.valor !== null && mov.valor !== undefined) {
                    let vStr = mov.valor.toString();
                    if (vStr.includes(',')) {
                        valor = parseFloat(vStr.replace(/\./g, '').replace(',', '.'));
                    } else {
                        valor = parseFloat(vStr);
                    }
                }

                // ==========================================
                // Calcula o Saldo Total de todo o período
                // ==========================================
                if (tipo === 'receita') {
                    saldoTotalGeral += valor;
                } else if (tipo === 'despesa') {
                    saldoTotalGeral -= valor;
                }

                // ==========================================
                // CORREÇÃO DO FUSO HORÁRIO E DATAS FUTURAS
                // ==========================================
                let dataOriginal = mov.data_movimentacao || mov.data_registro || mov.data || mov.created_at;
                if (dataOriginal) {
                    // Força a leitura apenas do "Ano-Mês-Dia", ignorando horas e fuso horário
                    let dataStr = typeof dataOriginal === 'string' ? dataOriginal.split('T')[0] : dataOriginal.toISOString().split('T')[0];
                    let [ano, mes, dia] = dataStr.split('-');
                    let dataMov = new Date(ano, mes - 1, dia); // Cria a data local exata
                    
                    // Ignora lançamentos futuros no gráfico "Balanço da Semana"
                    let hojeLocal = new Date();
                    hojeLocal.setHours(0,0,0,0);
                    if (dataMov > hojeLocal) return; 
                    
                    if (dataMov >= dataLimite) {
                        let nomeDia = dataMov.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' }).replace('.', '').toLowerCase();
                        let index = diasSemana.indexOf(nomeDia);
                        
                        if (index !== -1) {
                            if (tipo === 'receita') receitas[index] += valor;
                            else if (tipo === 'despesa') despesas[index] += valor;
                        }
                    }
                }
            });

            // Exibe o Saldo Atual no HTML
            const saldoEl = document.getElementById('dash-saldo-atual');
            if (saldoEl) {
                saldoEl.innerText = 'R$ ' + saldoTotalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                if (saldoTotalGeral < 0) saldoEl.classList.replace('text-dark', 'text-danger');
            }

            // (O resto do código que desenha o Chart.js continua igualzinho aqui para baixo)
            const labelsFormatados = diasSemana.map(dia => dia.charAt(0).toUpperCase() + dia.slice(1));
            const ctx = document.getElementById('graficoFinanceiro').getContext('2d');
            if (graficoFinanceiroInstancia) graficoFinanceiroInstancia.destroy();
            
            graficoFinanceiroInstancia = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labelsFormatados,
                    datasets: [
                        { label: 'Receitas', data: receitas, backgroundColor: '#1cc88a', borderRadius: 4 },
                        { label: 'Despesas', data: despesas, backgroundColor: '#e74a3b', borderRadius: 4 }
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    scales: { 
                        y: { beginAtZero: true, grid: { display: false } }, 
                        x: { grid: { display: false } } 
                    }, 
                    plugins: { 
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let value = context.raw || 0;
                                    return context.dataset.label + ': R$ ' + value.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                                }
                            }
                        }
                    } 
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar dados financeiros para o gráfico:", e);
    }

    // 4. Últimas Movimentações (Estoque)
    try {
        const resMov = await fetch('/api/estoque/movimentacoes', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        if (resMov.ok) {
            const movs = await resMov.json();
            const containerMov = document.getElementById('lista-ultimas-movimentacoes');
            containerMov.innerHTML = '';
            
            const ultimas = movs.slice(0, 4);
            if(ultimas.length === 0) {
                containerMov.innerHTML = '<tr><td colspan="3" class="text-center text-muted small py-3">Sem movimentações recentes</td></tr>';
            } else {
                ultimas.forEach(m => {
                    let cor = m.tipo === 'entrada' ? 'text-success' : (m.tipo === 'retirada' ? 'text-danger' : 'text-primary');
                    
                    let dataOriginal = m.data_hora || m.data_movimentacao || m.data_registro || m.data || m.created_at;
                    let dataFormatada = '--/--/----';
                    
                    if (dataOriginal) {
                        let dataFormatavel = typeof dataOriginal === 'string' ? dataOriginal.replace(' ', 'T') : dataOriginal;
                        dataFormatada = new Date(dataFormatavel).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                        if(dataFormatada === 'Invalid Date') dataFormatada = '--/--/----';
                    }

                    containerMov.innerHTML += `
                        <tr>
                            <td class="ps-4 fw-bold ${cor} text-uppercase" style="font-size: 0.7rem;">${m.tipo}</td>
                            <td class="small text-muted fw-semibold">${dataFormatada}</td>
                            <td class="fw-bold">${m.quantidade} un.</td>
                        </tr>
                    `;
                });
            }
        }
    } catch(e) {}

    // 5. Mini Agenda do Dia
    try {
        const resAge = await fetch('/api/agenda', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        if (resAge.ok) {
            const agenda = await resAge.json();
            const hoje = new Date().toISOString().split('T')[0];
            const agendaHoje = agenda.filter(a => a.data_hora_inicio.startsWith(hoje));
            const containerAge = document.getElementById('lista-mini-agenda');
            containerAge.innerHTML = '';
            
            if(agendaHoje.length === 0) {
                containerAge.innerHTML = '<div class="text-center text-muted small py-3">Dia livre! Nenhum compromisso.</div>';
            } else {
                agendaHoje.slice(0,4).forEach(a => {
                    let hora = a.data_hora_inicio.split('T')[1].substring(0, 5);
                    containerAge.innerHTML += `
                        <div class="d-flex align-items-center mb-3 pb-2 border-bottom">
                            <div class="rounded p-2 me-3 text-white fw-bold shadow-sm" style="background-color: ${a.cor || '#4e73df'}; font-size: 0.75rem;">${hora}</div>
                            <div>
                                <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">${a.titulo}</h6>
                                <small class="text-muted" style="font-size: 0.7rem;">${a.nome_externo || 'Interno'}</small>
                            </div>
                        </div>
                    `;
                });
            }
        }
    } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    const temaSalvo = localStorage.getItem('temaEscuro') === 'true';
    if (temaSalvo) {
        document.body.classList.add('dark-mode');
    }
    atualizarBotaoTema(temaSalvo);
});