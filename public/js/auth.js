async function realizarLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const lembrarEmail = document.getElementById('lembrar-email').checked;
    const msgDiv = document.getElementById('login-mensagem');

    try {
        const resposta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        
        const dados = await resposta.json();

        if (resposta.ok) {
            tokenJWT = dados.token;
            const user = dados.usuarioLogado;
            
            if (lembrarEmail) {
                localStorage.setItem('intranet_lembrar_email', email);
            } else {
                localStorage.removeItem('intranet_lembrar_email');
            }
            
            localStorage.setItem('intranet_token', tokenJWT);
            localStorage.setItem('intranet_nome', user.nome);
            localStorage.setItem('intranet_cargo', user.cargo);
            localStorage.setItem('intranet_permissoes', user.permissoes || '');

            usuarioAtualNome = user.nome.split(' ')[0]; 
            document.getElementById('sidebar-nome').innerText = user.nome;
            document.getElementById('sidebar-cargo').innerText = user.cargo;
            document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=4e73df&color=fff&size=128`;

            aplicarPermissoesVisuais(user.permissoes);

            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('dashboard-wrapper').classList.remove('d-none');
            
            iniciarRelogio();
            alternarAba('home', document.querySelector('.sidebar-link')); 
            carregarUsuariosGeral();
        } else {
            msgDiv.innerText = dados.erro;
        }
    } catch (error) { msgDiv.innerText = "Erro ao conectar."; }
}

// Aguarda a tela carregar completamente no navegador
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configuração da tecla Enter no campo de senha
    const campoSenha = document.getElementById('senha'); 
    if(campoSenha) {
        campoSenha.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                realizarLogin();
            }
        });
    }

    // 2. Restaura o e-mail lembrado no login
    const emailLembrado = localStorage.getItem('intranet_lembrar_email');
    if (emailLembrado && document.getElementById('email')) {
        document.getElementById('email').value = emailLembrado;
        document.getElementById('lembrar-email').checked = true;
    }

    // =========================================================
    // 3. RECUPERAÇÃO DE SESSÃO AUTOMÁTICA (A MÁGICA ACONTECE AQUI)
    // =========================================================
    const tokenSalvo = localStorage.getItem('intranet_token');

    if (tokenSalvo) {
        // Devolve o token para a variável global do sistema
        tokenJWT = tokenSalvo;
        
        try {
            // Faz um teste rápido e oculto na API para ver se o token ainda é válido
            const resposta = await fetch('/api/usuarios', { 
                headers: { 'Authorization': `Bearer ${tokenJWT}` } 
            });

            if (resposta.status === 401 || resposta.status === 403) {
                // Se o backend recusar (expirado ou inválido), limpa tudo e mostra o login
                console.warn("Sessão expirada. Redirecionando para o login...");
                fazerLogout();
            } else {
                // TOKEN VÁLIDO! Pode remontar a interface com os dados do LocalStorage
                const nomeSalvo = localStorage.getItem('intranet_nome');
                const cargoSalvo = localStorage.getItem('intranet_cargo');
                const permsSalvas = localStorage.getItem('intranet_permissoes') || '';
                
                usuarioAtualNome = nomeSalvo ? nomeSalvo.split(' ')[0] : 'Usuário'; 
                document.getElementById('sidebar-nome').innerText = nomeSalvo;
                document.getElementById('sidebar-cargo').innerText = cargoSalvo;
                document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeSalvo)}&background=4e73df&color=fff&size=128`;

                aplicarPermissoesVisuais(permsSalvas);

                // Oculta login e mostra painel
                document.getElementById('login-section').classList.add('d-none');
                document.getElementById('dashboard-wrapper').classList.remove('d-none');
                
                iniciarRelogio();
                alternarAba('home', document.querySelector('.sidebar-link')); 
            }
        } catch (error) {
            console.error("Erro ao validar sessão silenciosa.");
        }
    } else {
        // Garante que o painel fique oculto se não houver token
        document.getElementById('login-section').classList.remove('d-none');
        document.getElementById('dashboard-wrapper').classList.add('d-none');
    }
});

// Zera a memória do navegador e recarrega a página para voltar ao Login
function fazerLogout() { 
    localStorage.clear(); 
    location.reload(); 
}