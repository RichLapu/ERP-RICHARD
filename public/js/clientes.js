// ================= CONTROLE PF / PJ ================= //
function alternarTipoCliente() {
    const isPJ = document.getElementById('tipo_pj').checked;
    
    // Altera os rótulos
    document.getElementById('label-nome').innerText = isPJ ? 'RAZÃO SOCIAL *' : 'NOME COMPLETO *';
    document.getElementById('label-documento').innerText = isPJ ? 'CNPJ *' : 'CPF *';
    document.getElementById('label-rg-ie').innerText = isPJ ? 'INSCRIÇÃO ESTADUAL (IE)' : 'RG';
    
    // Exibe ou esconde o Nome Fantasia
    document.getElementById('box-fantasia').style.display = isPJ ? 'block' : 'none';
    
    // Limpa os campos de documento ao trocar para não misturar formatações
    document.getElementById('cli-documento').value = '';
    document.getElementById('cli-rg-ie').value = '';
}

// ================= AUTOPREENCHIMENTO DO CEP ================= //
async function buscarCEP() {
    const cepInput = document.getElementById('cli-cep');
    const cepValor = cepInput.value.replace(/\D/g, ''); // Tira o traço

    if (cepValor.length === 8) {
        try {
            // Chama a API gratuita dos Correios (ViaCEP)
            const resposta = await fetch(`https://viacep.com.br/ws/${cepValor}/json/`);
            const dados = await resposta.json();

            if (!dados.erro) {
                document.getElementById('cli-endereco').value = dados.logradouro;
                document.getElementById('cli-bairro').value = dados.bairro;
                document.getElementById('cli-cidade').value = dados.localidade;
                document.getElementById('cli-uf').value = dados.uf;
                
                // Joga o ponteiro de digitação direto para o campo de número
                document.getElementById('cli-numero').focus(); 
            } else {
                mostrarAlerta("CEP não encontrado.", "warning");
            }
        } catch (error) {
            console.error("Erro ao buscar CEP", error);
        }
    }
}

// ================= MÁSCARAS ================= //
function aplicarMascaraCEP(input) {
    let v = input.value.replace(/\D/g, "");
    v = v.replace(/^(\d{5})(\d)/, "$1-$2");
    input.value = v.substring(0, 9);
}

function aplicarMascaraDoc(input) {
    const isPJ = document.getElementById('tipo_pj').checked;
    let v = input.value.replace(/\D/g, "");
    
    if (isPJ) { // Máscara de CNPJ
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
        input.value = v.substring(0, 18);
    } else {    // Máscara de CPF
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
        input.value = v.substring(0, 14);
    }
}

let modalInstanciaCliente = null;
let listaClientesMemoria = [];

