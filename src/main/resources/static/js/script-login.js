function switchForm(targetSectionId) {
    const sections = document.querySelectorAll('.auth-section');
    sections.forEach(section => {
        section.classList.remove('active');
        setTimeout(() => {
            if (!section.classList.contains('active')) {
                section.style.display = 'none';
            }
        }, 400); 
    });

    const targetSection = document.getElementById(targetSectionId);
    targetSection.style.display = 'block';
    setTimeout(() => {
        targetSection.classList.add('active');
    }, 10);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('login-section').style.display = 'block';

    // REGISTO
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const senha = document.getElementById('reg-password').value;
            
            const btn = registerForm.querySelector('button[type="submit"]');
            const btnTexto = btn.textContent;
            btn.disabled = true;
            btn.textContent = "A aguardar...";

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha })
                });

                if (res.ok) {
                    alert('Conta criada com sucesso! Estamos a iniciar a sua sessão...');
                    // Auto-Login
                    const resLogin = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, senha })
                    });
                    
                    if(resLogin.ok) {
                        const data = await resLogin.json();
                        // Redirecionamento Dinâmico (Admin ou Aluno)
                        window.location.href = data.redirect || '/';
                    } else {
                        switchForm('login-section');
                    }
                } else {
                    const errorData = await res.json();
                    alert(errorData.mensagem || 'Erro ao criar conta.');
                    btn.disabled = false;
                    btn.textContent = btnTexto;
                }
            } catch (err) {
                alert('Erro de conexão ao tentar registar.');
                btn.disabled = false;
                btn.textContent = btnTexto;
            }
        });
    }

    // LOGIN
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-password').value;

            const btn = loginForm.querySelector('button[type="submit"]');
            const btnTexto = btn.textContent;
            btn.disabled = true;
            btn.textContent = "A iniciar sessão...";

           try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                // Lemos como texto primeiro para evitar o "crash" se o Spring Boot devolver HTML
                const text = await res.text();

                try {
                    const data = JSON.parse(text); // Tenta converter para JSON
                    
                    if (res.ok) {
                        window.location.href = data.redirect || '/';
                    } else {
                        alert(data.mensagem || 'E-mail ou senha incorretos.');
                        btn.disabled = false;
                        btn.textContent = btnTexto;
                    }
                } catch (jsonErr) {
                    // Se falhar a converter para JSON, é porque o servidor deu crash crítico e enviou HTML
                    console.error("HTML devolvido pelo servidor:", text);
                    alert("O servidor encontrou um erro crítico. Pressione F12 e olhe o Console, ou verifique a consola do Spring Boot.");
                    btn.disabled = false;
                    btn.textContent = btnTexto;
                }
            } catch (err) {
                console.error("Erro no Fetch:", err);
                alert('Erro de conexão física ao tentar fazer login. O servidor pode estar desligado.');
                btn.disabled = false;
                btn.textContent = btnTexto;
            }
        });
    }
});

function enviarRecuperacao(event) {
    event.preventDefault(); 
    const email = document.getElementById('forgot-email').value;
    if(email) {
        document.getElementById('success-modal').classList.add('active');
        document.getElementById('forgot-email').value = ''; 
    }
}

function fecharModalSucesso() {
    document.getElementById('success-modal').classList.remove('active');
    switchForm('login-section');
}