let calendario;
let modalInstanciaAgenda = null;

async function inicializarCalendario() {
    const calendarEl = document.getElementById('calendario');
    if (!calendarEl) return;

    await carregarFiltroColaboradores();

    if (calendario) {
        calendario.refetchEvents();
        return;
    }

    calendario = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br',
        initialView: 'timeGridWeek',
        
        // CORREÇÃO 1 e 3: Cabeçalho organizado e com a visão de Mês incluída
        headerToolbar: {
            left: 'prev,next today', // Setas e "Hoje" agrupados na esquerda
            center: 'title',         // Título isolado e centralizado com espaço de sobra
            right: 'timeGridWeek,timeGridDay,dayGridMonth' // Botão de mês adicionado
        },
        buttonText: { 
            today: 'Hoje',
            timeGridWeek: 'Semana', 
            timeGridDay: 'Dia',
            dayGridMonth: 'Mês' // Tradução do botão
        },
        
        slotMinTime: '07:00:00',
        slotMaxTime: '20:00:00',
        slotDuration: '00:15:00',
        slotLabelInterval: '01:00',
        allDaySlot: false,
        selectable: true,
        slotEventOverlap: false,
        
        // CORREÇÃO 2: Remove as barras de rolagem internas duplas
        contentHeight: 'auto', 

        events: async function(info, successCallback, failureCallback) {
            try {
                const resposta = await fetch('/api/agenda', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
                const eventosDB = await resposta.json();
                
                const filtroColab = document.getElementById('filtro-agenda-colaborador').value;
                const eventosFiltrados = (filtroColab === 'todos') 
                    ? eventosDB 
                    : eventosDB.filter(e => String(e.colaborador_id) === filtroColab);

                document.getElementById('qtd-agendados').innerText = eventosFiltrados.length;
                document.getElementById('qtd-finalizados').innerText = '0'; 

                const formatados = eventosFiltrados.map(e => ({
                    id: e.id,
                    title: e.titulo,
                    start: e.data_hora_inicio,
                    end: e.data_hora_fim,
                    backgroundColor: e.cor,
                    extendedProps: {
                        colaborador_id: e.colaborador_id,
                        colaborador_nome: e.colaborador_nome || 'Sistema',
                        nome_externo: e.nome_externo || '',
                        observacoes: e.observacoes || ''
                    }
                }));
                successCallback(formatados);
            } catch (error) {
                failureCallback(error);
            }
        },
        
        eventContent: function(arg) {
            const externo = arg.event.extendedProps.nome_externo ? `<div style="font-size:0.65rem; margin-top:1px; opacity:0.9;">Ext: ${arg.event.extendedProps.nome_externo}</div>` : '';
            const colab = arg.event.extendedProps.colaborador_nome.split(' ')[0];
            
            let customHtml = `
                <div style="padding: 2px 5px; line-height: 1.15; overflow: hidden; height: 100%;">
                    <div style="font-weight: 800; font-size: 0.75rem; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${arg.event.title}</div>
                    <div style="font-size: 0.65rem; margin-top: 2px; font-weight: 600;">${arg.timeText} - ${colab}</div>
                    ${externo}
                </div>
            `;
            return { html: customHtml };
        },

        select: function(info) {
            abrirModalAgenda(info.startStr, info.endStr);
        },
        eventClick: function(info) {
            const eventObj = info.event;
            eventObj.extendedProps.tituloOriginal = eventObj.title; 
            editarAgendamento(eventObj);
        }
    });

    calendario.render();
}