async function carregarClientesTabela() {
    try {
        const resposta = await fetch('/api/clientes', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const clientes = await resposta.json();
        
        listaClientesMemoria = clientes;
        const tbody = document.getElementById('tabela-clientes');
        if(!tbody) return;
        tbody.innerHTML = ''; 

        clientes.forEach(c => {
            const isAtivo = c.status === 'ativo';
            const novoStatus = isAtivo ? 'inativo' : 'ativo';
            const badgeTipo = c.tipo_pessoa === 'PJ' ? '<span class="badge bg-dark">PJ</span>' : '<span class="badge bg-info text-dark">PF</span>';
            const nomeExibicao = c.tipo_pessoa === 'PJ' && c.nome_fantasia ? `${c.nome_razao}<br><small class="text-muted">${c.nome_fantasia}</small>` : c.nome_razao;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${badgeTipo}</td>
                <td class="fw-bold text-dark">${nomeExibicao}</td>
                <td class="text-muted">${c.cpf_cnpj || '-'}</td>
                <td class="text-muted small">
                    ${c.celular_whats ? `<div><i class="bi bi-whatsapp text-success me-1"></i>${c.celular_whats}</div>` : ''}
                    ${c.email ? `<div><i class="bi bi-envelope me-1"></i>${c.email}</div>` : ''}
                </td>
                <td class="text-muted small">${c.cidade || '-'}/${c.uf || '-'}</td>
                <td><span class="badge ${isAtivo ? 'bg-success' : 'bg-secondary'}">${isAtivo ? 'ATIVO' : 'INATIVO'}</span></td>
                <td class="text-end">
                    <button onclick="abrirEdicaoCliente(${c.id})" class="btn btn-sm btn-link text-primary p-1"><i class="bi bi-pencil-square fs-5"></i></button>
                    <button onclick="alterarStatusCliente(${c.id}, '${novoStatus}')" class="btn btn-sm btn-link ${isAtivo ? 'text-secondary' : 'text-success'} p-1"><i class="bi ${isAtivo ? 'bi-toggle-on' : 'bi-toggle-off'} fs-5"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Erro", error); }
}

function abrirModalCliente() {
    if (!modalInstanciaCliente) modalInstanciaCliente = new bootstrap.Modal(document.getElementById('modalCliente'));
    
    // Zera tudo
    document.getElementById('cli-id').value = '';
    document.getElementById('tipo_pf').checked = true;
    alternarTipoCliente(); // Força o visual para PF

    const campos = ['nome', 'fantasia', 'documento', 'rg-ie', 'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'email', 'telefone', 'celular', 'observacao'];
    campos.forEach(c => document.getElementById(`cli-${c}`).value = '');

    document.getElementById('titulo-modal-cliente').innerHTML = '<i class="bi bi-people me-2"></i>Cadastrar Cliente';
    modalInstanciaCliente.show();
}

function abrirEdicaoCliente(id) {
    const c = listaClientesMemoria.find(x => x.id === id);
    if(!c) return;

    if (!modalInstanciaCliente) modalInstanciaCliente = new bootstrap.Modal(document.getElementById('modalCliente'));

    document.getElementById('cli-id').value = c.id;
    document.getElementById(c.tipo_pessoa === 'PJ' ? 'tipo_pj' : 'tipo_pf').checked = true;
    alternarTipoCliente(); 

    document.getElementById('cli-nome').value = c.nome_razao || '';
    document.getElementById('cli-fantasia').value = c.nome_fantasia || '';
    document.getElementById('cli-documento').value = c.cpf_cnpj || '';
    
    // O campo rg_ie permite letras (como ISENTO)
    document.getElementById('cli-rg-ie').value = c.rg_ie || ''; 
    
    document.getElementById('cli-cep').value = c.cep || '';
    document.getElementById('cli-endereco').value = c.endereco || '';
    document.getElementById('cli-numero').value = c.numero || '';
    document.getElementById('cli-complemento').value = c.complemento || '';
    document.getElementById('cli-bairro').value = c.bairro || '';
    document.getElementById('cli-cidade').value = c.cidade || '';
    document.getElementById('cli-uf').value = c.uf || '';
    document.getElementById('cli-email').value = c.email || '';
    document.getElementById('cli-telefone').value = c.telefone || '';
    document.getElementById('cli-celular').value = c.celular_whats || '';
    document.getElementById('cli-observacao').value = c.observacao || '';

    document.getElementById('titulo-modal-cliente').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Cliente';
    modalInstanciaCliente.show();
}

async function salvarCliente() {
    const id = document.getElementById('cli-id').value;
    const isPJ = document.getElementById('tipo_pj').checked;
    
    const dados = {
        tipo_pessoa: isPJ ? 'PJ' : 'PF',
        nome_razao: document.getElementById('cli-nome').value,
        nome_fantasia: isPJ ? document.getElementById('cli-fantasia').value : null,
        cpf_cnpj: document.getElementById('cli-documento').value,
        rg_ie: document.getElementById('cli-rg-ie').value,
        cep: document.getElementById('cli-cep').value,
        endereco: document.getElementById('cli-endereco').value,
        numero: document.getElementById('cli-numero').value,
        complemento: document.getElementById('cli-complemento').value,
        bairro: document.getElementById('cli-bairro').value,
        cidade: document.getElementById('cli-cidade').value,
        uf: document.getElementById('cli-uf').value,
        email: document.getElementById('cli-email').value,
        telefone: document.getElementById('cli-telefone').value,
        celular_whats: document.getElementById('cli-celular').value,
        observacao: document.getElementById('cli-observacao').value
    };

    if(!dados.nome_razao) { mostrarAlerta("Nome/Razão Social é obrigatório!", "danger"); return; }
    if(!dados.cpf_cnpj) { mostrarAlerta("CPF/CNPJ é obrigatório!", "danger"); return; }

    const url = id ? `/api/clientes/${id}` : '/api/clientes';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            modalInstanciaCliente.hide();
            mostrarAlerta("<i class='bi bi-check-circle me-2'></i> Cliente salvo com sucesso!");
            carregarClientesTabela();
        } else { 
            const erro = await resposta.json();
            mostrarAlerta(erro.erro || "Erro interno ao salvar.", "danger"); 
        }
    } catch (error) { mostrarAlerta("Erro de conexão.", "danger"); }
}

async function alterarStatusCliente(id, novoStatus) {
    if(!confirm('Deseja realmente alterar o status deste cliente?')) return;
    try {
        await fetch(`/api/clientes/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify({ status: novoStatus })
        });
        carregarClientesTabela();
    } catch (e) { mostrarAlerta("Erro de conexão", "danger"); }
}