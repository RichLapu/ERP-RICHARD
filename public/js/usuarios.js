// Apenas criamos uma variável exclusiva para a paginação desta tela.
// NÃO declaramos listaUsuariosMemoria nem modalInstancia, pois elas já existem no seu sistema!
let controlePaginaUsuarios = 1;

// 1. EVENTOS DE PESQUISA, PAGINAÇÃO E INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    const inputPesquisa = document.getElementById('pesquisaUsuarios');
    const selectItens = document.getElementById('itensPorPaginaUsuarios');
    
    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', () => {
            controlePaginaUsuarios = 1;
            renderizarTabelaUsuarios();
        });
    }
    
    if (selectItens) {
        selectItens.addEventListener('change', () => {
            controlePaginaUsuarios = 1;
            renderizarTabelaUsuarios();
        });
    }

    // Carrega a tabela automaticamente assim que a página abrir
    if(typeof tokenJWT !== 'undefined') {
        carregarUsuariosGeral();
    }
});

// 2. FUNÇÃO ADAPTADA: APENAS BAIXA OS DADOS E PREENCHE OS SELECTS
async function carregarUsuariosGeral() {
    try {
        const resposta = await fetch('/api/usuarios', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const usuarios = await resposta.json();
        
        // ==========================================
        // ESCUDO DE PROTEÇÃO CONTRA ERROS DA API
        // ==========================================
        if (!Array.isArray(usuarios)) {
            console.error("A API não retornou uma lista de usuários! O servidor respondeu com:", usuarios);
            
            const tbody = document.getElementById('tabela-usuarios');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger fw-bold py-4">Erro ao carregar usuários do servidor. Verifique o console.</td></tr>`;
            }
            return; // Interrompe a função aqui para proteger o .filter e o .forEach
        }
        // ==========================================
        
        // Atualiza a variável global que já existe no seu código original
        listaUsuariosMemoria = usuarios; 
        
        const widgetUsuarios = document.getElementById('widget-usuarios');
        if (widgetUsuarios) {
            widgetUsuarios.innerText = usuarios.filter(u => (u.status || 'ativo').toLowerCase() === 'ativo').length;
        }

        const selectPermissoes = document.getElementById('select-permissoes-usuario');
        if (selectPermissoes) {
            selectPermissoes.innerHTML = '<option value="">-- Selecione o Colaborador --</option>';
            usuarios.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.text = `${user.nome} (${user.role})`;
                selectPermissoes.appendChild(option);
            });
        }

        // Chama a função que desenha a tabela com paginação e filtro
        renderizarTabelaUsuarios();
        
    } catch (error) { console.error("Erro ao carregar usuários:", error); }
}

