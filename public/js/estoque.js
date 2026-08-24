let modalInstanciaNovoItem = null;
let modalInstanciaMovimentacao = null;
let listaEstoqueMemoria = [];
let listaMovimentacoesMemoria = [];

// ================= GERENCIAMENTO DE ITENS ================= //

async function abrirModalNovoItem() {
    if (!modalInstanciaNovoItem) modalInstanciaNovoItem = new bootstrap.Modal(document.getElementById('modalNovoItem'));
    
    document.getElementById('item-id').value = ''; 
    document.getElementById('item-codigo').value = '';
    document.getElementById('item-nome').value = '';
    document.getElementById('item-marca').value = ''; // NOVO
    document.getElementById('item-categoria').value = '';
    document.getElementById('item-minimo').value = '5';
    document.getElementById('item-custo').value = '';
    document.getElementById('item-venda').value = '';
    document.getElementById('item-descricao').value = '';
    
    document.getElementById('titulo-modal-item').innerHTML = '<i class="bi bi-box-seam me-2"></i>Cadastrar Novo Produto';
    document.getElementById('btn-salvar-item').setAttribute('onclick', 'salvarNovoItem()');
    document.getElementById('btn-salvar-item').innerText = 'Salvar Produto';
    
    // NOVO: Busca os fornecedores para a lista suspensa
    try {
        const resposta = await fetch('/api/fornecedores', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const fornecedores = await resposta.json();
        const selectForn = document.getElementById('item-fornecedor');
        selectForn.innerHTML = '<option value="">-- Sem fornecedor vinculado --</option>';
        fornecedores.forEach(f => {
            selectForn.innerHTML += `<option value="${f.id}">${f.nome_fantasia}</option>`;
        });
    } catch (e) { console.error(e); }

    modalInstanciaNovoItem.show();
}

async function salvarNovoItem() {
    const dados = {
        codigo_sku: document.getElementById('item-codigo').value,
        nome: document.getElementById('item-nome').value,
        marca: document.getElementById('item-marca').value,
        fornecedor_id: document.getElementById('item-fornecedor').value || null,
        categoria: document.getElementById('item-categoria').value,
        estoque_minimo: document.getElementById('item-minimo').value,
        preco_custo: document.getElementById('item-custo').value,
        preco_venda: document.getElementById('item-venda').value,
        descricao: document.getElementById('item-descricao').value
    };

    if(!dados.nome) {
        mostrarAlerta("O nome do produto é obrigatório!", "danger");
        return;
    }

    try {
        const resposta = await fetch('/api/estoque/itens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            modalInstanciaNovoItem.hide();
            mostrarAlerta("<i class='bi bi-check-circle me-2'></i> Produto cadastrado!");
            carregarEstoqueItens(); // Atualiza a tabela imediatamente
        } else {
            mostrarAlerta("Erro ao cadastrar produto.", "danger");
        }
    } catch (error) { mostrarAlerta("Erro de conexão.", "danger"); }
}

async function abrirEdicaoItem(id) {
    const item = listaEstoqueMemoria.find(i => i.id === id);
    if(!item) return;

    if (!modalInstanciaNovoItem) modalInstanciaNovoItem = new bootstrap.Modal(document.getElementById('modalNovoItem'));

    // 1. Busca os fornecedores no banco de dados PRIMEIRO
    try {
        const resposta = await fetch('/api/fornecedores', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const fornecedores = await resposta.json();
        const selectForn = document.getElementById('item-fornecedor');
        selectForn.innerHTML = '<option value="">-- Sem fornecedor vinculado --</option>';
        fornecedores.forEach(f => {
            selectForn.innerHTML += `<option value="${f.id}">${f.nome_fantasia}</option>`;
        });
    } catch (e) { console.error(e); }

    // 2. Depois de montar a lista, preenche o modal com os dados do produto
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-codigo').value = item.codigo_sku || '';
    document.getElementById('item-nome').value = item.nome;
    document.getElementById('item-marca').value = item.marca || '';                 // Lendo a Marca
    document.getElementById('item-fornecedor').value = item.fornecedor_id || '';    // Selecionando o Fornecedor
    document.getElementById('item-categoria').value = item.categoria || '';
    document.getElementById('item-minimo').value = item.estoque_minimo;
    document.getElementById('item-custo').value = item.preco_custo;
    document.getElementById('item-venda').value = item.preco_venda;
    document.getElementById('item-descricao').value = item.descricao || '';

    // Muda o visual para "Editar"
    document.getElementById('titulo-modal-item').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Produto';
    document.getElementById('btn-salvar-item').setAttribute('onclick', 'salvarEdicaoItem()');
    document.getElementById('btn-salvar-item').innerText = 'Atualizar Produto';

    modalInstanciaNovoItem.show();
}

async function salvarEdicaoItem() {
    const id = document.getElementById('item-id').value;
    
    // Capturando os novos campos na variável 'dados'
    const dados = {
        codigo_sku: document.getElementById('item-codigo').value,
        nome: document.getElementById('item-nome').value,
        marca: document.getElementById('item-marca').value,                     // Salvando a Marca
        fornecedor_id: document.getElementById('item-fornecedor').value || null, // Salvando o Fornecedor
        categoria: document.getElementById('item-categoria').value,
        estoque_minimo: document.getElementById('item-minimo').value,
        preco_custo: document.getElementById('item-custo').value,
        preco_venda: document.getElementById('item-venda').value,
        descricao: document.getElementById('item-descricao').value
    };

    if(!dados.nome) {
        mostrarAlerta("O nome do produto é obrigatório!", "danger");
        return;
    }

    try {
        const resposta = await fetch(`/api/estoque/itens/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            modalInstanciaNovoItem.hide();
            mostrarAlerta("<i class='bi bi-check-circle me-2'></i> Produto atualizado com sucesso!");
            carregarEstoqueItens(); 
        } else {
            mostrarAlerta("Erro ao atualizar produto.", "danger");
        }
    } catch (error) { mostrarAlerta("Erro de conexão.", "danger"); }
}

async function carregarEstoqueItens() {
    try {
        const resposta = await fetch('/api/estoque/itens', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const itens = await resposta.json();
        
        listaEstoqueMemoria = itens; 
        
        const tbody = document.getElementById('tabela-estoque-itens');
        if(!tbody) return;
        
        tbody.innerHTML = ''; 

        itens.forEach(item => {
            const alertaMinimo = item.quantidade_atual <= item.estoque_minimo ? 
                `<span class="badge bg-danger ms-2" title="Estoque Baixo!"><i class="bi bi-exclamation-triangle"></i></span>` : '';
            
            // Tratamento de campos vazios para ficarem elegantes na tabela
            const nomeCategoria = item.categoria ? item.categoria : '-';
            const nomeMarca = item.marca ? item.marca : '-';
            const nomeFornecedor = item.fornecedor_nome ? item.fornecedor_nome : '<span class="text-muted italic">Não vinculado</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-muted fw-bold">${item.codigo_sku || '-'}</td>
                <td><div class="fw-bold text-dark">${item.nome}</div></td>
                
                <!-- A NOVA COLUNA DE CATEGORIA SEPARADA AQUI -->
                <td class="text-muted">${nomeCategoria}</td> 
                
                <td class="text-muted">${nomeMarca}</td>
                <td class="small"><i class="bi bi-truck text-muted me-1"></i>${nomeFornecedor}</td>
                <td><span class="fs-5 fw-bold">${item.quantidade_atual}</span> ${alertaMinimo}</td>
                <td><span class="badge bg-success">ATIVO</span></td>
                <td class="text-end">
                    <button onclick="abrirEdicaoItem(${item.id})" class="btn btn-sm btn-link text-primary p-1" title="Editar Produto">
                        <i class="bi bi-pencil-square fs-5"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Erro ao carregar estoque", error); }
}

// ================= FLUXO DE MOVIMENTAÇÕES ================= //

async function abrirModalMovimentacao() {
    if (!modalInstanciaMovimentacao) modalInstanciaMovimentacao = new bootstrap.Modal(document.getElementById('modalMovimentacao'));
    
    document.getElementById('mov-id').value = '';
    document.getElementById('mov-quantidade').value = '1';
    document.getElementById('mov-obs').value = '';
    
    // Libera os campos que podem ser bloqueados na edição
    document.getElementById('mov-tipo').disabled = false;
    document.getElementById('mov-produto-id').disabled = false;
    
    // Restaura o visual
    document.getElementById('titulo-modal-mov').innerHTML = '<i class="bi bi-arrow-left-right me-2"></i>Registrar Movimentação';
    document.getElementById('btn-salvar-mov').innerText = 'Confirmar Lançamento';

    try {
        const resposta = await fetch('/api/estoque/itens', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const itens = await resposta.json();
        const select = document.getElementById('mov-produto-id');
        select.innerHTML = '<option value="">-- Selecione o produto --</option>';
        itens.forEach(item => { select.innerHTML += `<option value="${item.id}">${item.nome} (Estoque: ${item.quantidade_atual})</option>`; });
    } catch (error) { console.error("Erro ao carregar itens para select"); }
    
    modalInstanciaMovimentacao.show();
}

// NOVA FUNÇÃO: Abre a edição (bloqueando o tipo de produto e ação, permitindo mudar só a quantidade)
function abrirEdicaoMovimentacao(id) {
    const mov = listaMovimentacoesMemoria.find(m => m.id === id);
    if(!mov) return;

    if (!modalInstanciaMovimentacao) modalInstanciaMovimentacao = new bootstrap.Modal(document.getElementById('modalMovimentacao'));

    document.getElementById('mov-id').value = mov.id;
    document.getElementById('mov-quantidade').value = mov.quantidade;
    document.getElementById('mov-obs').value = mov.observacao || '';
    
    // Bloqueia a alteração do tipo e do produto (por segurança)
    document.getElementById('mov-tipo').innerHTML = `<option value="${mov.tipo}">${mov.tipo.toUpperCase()}</option>`;
    document.getElementById('mov-tipo').disabled = true;
    
    document.getElementById('mov-produto-id').innerHTML = `<option value="${mov.item_id}">${mov.produto_nome}</option>`;
    document.getElementById('mov-produto-id').disabled = true;

    document.getElementById('titulo-modal-mov').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Quantidade (Tolerância)';
    document.getElementById('btn-salvar-mov').innerText = 'Atualizar Registro';

    modalInstanciaMovimentacao.show();
}

// Renomeie a função para salvarMovimentacaoEstoque
async function salvarMovimentacaoEstoque() {
    const idEdicao = document.getElementById('mov-id').value;
    const dados = {
        tipo: document.getElementById('mov-tipo').value,
        item_id: document.getElementById('mov-produto-id').value,
        quantidade: document.getElementById('mov-quantidade').value,
        observacao: document.getElementById('mov-obs').value
    };

    if(!dados.item_id || dados.quantidade < 1) {
        mostrarAlerta("Informe uma quantidade válida!", "danger"); return;
    }

    try {
        const url = idEdicao ? `/api/estoque/movimentacoes/${idEdicao}` : '/api/estoque/movimentacoes';
        const metodo = idEdicao ? 'PUT' : 'POST';

        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            modalInstanciaMovimentacao.hide();
            mostrarAlerta(`<i class='bi bi-check-circle me-2'></i> Movimentação ${idEdicao ? 'atualizada' : 'registrada'}!`);
            carregarMovimentacoes();
            carregarEstoqueItens(); 
        } else {
            const erro = await resposta.json();
            mostrarAlerta(erro.erro || "Erro ao registrar.", "danger");
        }
    } catch (error) { mostrarAlerta("Erro de conexão.", "danger"); }
}

async function carregarMovimentacoes() {
    try {
        const resposta = await fetch('/api/estoque/movimentacoes', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const movs = await resposta.json();
        
        listaMovimentacoesMemoria = movs; 
        
        const tbody = document.getElementById('tabela-estoque-mov');
        if(!tbody) return;
        tbody.innerHTML = ''; 

        movs.forEach(mov => {
            const dataFormatada = new Date(mov.data_movimentacao).toLocaleString('pt-BR');
            const isCancelado = mov.status === 'cancelado';
            const podeEditar = mov.minutos_passados <= 5 && !isCancelado;
            
            let corBadge = 'bg-secondary';
            if(mov.tipo === 'entrada') corBadge = 'bg-success';
            if(mov.tipo === 'retirada') corBadge = 'bg-danger';
            if(mov.tipo === 'devolucao') corBadge = 'bg-warning text-dark';
            if(isCancelado) corBadge = 'bg-dark opacity-50'; 

            const estiloLinha = isCancelado ? 'text-decoration-line-through text-muted opacity-50' : '';

            // Lógica do crachá de "Editado"
            let infoEdicao = '';
            if (mov.editor_nome) {
                // Pega apenas o primeiro nome para não quebrar o layout
                const primeiroNomeEditor = mov.editor_nome.split(' ')[0];
                infoEdicao = `<br><span class="badge bg-warning text-dark mt-1" style="font-size: 0.65rem;" title="Editado em: ${new Date(mov.editado_em).toLocaleString('pt-BR')}">Editado por: ${primeiroNomeEditor}</span>`;
            }

            // Lógica dos Botões de Ação
            let botoesAcao = '';
            if(!isCancelado) {
                if(podeEditar) {
                    // Botão azul ativo
                    botoesAcao += `<button onclick="abrirEdicaoMovimentacao(${mov.id})" class="btn btn-sm btn-outline-primary p-1 me-1" title="Editar Registro"><i class="bi bi-pencil"></i></button>`;
                } else {
                    // Botão cinza desativado com alerta
                    botoesAcao += `<button onclick="alertaEdicaoExpirada()" class="btn btn-sm btn-outline-secondary p-1 me-1" title="Tempo de edição esgotado"><i class="bi bi-pencil"></i></button>`;
                }
                
                // Botão de cancelar fica sempre disponível
                botoesAcao += `<button onclick="cancelarMovimentacao(${mov.id})" class="btn btn-sm btn-outline-danger p-1" title="Estornar Movimentação"><i class="bi bi-x-circle"></i></button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="small text-muted ${estiloLinha}">${dataFormatada}</td>
                <td class="fw-bold ${isCancelado ? 'text-muted' : 'text-dark'} ${estiloLinha}">${mov.produto_nome}</td>
                <td><span class="badge ${corBadge}">${isCancelado ? 'CANCELADO' : mov.tipo.toUpperCase()}</span></td>
                <td class="fw-bold ${estiloLinha}">${mov.quantidade}</td>
                <td class="small text-muted ${estiloLinha}">
                    <i class="bi bi-person me-1"></i>${mov.usuario_nome.split(' ')[0]}
                    ${infoEdicao}
                </td>
                <td class="text-end">${botoesAcao}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Erro ao carregar movimentacoes", error); }
}

// Nova função para disparar o aviso ao clicar no botão cinza
function alertaEdicaoExpirada() {
    mostrarAlerta("<i class='bi bi-clock-history me-2'></i> O prazo de 5 minutos para edição excedeu. Cancele este registro e crie um novo.", "warning");
}

async function cancelarMovimentacao(id) {
    if(!confirm("Atenção: Deseja CANCELAR esta movimentação?\nO saldo do estoque será revertido.")) return;
    try {
        const resposta = await fetch(`/api/estoque/movimentacoes/${id}/cancelar`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${tokenJWT}` }
        });
        if (resposta.ok) {
            mostrarAlerta("<i class='bi bi-arrow-counterclockwise me-2'></i> Movimentação estornada!", "warning");
            carregarMovimentacoes(); carregarEstoqueItens();
        } else {
            const erro = await resposta.json();
            mostrarAlerta(erro.erro || "Erro ao cancelar.", "danger");
        }
    } catch (error) { mostrarAlerta("Erro de conexão.", "danger"); }
}