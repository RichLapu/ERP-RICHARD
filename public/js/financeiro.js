let listaFinanceiroMemoria = [];
let modalInstanciaFinanceiro = null;

function aplicarMascaraMoeda(input) {
    let valor = input.value.replace(/\D/g, ''); 
    valor = (valor / 100).toFixed(2) + '';
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    valor = valor.replace(/(\d)(\d{3}),/g, "$1.$2,");
    input.value = valor;
}

function formatarMoedaBR(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarDataBR(dataString) {
    const data = new Date(dataString);
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset()); 
    return data.toLocaleDateString('pt-BR');
}

async function carregarFinanceiro() {
    await carregarResumoCards();
    await carregarTabelaMovimentacoesFinanceiro();
}

async function carregarResumoCards() {
    try {
        const resposta = await fetch('/api/financeiro/resumo', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const dados = await resposta.json();

        document.getElementById('fin-saldo').innerText = formatarMoedaBR(dados.saldo);
        document.getElementById('fin-receitas').innerText = formatarMoedaBR(dados.receitas);
        document.getElementById('fin-despesas').innerText = formatarMoedaBR(dados.despesas);
        
        const saldoElement = document.getElementById('fin-saldo');
        if (dados.saldo < 0) saldoElement.classList.replace('text-dark', 'text-danger');
        else saldoElement.classList.replace('text-danger', 'text-dark');
    } catch (error) { console.error("Erro ao carregar resumo", error); }
}

async function carregarTabelaMovimentacoesFinanceiro() {
    try {
        const resposta = await fetch('/api/financeiro', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const movimentacoes = await resposta.json();
        
        listaFinanceiroMemoria = movimentacoes; 
        
        const tbody = document.getElementById('tabela-financeiro');
        if(!tbody) return;
        tbody.innerHTML = '';

        const termoBusca = document.getElementById('fin-busca') ? document.getElementById('fin-busca').value.toLowerCase() : '';
        const filtroTipo = document.getElementById('fin-filtro-tipo') ? document.getElementById('fin-filtro-tipo').value : 'todos';
        const limiteSelect = document.getElementById('fin-limite-pag') ? document.getElementById('fin-limite-pag').value : '10';

        let filtrados = movimentacoes.filter(mov => {
            const matchDesc = mov.descricao.toLowerCase().includes(termoBusca) || mov.categoria.toLowerCase().includes(termoBusca);
            const matchTipo = filtroTipo === 'todos' || mov.tipo === filtroTipo;
            return matchDesc && matchTipo;
        });

        if (limiteSelect !== 'todos') filtrados = filtrados.slice(0, parseInt(limiteSelect));

        filtrados.forEach(mov => {
            const isReceita = mov.tipo === 'receita';
            const corValor = isReceita ? 'text-success' : 'text-danger';
            
            // Regras de Status e Tempo
            const isCancelado = mov.status === 'cancelado';
            const podeEditar = mov.minutos_passados <= 5 && !isCancelado;
            
            const autorNome = mov.usuario_nome ? mov.usuario_nome.split(' ')[0] : 'Sistema';
            let infoEdicao = '';
            if (mov.editor_nome) {
                const editorNome = mov.editor_nome.split(' ')[0];
                infoEdicao = `<br><span class="badge bg-warning text-dark mt-1" style="font-size: 0.65rem;" title="Editado em: ${new Date(mov.editado_em).toLocaleString('pt-BR')}">Editado por: ${editorNome}</span>`;
            }

            const estiloLinha = isCancelado ? 'text-decoration-line-through text-muted opacity-50' : '';
            
            let corBadge = isReceita ? 'bg-success' : 'bg-danger';
            let classeBordaBadge = !isCancelado ? `bg-opacity-10 ${corValor} border border-${isReceita ? 'success' : 'danger'}` : '';
            if(isCancelado) corBadge = 'bg-dark opacity-50';

            // Lógica dos Botões (Editar bloqueia em 5 minutos)
            let botoesAcao = '';
            if(!isCancelado) {
                if(podeEditar) {
                    botoesAcao += `<button onclick="abrirEdicaoFinanceiro(${mov.id})" class="btn btn-sm btn-outline-primary p-1 me-1" title="Editar Lançamento"><i class="bi bi-pencil"></i></button>`;
                } else {
                    botoesAcao += `<button onclick="alertaEdicaoFinanceiroExpirada()" class="btn btn-sm btn-outline-secondary p-1 me-1" title="Tempo de edição esgotado"><i class="bi bi-pencil"></i></button>`;
                }
                
                botoesAcao += `<button onclick="cancelarFinanceiro(${mov.id})" class="btn btn-sm btn-outline-danger p-1" title="Cancelar Lançamento"><i class="bi bi-x-circle"></i></button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold ${estiloLinha}">${mov.descricao}</td>
                <td class="text-muted ${estiloLinha}">${mov.categoria}</td>
                <td class="text-muted ${estiloLinha}">${formatarDataBR(mov.data_movimentacao)}</td>
                <td><span class="badge ${corBadge} ${classeBordaBadge}">${isCancelado ? 'CANCELADO' : mov.tipo.toUpperCase()}</span></td>
                <td class="fw-bold ${corValor} ${estiloLinha}">${isReceita ? '+' : '-'} ${formatarMoedaBR(mov.valor)}</td>
                <td class="small text-muted ${estiloLinha}"><i class="bi bi-person me-1"></i>${autorNome}${infoEdicao}</td>
                <td class="text-end">${botoesAcao}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Erro ao carregar tabela", error); }
}

function abrirModalFinanceiro() {
    if (!modalInstanciaFinanceiro) modalInstanciaFinanceiro = new bootstrap.Modal(document.getElementById('modalFinanceiro'));
    
    document.getElementById('fin-id').value = '';
    document.getElementById('fin-descricao').value = '';
    document.getElementById('fin-valor').value = '';
    document.getElementById('fin-tipo').value = 'receita';
    document.getElementById('fin-categoria').value = '';
    document.getElementById('fin-data').value = '';

    document.getElementById('titulo-modal-fin').innerHTML = '<i class="bi bi-wallet2 me-2"></i>Registrar Movimentação';
    modalInstanciaFinanceiro.show();
}

function abrirEdicaoFinanceiro(id) {
    const mov = listaFinanceiroMemoria.find(m => m.id === id);
    if (!mov) return;

    if (!modalInstanciaFinanceiro) modalInstanciaFinanceiro = new bootstrap.Modal(document.getElementById('modalFinanceiro'));

    document.getElementById('fin-id').value = mov.id;
    document.getElementById('fin-descricao').value = mov.descricao;
    
    let valStr = parseFloat(mov.valor).toFixed(2).replace('.', ',');
    valStr = valStr.replace(/(\d)(\d{3}),/g, "$1.$2,");
    document.getElementById('fin-valor').value = valStr;

    document.getElementById('fin-tipo').value = mov.tipo;
    document.getElementById('fin-categoria').value = mov.categoria;
    
    const dataIso = mov.data_movimentacao.split('T')[0];
    document.getElementById('fin-data').value = dataIso;

    document.getElementById('titulo-modal-fin').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Movimentação';
    modalInstanciaFinanceiro.show();
}

async function salvarMovimentacao() {
    const id = document.getElementById('fin-id').value;
    const descricao = document.getElementById('fin-descricao').value;
    const valorRaw = document.getElementById('fin-valor').value;
    const tipo = document.getElementById('fin-tipo').value;
    const categoria = document.getElementById('fin-categoria').value;
    const data_mov = document.getElementById('fin-data').value;

    if (!descricao || !valorRaw || !categoria || !data_mov) {
        mostrarAlerta("Preencha todos os campos obrigatórios!", "danger"); return;
    }

    const valor = parseFloat(valorRaw.replace(/\./g, '').replace(',', '.'));
    const url = id ? `/api/financeiro/${id}` : '/api/financeiro';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify({ descricao, valor, tipo, categoria, data_movimentacao: data_mov })
        });

        if (resposta.ok) {
            modalInstanciaFinanceiro.hide();
            mostrarAlerta(`<i class='bi bi-check-circle me-2'></i> Movimentação ${id ? 'atualizada' : 'salva'} com sucesso!`);
            carregarFinanceiro();
        } else { 
            const erro = await resposta.json();
            mostrarAlerta(erro.erro || "Erro ao salvar", "danger"); 
        }
    } catch (error) { mostrarAlerta("Erro de conexão", "danger"); }
}

function alertaEdicaoFinanceiroExpirada() {
    mostrarAlerta("<i class='bi bi-clock-history me-2'></i> O prazo de 5 minutos para edição excedeu. Cancele este registro e crie um novo.", "warning");
}

async function cancelarFinanceiro(id) {
    if (!confirm("Atenção: Deseja CANCELAR esta movimentação?\nEla deixará de constar no saldo final.")) return;
    try {
        const resposta = await fetch(`/api/financeiro/${id}/cancelar`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${tokenJWT}` }
        });
        if (resposta.ok) {
            mostrarAlerta("<i class='bi bi-arrow-counterclockwise me-2'></i> Movimentação cancelada!", "warning");
            carregarFinanceiro();
        } else { 
            const erro = await resposta.json();
            mostrarAlerta(erro.erro || "Erro ao cancelar", "danger"); 
        }
    } catch (error) { mostrarAlerta("Erro de conexão", "danger"); }
}