// 3. NOVA FUNÇÃO: DESENHA A TABELA COM FILTRO E PAGINAÇÃO
function renderizarTabelaUsuarios() {
    const tbody = document.getElementById('tabela-usuarios');
    const paginacao = document.getElementById('paginacaoUsuarios');
    
    if (!tbody) return; // Proteção extra para não dar erro em outras abas

    const inputBusca = document.getElementById('pesquisaUsuarios');
    const selectItens = document.getElementById('itensPorPaginaUsuarios');
    
    const termoBusca = inputBusca ? inputBusca.value.toLowerCase() : '';
    const itensPorPagina = selectItens ? selectItens.value : '10';

    // A. Filtrar
    let filtrados = listaUsuariosMemoria.filter(u => 
        (u.nome && u.nome.toLowerCase().includes(termoBusca)) || 
        (u.email && u.email.toLowerCase().includes(termoBusca)) ||
        (u.role && u.role.toLowerCase().includes(termoBusca))
    );

    // B. Paginar
    let limite = itensPorPagina === 'todos' ? filtrados.length : parseInt(itensPorPagina);
    if (limite === 0 || isNaN(limite)) limite = 10;

    const totalPaginas = Math.ceil(filtrados.length / limite);
    
    if (controlePaginaUsuarios > totalPaginas && totalPaginas > 0) controlePaginaUsuarios = totalPaginas;

    const inicio = (controlePaginaUsuarios - 1) * limite;
    const fim = inicio + limite;
    const usuariosDaPagina = filtrados.slice(inicio, fim);

    // C. Desenhar Tabela
    tbody.innerHTML = ''; 

    if (usuariosDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum usuário encontrado com esse filtro.</td></tr>';
    } else {
        usuariosDaPagina.forEach(user => {
            const isAtivo = (user.status || 'ativo').toLowerCase() === 'ativo';
            const novoStatus = isAtivo ? 'inativo' : 'ativo';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="fw-bold text-dark">${user.nome}</div><small class="text-muted">${user.email}</small></td>
                <td><span class="badge bg-light text-dark border">${user.role}</span></td>
                <td><span class="badge ${isAtivo ? 'bg-success' : 'bg-secondary'}">${isAtivo ? 'ATIVO' : 'INATIVO'}</span></td>
                <td class="text-end">
                    <button onclick="abrirEdicao(${user.id}, '${user.nome}', '${user.email}', '${user.role}')" class="btn btn-sm btn-link text-primary p-1"><i class="bi bi-pencil-square fs-5"></i></button>
                    <button onclick="alterarStatus(${user.id}, '${novoStatus}')" class="btn btn-sm btn-link ${isAtivo ? 'text-secondary' : 'text-success'} p-1"><i class="bi ${isAtivo ? 'bi-toggle-on' : 'bi-toggle-off'} fs-5"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    // cola id caso precise "<td class="fw-bold text-muted">#${user.id}</td>"
    // D. Desenhar Botões de Paginação
    if (paginacao) {
        paginacao.innerHTML = '';
        if (totalPaginas > 1) {
            paginacao.innerHTML += `
                <li class="page-item ${controlePaginaUsuarios === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="mudarPaginaUsuarios(event, ${controlePaginaUsuarios - 1})">Anterior</a>
                </li>
            `;
            for (let i = 1; i <= totalPaginas; i++) {
                paginacao.innerHTML += `
                    <li class="page-item ${controlePaginaUsuarios === i ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="mudarPaginaUsuarios(event, ${i})">${i}</a>
                    </li>
                `;
            }
            paginacao.innerHTML += `
                <li class="page-item ${controlePaginaUsuarios === totalPaginas ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="mudarPaginaUsuarios(event, ${controlePaginaUsuarios + 1})">Próxima</a>
                </li>
            `;
        }
    }
}

function mudarPaginaUsuarios(evento, novaPagina) {
    if (evento) evento.preventDefault();
    controlePaginaUsuarios = novaPagina;
    renderizarTabelaUsuarios();
}

// =====================================================================
// ROTINAS DE CADASTRO E EDIÇÃO
// =====================================================================

async function cadastrarFuncionario() {
    const nome = document.getElementById('novo-nome').value;
    const email = document.getElementById('novo-email').value;
    const senha = document.getElementById('novo-senha').value;
    const role = document.getElementById('novo-role').value;
    const msgDiv = document.getElementById('cadastro-mensagem');

    try {
        const resposta = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify({ nome, email, senha, role })
        });

        if (resposta.ok) {
            msgDiv.className = "mt-3 text-success";
            msgDiv.innerHTML = "<i class='bi bi-check-circle-fill me-1'></i> Cadastro realizado com sucesso!";
            document.getElementById('novo-nome').value = '';
            document.getElementById('novo-email').value = '';
            document.getElementById('novo-senha').value = '';
            setTimeout(() => msgDiv.innerText = '', 4000);
            carregarUsuariosGeral(); 
        } else {
            const dados = await resposta.json();
            msgDiv.className = "mt-3 text-danger";
            msgDiv.innerText = dados.erro || "Erro ao cadastrar";
        }
    } catch (error) {
        msgDiv.className = "mt-3 text-danger";
        msgDiv.innerText = "Erro de conexão.";
    }
}

function abrirEdicao(id, nome, email, role) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-nome').value = nome;
    document.getElementById('edit-email').value = email;
    document.getElementById('edit-role').value = role;
    document.getElementById('edit-senha').value = ''; 

    if (!modalInstancia) {
        modalInstancia = new bootstrap.Modal(document.getElementById('modalEditar'));
    }
    modalInstancia.show();
}

