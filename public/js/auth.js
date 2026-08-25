async function realizarLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const lembrarEmail = document.getElementById('lembrar-email').checked;
    const msgDiv = document.getElementById('login-mensagem');
    const botaoEntrar = document.querySelector('button[onclick="realizarLogin()"]');

    msgDiv.innerText = '';

    if (!email || !senha) {
        msgDiv.innerText = "Preencha o e-mail e a senha.";
        return;
    }

    // 1. Feedback visual no botão de login
    if (botaoEntrar) {
        botaoEntrar.disabled = true;
        botaoEntrar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Autenticando...`;
    }

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

            // ======================================================
            // 2. INÍCIO DA TRANSIÇÃO (SPLASH SCREEN - MANUAL)
            // ======================================================
            const splashScreen = document.getElementById('welcome-splash');
            const welcomeMsg = document.getElementById('welcome-msg');
            const welcomeSub = document.getElementById('welcome-sub');

            if (welcomeMsg) welcomeMsg.innerText = `Bem-vindo(a), ${usuarioAtualNome}!`;
            if (welcomeSub) welcomeSub.innerText = `Carregando perfil de ${user.cargo}...`;

            if (splashScreen) {
                splashScreen.classList.remove('d-none');
                splashScreen.classList.add('d-flex');
                void splashScreen.offsetWidth; 
                splashScreen.style.opacity = '1';
            }

            document.getElementById('login-section').classList.add('d-none');

            await new Promise(resolve => setTimeout(resolve, 2000));
            // ======================================================

            document.getElementById('sidebar-nome').innerText = user.nome;
            document.getElementById('sidebar-cargo').innerText = user.cargo;
            document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=4e73df&color=fff&size=128`;

            aplicarPermissoesVisuais(user.permissoes);

            // ======================================================
            // 3. FIM DA TRANSIÇÃO E EXIBIÇÃO DO DASHBOARD
            // ======================================================
            if (splashScreen) {
                splashScreen.style.opacity = '0'; 
                await new Promise(resolve => setTimeout(resolve, 1000));
                splashScreen.classList.remove('d-flex');
                splashScreen.classList.add('d-none'); 
            }

            document.getElementById('dashboard-wrapper').classList.remove('d-none');
            
            iniciarRelogio();
            alternarAba('home', document.querySelector('.sidebar-link')); 
            carregarUsuariosGeral();
        } else {
            msgDiv.innerText = dados.erro;
            if (botaoEntrar) {
                botaoEntrar.disabled = false;
                botaoEntrar.innerHTML = "Entrar no Sistema";
            }
        }
    } catch (error) { 
        msgDiv.innerText = "Erro ao conectar."; 
        if (botaoEntrar) {
            botaoEntrar.disabled = false;
            botaoEntrar.innerHTML = "Entrar no Sistema";
        }
    }
}

// Aguarda a tela carregar completamente no navegador
document.addEventListener('DOMContentLoaded', async () => {
    const campoSenha = document.getElementById('senha'); 
    if(campoSenha) {
        campoSenha.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                realizarLogin();
            }
        });
    }

    const emailLembrado = localStorage.getItem('intranet_lembrar_email');
    if (emailLembrado && document.getElementById('email')) {
        document.getElementById('email').value = emailLembrado;
        document.getElementById('lembrar-email').checked = true;
    }

    // =========================================================
    // RECUPERAÇÃO DE SESSÃO AUTOMÁTICA (AGORA COM SPLASH SCREEN)
    // =========================================================
    const tokenSalvo = localStorage.getItem('intranet_token');

    if (tokenSalvo) {
        tokenJWT = tokenSalvo;
        
        try {
            const resposta = await fetch('/api/usuarios', { 
                headers: { 'Authorization': `Bearer ${tokenJWT}` } 
            });

            if (resposta.status === 401 || resposta.status === 403) {
                console.warn("Sessão expirada. Redirecionando para o login...");
                fazerLogout();
            } else {
                const nomeSalvo = localStorage.getItem('intranet_nome');
                const cargoSalvo = localStorage.getItem('intranet_cargo');
                const permsSalvas = localStorage.getItem('intranet_permissoes') || '';
                
                usuarioAtualNome = nomeSalvo ? nomeSalvo.split(' ')[0] : 'Usuário'; 

                // ======================================================
                // EXIBE O SPLASH SCREEN NO LOGIN AUTOMÁTICO
                // ======================================================
                const splashScreen = document.getElementById('welcome-splash');
                const welcomeMsg = document.getElementById('welcome-msg');
                const welcomeSub = document.getElementById('welcome-sub');

                if (welcomeMsg) welcomeMsg.innerText = `Bem-vindo(a) de volta, ${usuarioAtualNome}!`;
                if (welcomeSub) welcomeSub.innerText = `Preparando seu ambiente corporativo...`;

                if (splashScreen) {
                    splashScreen.classList.remove('d-none');
                    splashScreen.classList.add('d-flex');
                    void splashScreen.offsetWidth; 
                    splashScreen.style.opacity = '1';
                }

                // Oculta login enquanto o splash brilha
                document.getElementById('login-section').classList.add('d-none');

                await new Promise(resolve => setTimeout(resolve, 2000));
                // ======================================================

                document.getElementById('sidebar-nome').innerText = nomeSalvo;
                document.getElementById('sidebar-cargo').innerText = cargoSalvo;
                document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeSalvo)}&background=4e73df&color=fff&size=128`;

                aplicarPermissoesVisuais(permsSalvas);

                // ======================================================
                // OCULTA O SPLASH E EXIBE O PAINEL
                // ======================================================
                if (splashScreen) {
                    splashScreen.style.opacity = '0'; 
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    splashScreen.classList.remove('d-flex');
                    splashScreen.classList.add('d-none'); 
                }

                document.getElementById('dashboard-wrapper').classList.remove('d-none');
                
                iniciarRelogio();
                alternarAba('home', document.querySelector('.sidebar-link')); 
            }
        } catch (error) {
            console.error("Erro ao validar sessão silenciosa.");
        }
    } else {
        document.getElementById('login-section').classList.remove('d-none');
        document.getElementById('dashboard-wrapper').classList.add('d-none');
    }
});

function fazerLogout() { 
    localStorage.clear(); 
    location.reload(); 
}