// Preenche o Menu Lateral Esquerdo
async function carregarFiltroColaboradores() {
    try {
        const resposta = await fetch('/api/usuarios', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const usuarios = await resposta.json();
        const select = document.getElementById('filtro-agenda-colaborador');
        
        if (select.options.length <= 1) {
            usuarios.filter(u => u.status === 'ativo').forEach(u => {
                select.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
            });
        }
    } catch (e) { console.error("Erro ao carregar filtro"); }
}

// Disparado ao trocar o nome no Menu Esquerdo
function filtrarCalendario() {
    const select = document.getElementById('filtro-agenda-colaborador');
    const nome = select.options[select.selectedIndex].text;
    const img = document.getElementById('agenda-avatar-filtro');
    
    if(select.value === 'todos') {
        img.src = '';
        img.style.opacity = '0';
    } else {
        img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=4e73df&color=fff&size=128`;
        img.style.opacity = '1';
    }

    if (calendario) calendario.refetchEvents();
}

async function abrirModalAgenda(startStr = '', endStr = '') {
    if (!modalInstanciaAgenda) modalInstanciaAgenda = new bootstrap.Modal(document.getElementById('modalAgenda'));
    
    document.getElementById('age-id').value = '';
    document.getElementById('age-titulo').value = '';
    document.getElementById('age-externo').value = '';
    document.getElementById('age-obs').value = '';
    document.getElementById('age-cor').value = '#4e73df';
    
    document.getElementById('age-inicio').value = startStr ? startStr.substring(0, 16) : '';
    document.getElementById('age-fim').value = endStr ? endStr.substring(0, 16) : '';

    document.getElementById('btn-cancelar-age').classList.add('d-none');
    document.getElementById('titulo-modal-agenda').innerHTML = '<i class="bi bi-calendar me-2"></i>Novo Agendamento';

    await carregarColaboradoresFormulario();
    
    // Se tiver um colaborador filtrado na tela, já preenche no modal!
    const filtro = document.getElementById('filtro-agenda-colaborador').value;
    if(filtro !== 'todos') document.getElementById('age-colaborador').value = filtro;

    modalInstanciaAgenda.show();
}

async function editarAgendamento(event) {
    if (!modalInstanciaAgenda) modalInstanciaAgenda = new bootstrap.Modal(document.getElementById('modalAgenda'));

    document.getElementById('age-id').value = event.id;
    document.getElementById('age-titulo').value = event.extendedProps.tituloOriginal;
    document.getElementById('age-externo').value = event.extendedProps.nome_externo || '';
    document.getElementById('age-obs').value = event.extendedProps.observacoes || '';
    document.getElementById('age-cor').value = event.backgroundColor;

    const pad = (n) => n < 10 ? '0' + n : n;
    const formatInput = (dateObj) => `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
    
    document.getElementById('age-inicio').value = formatInput(event.start);
    document.getElementById('age-fim').value = event.end ? formatInput(event.end) : formatInput(event.start);

    document.getElementById('btn-cancelar-age').classList.remove('d-none');
    document.getElementById('titulo-modal-agenda').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Agendamento';

    await carregarColaboradoresFormulario(event.extendedProps.colaborador_id);
    modalInstanciaAgenda.show();
}

async function salvarAgendamento() {
    const id = document.getElementById('age-id').value;
    const dados = {
        colaborador_id: document.getElementById('age-colaborador').value,
        nome_externo: document.getElementById('age-externo').value,
        titulo: document.getElementById('age-titulo').value,
        data_hora_inicio: document.getElementById('age-inicio').value,
        data_hora_fim: document.getElementById('age-fim').value,
        cor: document.getElementById('age-cor').value,
        observacoes: document.getElementById('age-obs').value
    };

    if(!dados.titulo || !dados.data_hora_inicio || !dados.data_hora_fim || !dados.colaborador_id) {
        mostrarAlerta("Preencha os campos obrigatórios!", "danger"); return;
    }

    const url = id ? `/api/agenda/${id}` : '/api/agenda';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenJWT}` },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            modalInstanciaAgenda.hide();
            mostrarAlerta("Agendamento salvo!");
            calendario.refetchEvents();
        } else { mostrarAlerta("Erro ao salvar", "danger"); }
    } catch (e) { mostrarAlerta("Erro de conexão", "danger"); }
}

async function cancelarAgendamento() {
    const id = document.getElementById('age-id').value;
    if(!confirm("Deseja cancelar este agendamento? Ele será removido da grade.")) return;
    
    try {
        const resposta = await fetch(`/api/agenda/${id}/cancelar`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${tokenJWT}` }
        });
        if (resposta.ok) {
            modalInstanciaAgenda.hide();
            mostrarAlerta("Agendamento cancelado com sucesso!", "warning");
            calendario.refetchEvents();
        }
    } catch (e) { mostrarAlerta("Erro ao cancelar", "danger"); }
}

async function carregarColaboradoresFormulario(idSelecionado = null) {
    try {
        const resposta = await fetch('/api/usuarios', { headers: { 'Authorization': `Bearer ${tokenJWT}` } });
        const usuarios = await resposta.json();
        const select = document.getElementById('age-colaborador');
        select.innerHTML = '<option value="">-- Selecione --</option>';
        usuarios.forEach(u => {
            if(u.status === 'ativo') {
                select.innerHTML += `<option value="${u.id}">${u.nome} (${u.role})</option>`;
            }
        });
        if(idSelecionado) select.value = idSelecionado;
    } catch (e) {}
}