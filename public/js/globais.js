//Este arquivo guarda os dados compartilhados e a inicialização da tela.
// Variáveis Globais Acessíveis por todos os módulos
let tokenJWT = "";
let usuarioAtualNome = "";
let relogioInterval = null;
let modalInstancia = null; 
let listaUsuariosMemoria = [];

window.onload = () => {
    const emailSalvo = localStorage.getItem('intranet_lembrar_email');
    if (emailSalvo) {
        document.getElementById('email').value = emailSalvo;
        document.getElementById('lembrar-email').checked = true;
    }

    const tokenSalvo = localStorage.getItem('intranet_token');
    if (tokenSalvo) {
        tokenJWT = tokenSalvo;
        const nomeSalvo = localStorage.getItem('intranet_nome');
        const permsSalvas = localStorage.getItem('intranet_permissoes');
        
        usuarioAtualNome = nomeSalvo.split(' ')[0]; 
        document.getElementById('sidebar-nome').innerText = nomeSalvo;
        document.getElementById('sidebar-cargo').innerText = localStorage.getItem('intranet_cargo');
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeSalvo)}&background=4e73df&color=fff&size=128`;

        aplicarPermissoesVisuais(permsSalvas);

        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('dashboard-wrapper').classList.remove('d-none');
        
        iniciarRelogio();
        alternarAba('home', document.querySelector('.sidebar-link')); 
        carregarUsuariosGeral();
    }
};