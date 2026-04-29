// Variáveis globais para armazenar os dados de registo até a verificação do e-mail
let pendingEmail = "";
let pendingPassword = "";

// Alternar abas de autenticação
function switchForm(targetSectionId) {
    const sections = document.querySelectorAll('.auth-section');
    
    // Limpar mensagens de erro ao trocar de ecrã
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

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

// Alternar visibilidade da senha (Olho)
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈'; 
        btn.title = 'Ocultar senha';
    } else {
        input.type = 'password';
        btn.textContent = '👁️'; 
        btn.title = 'Mostrar senha';
    }
}

// Validar formato estrito de E-mail
function validarEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('login-section').style.display = 'block';

    // Limpar os erros assim que o utilizador começa a digitar
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const errorSpan = document.getElementById(`${e.target.id}-error`);
            if (errorSpan) errorSpan.textContent = '';
        });
    });

    // PASSO 1: REGISTO (Envia os dados e pede o envio de e-mail)
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const senha = document.getElementById('reg-password').value;
            const errorSpan = document.getElementById('reg-email-error');
            
            if (!validarEmail(email)) {
                errorSpan.textContent = "Por favor, insira um e-mail válido.";
                return;
            }

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
                    // Guarda as credenciais em memória
                    pendingEmail = email;
                    pendingPassword = senha;
                    
                    // Atualiza a interface visualmente com o e-mail que o utilizador inseriu
                    document.getElementById('display-email').textContent = pendingEmail;
                    
                    alert('Conta pré-criada! Enviámos um código para o seu e-mail.');
                    switchForm('verification-section');
                } else {
                    if (res.status === 409 || res.status === 400) {
                        errorSpan.textContent = "Este e-mail já está em uso ou é inválido.";
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        errorSpan.textContent = errorData.mensagem || 'Erro ao criar conta.';
                    }
                }
            } catch (err) {
                errorSpan.textContent = 'Erro de ligação ao tentar registar.';
            } finally {
                btn.disabled = false;
                btn.textContent = btnTexto;
            }
        });
    }

    // PASSO 2: VERIFICAR E-MAIL E AUTO-LOGIN
    const verificationForm = document.getElementById('verification-form');
    if (verificationForm) {
        verificationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const codigo = document.getElementById('verify-code').value;
            const errorSpan = document.getElementById('verify-code-error');
            const btn = verificationForm.querySelector('button[type="submit"]');

            if (!codigo) {
                errorSpan.textContent = "Por favor, insira o código.";
                return;
            }

            const btnTextoOriginal = btn.textContent;
            btn.disabled = true;
            btn.textContent = "A verificar...";

            try {
                const res = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail, codigo: codigo })
                });

                if (res.ok) {
                    alert('E-mail verificado com sucesso! A iniciar sessão...');
                    
                    const resLogin = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: pendingEmail, senha: pendingPassword })
                    });
                    
                    if(resLogin.ok) {
                        const data = await resLogin.json();
                        window.location.href = data.redirect || '/';
                    } else {
                        switchForm('login-section');
                    }
                } else {
                    const data = await res.json().catch(() => ({}));
                    errorSpan.textContent = data.mensagem || "Código incorreto ou expirado.";
                }
            } catch (err) {
                errorSpan.textContent = "Erro de ligação ao tentar verificar o código.";
            } finally {
                btn.disabled = false;
                btn.textContent = btnTextoOriginal;
            }
        });
    }

    // REENVIAR CÓDIGO (Tratamento de Erro 404 e proteção do botão)
    const resendBtn = document.getElementById('resend-code-btn');
    if(resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if(!pendingEmail) {
                alert("Nenhum e-mail pendente encontrado.");
                return;
            }

            const originalText = resendBtn.textContent;
            resendBtn.textContent = "A enviar...";
            resendBtn.style.pointerEvents = "none"; // Evita duplo clique
            resendBtn.style.color = "#ccc";

            try {
                const res = await fetch('/api/auth/resend-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail })
                });
                
                if (res.ok) {
                    alert("Novo código enviado para " + pendingEmail);
                } else if (res.status === 404) {
                    // Impede o erro genérico no console e avisa ao desenvolvedor/usuário
                    alert("Aviso: A rota '/api/auth/resend-code' ainda não existe no servidor (Back-End). Crie este endpoint no Spring Boot para que funcione.");
                } else {
                    alert("Falha ao tentar reenviar. O servidor retornou o status: " + res.status);
                }
            } catch(err) {
                alert("Erro de ligação. O servidor pode estar desligado.");
            } finally {
                // Restaura o botão
                resendBtn.textContent = originalText;
                resendBtn.style.pointerEvents = "auto";
                resendBtn.style.color = "";
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
            const errorSpanEmail = document.getElementById('login-email-error');
            const errorSpanSenha = document.getElementById('login-password-error');

            if (!validarEmail(email)) {
                errorSpanEmail.textContent = "Por favor, insira um e-mail válido.";
                return;
            }

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

                const text = await res.text();

                try {
                    const data = JSON.parse(text); 
                    
                    if (res.ok) {
                        window.location.href = data.redirect || '/';
                    } else {
                        if (res.status === 404) {
                            errorSpanEmail.textContent = "Este e-mail não existe nos nossos registos.";
                        } else if (res.status === 401) {
                            errorSpanSenha.textContent = "A senha está incorreta.";
                        } else if (res.status === 403) {
                             errorSpanEmail.textContent = "A sua conta não está confirmada. Verifique o seu e-mail.";
                        } else {
                            errorSpanEmail.textContent = data.mensagem || 'Credenciais inválidas.';
                        }
                    }
                } catch (jsonErr) {
                    console.error("HTML devolvido pelo servidor:", text);
                    alert("O servidor encontrou um erro crítico. Verifique a consola do sistema.");
                }
            } catch (err) {
                console.error("Erro no Fetch:", err);
                alert('Erro de ligação. O servidor pode estar desligado.');
            } finally {
                btn.disabled = false;
                btn.textContent = btnTexto;
            }
        });
    }
});

// RECUPERAÇÃO DE SENHA
async function enviarRecuperacao(event) {
    event.preventDefault(); 
    const emailInput = document.getElementById('forgot-email');
    const email = emailInput.value;
    const errorSpan = document.getElementById('forgot-email-error');
    const btn = document.getElementById('btn-recuperar');

    errorSpan.textContent = "";

    if(!email) {
        errorSpan.textContent = "O campo de e-mail é obrigatório.";
        return;
    }

    if (!validarEmail(email)) {
        errorSpan.textContent = "Por favor, insira um e-mail válido.";
        return;
    }

    const btnTextoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "A verificar...";

    try {
        const res = await fetch('/api/auth/recuperar', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }) 
        });
        
        if (res.ok) {
            document.getElementById('success-modal').classList.add('active');
            emailInput.value = ''; 
        } else if (res.status === 404) {
            errorSpan.textContent = "Este e-mail não está registado no sistema.";
        } else {
            const data = await res.json().catch(() => ({}));
            errorSpan.textContent = data.mensagem || "Erro ao processar o pedido. Tente novamente.";
        }
    } catch (err) {
        console.warn("Rota de recuperação falhou, abrindo modal de simulação.");
        document.getElementById('success-modal').classList.add('active');
        emailInput.value = ''; 
    } finally {
        btn.disabled = false;
        btn.textContent = btnTextoOriginal;
    }
}

// Fechar Modal de Sucesso
function fecharModalSucesso() {
    document.getElementById('success-modal').classList.remove('active');
    switchForm('login-section');
}