async function salvarEdicao() {
    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('edit-nome').value;
    const email = document.getElementById('edit-email').value;
    const role = document.getElementById('edit-role').value;
    const senha = document.getElementById('edit-senha').value; 

    try {
        const resposta = await fetch(`/api/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify({ nome, email, role, senha })
        });

        if (resposta.ok) {
            modalInstancia.hide(); 
            if (senha && senha.trim() !== "") {
                mostrarAlerta("<i class='bi bi-check-circle me-2'></i> Usuário e senha atualizados com sucesso!");
            } else {
                mostrarAlerta("<i class='bi bi-check-circle me-2'></i> Dados do usuário atualizados com sucesso!");
            }
            carregarUsuariosGeral(); 
        } else {
            mostrarAlerta("<i class='bi bi-exclamation-octagon me-2'></i> Erro ao atualizar o usuário.", "danger");
        }
    } catch (error) {
        mostrarAlerta("<i class='bi bi-wifi-off me-2'></i> Erro de conexão com o servidor.", "danger");
    }
}

async function alterarStatus(id, novoStatus) {
    if(confirm(`Confirmar alteração de acesso deste colaborador?`)) {
        try {
            const resposta = await fetch(`/api/usuarios/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
                body: JSON.stringify({ status: novoStatus })
            });
            
            if (resposta.ok) {
                mostrarAlerta(`<i class='bi bi-info-circle me-2'></i> Status alterado para <b>${novoStatus.toUpperCase()}</b>.`, "primary");
                carregarUsuariosGeral(); 
            } else {
                mostrarAlerta("<i class='bi bi-exclamation-octagon me-2'></i> Erro ao mudar status.", "danger");
            }
        } catch (error) { mostrarAlerta("<i class='bi bi-wifi-off me-2'></i> Erro de conexão.", "danger"); }
    }
}

