// =====================================================================
// VARIÁVEIS GLOBAIS E PAGINAÇÃO
// =====================================================================
let modalInstanciaFornecedor = null;
let listaFornecedoresMemoria = [];
let controlePaginaFornecedores = 1;

document.addEventListener('DOMContentLoaded', () => {
    const inputPesquisa = document.getElementById('pesquisaFornecedores');
    const selectItens = document.getElementById('itensPorPaginaFornecedores');
    
    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', () => {
            controlePaginaFornecedores = 1;
            renderizarTabelaFornecedores();
        });
    }
    if (selectItens) {
        selectItens.addEventListener('change', () => {
            controlePaginaFornecedores = 1;
            renderizarTabelaFornecedores();
        });
    }
});

// ================= MÁSCARAS DE FORMATAÇÃO ================= //

function aplicarMascaraCNPJ(v) {
    v = v.replace(/\D/g, "");                           // Remove tudo o que não for número
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");             // Coloca o primeiro ponto
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3"); // Coloca o segundo ponto
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");           // Coloca a barra
    v = v.replace(/(\d{4})(\d)/, "$1-$2");              // Coloca o hífen
    return v.substring(0, 18);                          // Limita a 18 caracteres
}

function aplicarMascaraTelefone(v) {
    v = v.replace(/\D/g, "");                           // Remove tudo o que não for número
    v = v.replace(/^(\d{2})(\d)/, "($1) $2");           // Coloca parênteses e espaço
    if (v.length >= 14) { // Se tiver muitos números, é Celular (9 dígitos)
        v = v.replace(/(\d{5})(\d)/, "$1-$2"); 
    } else {              // Se tiver menos, é Telefone Fixo (8 dígitos)
        v = v.replace(/(\d{4})(\d)/, "$1-$2"); 
    }
    return v.substring(0, 15);                          // Limita a 15 caracteres
}


// ================= RENDERIZAÇÃO E FILTROS ================= //

async function carregarFornecedoresTabela() {
    try {
        const resposta = await fetch('/api/fornecedores', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const fornecedores = await resposta.json();
        
        listaFornecedoresMemoria = fornecedores;
        renderizarTabelaFornecedores();

    } catch (error) { console.error("Erro", error); }
}

function renderizarTabelaFornecedores() {
    const tbody = document.getElementById('tabela-fornecedores');
    const paginacao = document.getElementById('paginacaoFornecedores');
    if (!tbody) return;

    const inputBusca = document.getElementById('pesquisaFornecedores');
    const selectItens = document.getElementById('itensPorPaginaFornecedores');
    
    const termoBusca = inputBusca ? inputBusca.value.toLowerCase() : '';
    const itensPorPagina = selectItens ? selectItens.value : '10';

    // Filtro
    let filtrados = listaFornecedoresMemoria.filter(f => 
        (f.nome_fantasia && f.nome_fantasia.toLowerCase().includes(termoBusca)) || 
        (f.cnpj && f.cnpj.toLowerCase().includes(termoBusca)) || 
        (f.email && f.email.toLowerCase().includes(termoBusca))
    );

    // Paginação
    let limite = itensPorPagina === 'todos' ? filtrados.length : parseInt(itensPorPagina);
    if (limite === 0 || isNaN(limite)) limite = 10;

    const totalPaginas = Math.ceil(filtrados.length / limite);
    if (controlePaginaFornecedores > totalPaginas && totalPaginas > 0) controlePaginaFornecedores = totalPaginas;

    const inicio = (controlePaginaFornecedores - 1) * limite;
    const fim = inicio + limite;
    const itensDaPagina = filtrados.slice(inicio, fim);

    // Desenhar Tabela
    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum fornecedor encontrado.</td></tr>';
    } else {
        itensDaPagina.forEach(f => {
            const isAtivo = f.status === 'ativo';
            const novoStatus = isAtivo ? 'inativo' : 'ativo';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-dark">${f.nome_fantasia}</td>
                <td class="text-muted">${f.cnpj || '-'}</td>
                <td class="text-muted small">
                    <div><i class="bi bi-telephone me-1"></i>${f.telefone || '-'}</div>
                    <div><i class="bi bi-envelope me-1"></i>${f.email || '-'}</div>
                </td>
                <td><span class="badge ${isAtivo ? 'bg-success' : 'bg-secondary'}">${isAtivo ? 'ATIVO' : 'INATIVO'}</span></td>
                <td class="text-end">
                    <button onclick="abrirEdicaoFornecedor(${f.id})" class="btn btn-sm btn-link text-primary p-1"><i class="bi bi-pencil-square fs-5"></i></button>
                    <button onclick="alterarStatusFornecedor(${f.id}, '${novoStatus}')" class="btn btn-sm btn-link ${isAtivo ? 'text-secondary' : 'text-success'} p-1"><i class="bi ${isAtivo ? 'bi-toggle-on' : 'bi-toggle-off'} fs-5"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Desenhar Paginação
    if (paginacao) {
        paginacao.innerHTML = '';
        if (totalPaginas > 1) {
            paginacao.innerHTML += `
                <li class="page-item ${controlePaginaFornecedores === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="mudarPaginaFornecedores(event, ${controlePaginaFornecedores - 1})">Anterior</a>
                </li>
            `;
            for (let i = 1; i <= totalPaginas; i++) {
                paginacao.innerHTML += `
                    <li class="page-item ${controlePaginaFornecedores === i ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="mudarPaginaFornecedores(event, ${i})">${i}</a>
                    </li>
                `;
            }
            paginacao.innerHTML += `
                <li class="page-item ${controlePaginaFornecedores === totalPaginas ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="mudarPaginaFornecedores(event, ${controlePaginaFornecedores + 1})">Próxima</a>
                </li>
            `;
        }
    }
}

function mudarPaginaFornecedores(evento, novaPagina) {
    if (evento) evento.preventDefault();
    controlePaginaFornecedores = novaPagina;
    renderizarTabelaFornecedores();
}

// ================= LÓGICAS DE MODAL E CADASTRO ================= //

function abrirModalFornecedor() {
    if (!modalInstanciaFornecedor) modalInstanciaFornecedor = new bootstrap.Modal(document.getElementById('modalFornecedor'));
    
    document.getElementById('forn-id').value = '';
    document.getElementById('forn-nome').value = '';
    document.getElementById('forn-cnpj').value = '';
    document.getElementById('forn-telefone').value = '';
    document.getElementById('forn-email').value = '';
    
    document.getElementById('titulo-modal-fornecedor').innerHTML = '<i class="bi bi-truck me-2"></i>Cadastrar Fornecedor';
    modalInstanciaFornecedor.show();
}

function abrirEdicaoFornecedor(id) {
    const f = listaFornecedoresMemoria.find(x => x.id === id);
    if(!f) return;

    if (!modalInstanciaFornecedor) modalInstanciaFornecedor = new bootstrap.Modal(document.getElementById('modalFornecedor'));

    document.getElementById('forn-id').value = f.id;
    document.getElementById('forn-nome').value = f.nome_fantasia;
    document.getElementById('forn-cnpj').value = f.cnpj || '';
    document.getElementById('forn-telefone').value = f.telefone || '';
    document.getElementById('forn-email').value = f.email || '';
    
    document.getElementById('titulo-modal-fornecedor').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Fornecedor';
    modalInstanciaFornecedor.show();
}

async function salvarFornecedor() {
    const id = document.getElementById('forn-id').value;
    const dados = {
        nome_fantasia: document.getElementById('forn-nome').value,
        cnpj: document.getElementById('forn-cnpj').value,
        telefone: document.getElementById('forn-telefone').value,
        email: document.getElementById('forn-email').value
    };

    if(!dados.nome_fantasia) { mostrarAlerta("Nome é obrigatório!", "danger"); return; }

    const url = id ? `/api/fornecedores/${id}` : '/api/fornecedores';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            modalInstanciaFornecedor.hide();
            mostrarAlerta("<i class='bi bi-check-circle me-2'></i> Salvo com sucesso!");
            carregarFornecedoresTabela();
        } else { mostrarAlerta("Erro ao salvar.", "danger"); }
    } catch (error) { mostrarAlerta("Erro de conexão.", "danger"); }
}

async function alterarStatusFornecedor(id, novoStatus) {
    if(!confirm('Alterar status deste fornecedor?')) return;
    try {
        await fetch(`/api/fornecedores/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify({ status: novoStatus })
        });
        carregarFornecedoresTabela();
    } catch (e) { mostrarAlerta("Erro de conexão", "danger"); }
}