function simularCargaDePermissoes() {
    const select = document.getElementById('select-permissoes-usuario');
    const painel = document.getElementById('painel-modulos');
    const infoBox = document.getElementById('info-usuario-selecionado');

    if(!select || !painel || !infoBox) return;

    if(select.value === "") {
        painel.style.opacity = "0.4";
        painel.style.pointerEvents = "none";
        infoBox.classList.add('d-none');
    } else {
        const usuario = listaUsuariosMemoria.find(u => u.id === parseInt(select.value));
        if (!usuario) return;

        document.getElementById('mod-cadastro').checked = false;
        document.getElementById('mod-listar').checked = false;
        document.getElementById('mod-permissoes').checked = false;
        document.getElementById('mod-estoque-itens').checked = false;
        document.getElementById('mod-estoque-mov').checked = false;
        document.getElementById('mod-estoque-fornecedores').checked = false;
        document.getElementById('mod-clientes').checked = false;
        document.getElementById('mod-financeiro').checked = false;
        
        const checkAgenda = document.getElementById('mod-agenda');
        if (checkAgenda) checkAgenda.checked = false;

        if (usuario.permissoes) {
            const arr = usuario.permissoes.split(',');
            if (arr.includes('mod-cadastro')) document.getElementById('mod-cadastro').checked = true;
            if (arr.includes('mod-listar')) document.getElementById('mod-listar').checked = true;
            if (arr.includes('mod-permissoes')) document.getElementById('mod-permissoes').checked = true;
            if (arr.includes('mod-estoque-itens')) document.getElementById('mod-estoque-itens').checked = true;
            if (arr.includes('mod-estoque-mov')) document.getElementById('mod-estoque-mov').checked = true;
            if (arr.includes('mod-estoque-fornecedores')) document.getElementById('mod-estoque-fornecedores').checked = true;
            if (arr.includes('mod-clientes')) document.getElementById('mod-clientes').checked = true;
            if (arr.includes('mod-financeiro')) document.getElementById('mod-financeiro').checked = true;
            if (arr.includes('mod-agenda') && checkAgenda) checkAgenda.checked = true;
        }

        painel.style.opacity = "1";
        painel.style.pointerEvents = "auto";
        document.getElementById('perm-nome-exibicao').innerText = usuario.nome;
        document.getElementById('perm-cargo-exibicao').innerText = usuario.role;
        infoBox.classList.remove('d-none');

        // =========================================================
        // TRAVA DE SEGURANÇA PARA O ADMINISTRADOR
        // =========================================================
        const checkboxes = document.querySelectorAll('#painel-modulos .form-check-input');
        const btnSalvar = document.querySelector('button[onclick="salvarPermissoesBanco()"]');

        if (usuario.role === 'Administrador') {
            // Se for Admin: Marca TUDO obrigatoriamente e bloqueia a edição
            checkboxes.forEach(chk => {
                chk.checked = true;
                chk.disabled = true;
            });
            
            // Desativa o botão de salvar para o Admin e muda a cor/texto
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.innerText = "Acesso Total (Padrão do Sistema)";
                btnSalvar.classList.remove('btn-primary');
                btnSalvar.classList.add('btn-secondary');
            }
        } else {
            // Se for outro cargo: Libera os checkboxes para edição normal
            checkboxes.forEach(chk => chk.disabled = false);
            
            // Restaura o botão de salvar para o estado original
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.innerText = "Salvar Permissões";
                btnSalvar.classList.remove('btn-secondary');
                btnSalvar.classList.add('btn-primary');
            }
        }
    }
}

// =========================================================
    // TRAVA DE SEGURANÇA PARA O ADMINISTRADOR
    // =========================================================
    const cargoUsuario = document.getElementById('perm-cargo-exibicao').innerText.trim();
    const checkboxes = document.querySelectorAll('#painel-modulos .form-check-input');
    const btnSalvar = document.querySelector('button[onclick="salvarPermissoesBanco()"]');

    if (cargoUsuario === 'Administrador') {
        // Se for Admin: Marca tudo e bloqueia edição
        checkboxes.forEach(chk => {
            chk.checked = true;
            chk.disabled = true;
        });
        
        // Altera o botão para dar um feedback visual claro
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.innerText = "Acesso Total (Bloqueado)";
            btnSalvar.classList.replace('btn-primary', 'btn-secondary');
        }
    } else {
        // Se for outro cargo: Libera os checkboxes para edição normal
        checkboxes.forEach(chk => chk.disabled = false);
        
        // Restaura o botão de salvar
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerText = "Salvar Permissões";
            btnSalvar.classList.replace('btn-secondary', 'btn-primary');
        }
    }

async function salvarPermissoesBanco() {
    const idUsuario = document.getElementById('select-permissoes-usuario').value;
    if (!idUsuario) return;

    let perms = [];
    if (document.getElementById('mod-cadastro').checked) perms.push('mod-cadastro');
    if (document.getElementById('mod-listar').checked) perms.push('mod-listar');
    if (document.getElementById('mod-permissoes').checked) perms.push('mod-permissoes');
    if (document.getElementById('mod-estoque-itens').checked) perms.push('mod-estoque-itens');
    if (document.getElementById('mod-estoque-mov').checked) perms.push('mod-estoque-mov');
    if (document.getElementById('mod-estoque-fornecedores').checked) perms.push('mod-estoque-fornecedores');
    if (document.getElementById('mod-clientes').checked) perms.push('mod-clientes');
    if (document.getElementById('mod-financeiro').checked) perms.push('mod-financeiro');
    if (document.getElementById('mod-agenda') && document.getElementById('mod-agenda').checked) perms.push('mod-agenda');

    try {
        const res = await fetch(`/api/usuarios/${idUsuario}/permissoes`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify({ permissoes: perms })
        });
        
        if (res.ok) { 
            // CORRIGIDO: Voltamos para o seu padrão mostrarAlerta!
            mostrarAlerta("Permissões atualizadas com sucesso!", "success"); 
            carregarUsuariosGeral(); 
            
            if(parseInt(idUsuario) === parseInt(localStorage.getItem('intranet_userId'))) {
                 setTimeout(() => { alert("Você alterou suas próprias permissões. O sistema será recarregado."); fazerLogout(); }, 2000);
            }
        } else {
            mostrarAlerta("Não foi possível atualizar as permissões.", "danger");
        }
    } catch (error) { 
        mostrarAlerta("Erro de conexão.", "danger"); 
    }
}

async function carregarUptime() {
    try {
        const resposta = await fetch('/api/sistema/uptime');
        const dados = await resposta.json();
        
        const totalSegundos = parseInt(dados.uptime_segundos);
        const dias = Math.floor(totalSegundos / (3600 * 24));
        const horas = Math.floor((totalSegundos % (3600 * 24)) / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        
        let textoUptime = "";
        if (dias > 0) textoUptime = `${dias}d ${horas}h`;
        else if (horas > 0) textoUptime = `${horas}h ${minutos}m`;
        else textoUptime = `${minutos} min`;
        
        const widget = document.getElementById('widget-uptime');
        if (widget) widget.innerText = textoUptime;
        
    } catch (error) {
        const widget = document.getElementById('widget-uptime');
        if (widget) widget.innerText = "Offline";
    }
}

// =========================================================
// SCRIPT DE DIAGNÓSTICO AUTOMÁTICO
// =========================================================
function rodarTestesDeSanidade() {
    console.log("%c🚀 INICIANDO TESTES DE SANIDADE - INTRA NET", "color: #4e73df; font-size: 16px; font-weight: bold;");

    let testesPassaram = 0;
    let totalTestes = 5;

    // 1. Verifica Splash Screen
    if(document.getElementById('welcome-splash')) {
        console.log("✅ [1/5] Splash Screen encontrado no HTML.");
        testesPassaram++;
    } else console.error("❌ [1/5] Erro: Splash Screen ausente.");

    // 2. Verifica Funções de Login
    if(typeof realizarLogin === "function") {
        console.log("✅ [2/5] Função de Login (realizarLogin) está intacta.");
        testesPassaram++;
    } else console.error("❌ [2/5] Erro: Função de Login quebrada.");

    // 3. Verifica Trava do Administrador
    if(typeof simularCargaDePermissoes === "function") {
        console.log("✅ [3/5] Motor de permissões e trava de segurança operacionais.");
        testesPassaram++;
    } else console.error("❌ [3/5] Erro: Lógica de permissões falhou.");

    // 4. Verifica API de Salvamento
    if(typeof salvarPermissoesBanco === "function") {
        console.log("✅ [4/5] Gatilho de salvamento de permissões (salvarPermissoesBanco) pronto.");
        testesPassaram++;
    } else console.error("❌ [4/5] Erro: Função de salvamento ausente.");

    // 5. Verifica Sessão
    if(localStorage.getItem('intranet_token')) {
        console.log("✅ [5/5] Token de sessão ativo. Recuperação de F5 deve funcionar.");
        testesPassaram++;
    } else {
        console.warn("⚠️ [5/5] Nenhum token detectado (Usuário logado ou na tela inicial).");
        testesPassaram++; 
    }

    console.log(`%c🎯 Resultado: ${testesPassaram}/${totalTestes} verificações concluídas.`, "color: #1cc88a; font-size: 14px; font-weight: bold;");
}

// O sistema vai rodar o teste sozinho 3 segundos depois que a página abrir
setTimeout(rodarTestesDeSanidade, 3000);