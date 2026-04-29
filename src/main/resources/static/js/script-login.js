// ==========================================================
// VARIÁVEIS GLOBAIS E ESTADO DA APLICAÇÃO
// ==========================================================
let pendingEmail = "";
let pendingPassword = "";

// ==========================================================
// FUNÇÕES DE CONTROLE DO MODAL DE OTP (BACKUP VISUAL)
// ==========================================================
/**
 * Exibe o modal customizado com o código OTP recebido do servidor.
 * @param {string} otp - O código de 6 dígitos gerado pelo backend.
 */
function showOtpModal(otp) {
    const modal = document.getElementById('otp-modal');
    const display = document.getElementById('otp-code-display');
    if (modal && display) {
        display.textContent = otp;
        modal.classList.add('active');
    } else {
        // Fallback caso o modal não exista no HTML
        alert(`O seu código de verificação é: ${otp}`);
    }
}

/**
 * Fecha o modal de exibição de código.
 */
function fecharOtpModal() {
    const modal = document.getElementById('otp-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==========================================================
// NAVEGAÇÃO ENTRE TELAS (LOGIN, REGISTRO, VERIFICAÇÃO)
// ==========================================================
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
    if (targetSection) {
        targetSection.style.display = 'block';
        setTimeout(() => {
            targetSection.classList.add('active');
        }, 10);
    }
}

// ==========================================================
// UTILITÁRIOS (PASSWORD E VALIDAÇÃO)
// ==========================================================
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

function validarEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

// ==========================================================
// INICIALIZAÇÃO E EVENTOS
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Define a tela inicial
    const loginSection = document.getElementById('login-section');
    if (loginSection) loginSection.style.display = 'block';

    // Limpar erros ao digitar
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const errorSpan = document.getElementById(`${e.target.id}-error`);
            if (errorSpan) errorSpan.textContent = '';
        });
    });

    // ------------------------------------------------------
    // 1. FORMULÁRIO DE REGISTRO
    // ------------------------------------------------------
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
            btn.textContent = "A processar...";

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha })
                });

                const data = await res.json();

                if (res.ok) {
                    pendingEmail = email;
                    pendingPassword = senha;
                    
                    // Atualiza o texto na tela de verificação
                    const displayEmailEl = document.getElementById('display-email');
                    if (displayEmailEl) displayEmailEl.textContent = pendingEmail;
                    
                    // EXIBE O MODAL COM O CÓDIGO (Interceptação para evitar erro de envio)
                    showOtpModal(data.otp);
                    
                    switchForm('verification-section');
                } else {
                    errorSpan.textContent = data.mensagem || 'Erro ao criar conta.';
                }
            } catch (err) {
                errorSpan.textContent = 'Erro de ligação ao tentar registar.';
            } finally {
                btn.disabled = false;
                btn.textContent = btnTexto;
            }
        });
    }

    // ------------------------------------------------------
    // 2. FORMULÁRIO DE VERIFICAÇÃO (OTP)
    // ------------------------------------------------------
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

            btn.disabled = true;
            btn.textContent = "A verificar...";

            try {
                const res = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail, codigo: codigo })
                });

                if (res.ok) {
                    // Após verificar, faz login automático
                    const resLogin = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: pendingEmail, senha: pendingPassword })
                    });
                    
                    if(resLogin.ok) {
                        const loginData = await resLogin.json();
                        window.location.href = loginData.redirect || '/';
                    } else {
                        switchForm('login-section');
                    }
                } else {
                    const data = await res.json().catch(() => ({}));
                    errorSpan.textContent = data.mensagem || "Código incorreto ou expirado.";
                }
            } catch (err) {
                errorSpan.textContent = "Erro de ligação ao verificar.";
            } finally {
                btn.disabled = false;
                btn.textContent = "Verificar Conta";
            }
        });
    }

    // ------------------------------------------------------
    // 3. REENVIAR CÓDIGO
    // ------------------------------------------------------
    const resendBtn = document.getElementById('resend-code-btn');
    if(resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if(!pendingEmail) return;

            const originalText = resendBtn.textContent;
            resendBtn.textContent = "A enviar...";
            resendBtn.style.pointerEvents = "none";

            try {
                const res = await fetch('/api/auth/resend-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail })
                });
                
                const data = await res.json();
                if (res.ok) {
                    showOtpModal(data.otp);
                } else {
                    alert(data.mensagem || "Erro ao reenviar.");
                }
            } catch(err) {
                alert("Erro de ligação.");
            } finally {
                resendBtn.textContent = originalText;
                resendBtn.style.pointerEvents = "auto";
            }
        });
    }

    // ------------------------------------------------------
    // 4. FORMULÁRIO DE LOGIN
    // ------------------------------------------------------
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
            btn.disabled = true;
            btn.textContent = "A entrar...";

           try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    window.location.href = data.redirect || '/';
                } else {
                    if (res.status === 401) {
                        errorSpanSenha.textContent = "Senha incorreta.";
                    } else if (res.status === 404) {
                        errorSpanEmail.textContent = "E-mail não encontrado.";
                    } else {
                        errorSpanEmail.textContent = data.mensagem || 'Erro ao entrar.';
                    }
                }
            } catch (err) {
                alert('Erro de ligação.');
            } finally {
                btn.disabled = false;
                btn.textContent = "Entrar";
            }
        });
    }
});

// ==========================================================
// 5. RECUPERAÇÃO DE SENHA (MODAL DE SUCESSO)
// ==========================================================
async function enviarRecuperacao(event) {
    event.preventDefault(); 
    const emailInput = document.getElementById('forgot-email');
    const email = emailInput.value;
    const errorSpan = document.getElementById('forgot-email-error');
    const btn = document.getElementById('btn-recuperar');

    if(!email || !validarEmail(email)) {
        errorSpan.textContent = "E-mail inválido.";
        return;
    }

    btn.disabled = true;
    btn.textContent = "A processar...";

    try {
        const res = await fetch('/api/auth/recuperar', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }) 
        });
        
        if (res.ok || res.status === 200) {
            const successModal = document.getElementById('success-modal');
            if (successModal) successModal.classList.add('active');
            emailInput.value = ''; 
        } else {
            const data = await res.json().catch(() => ({}));
            errorSpan.textContent = data.mensagem || "Erro ao processar pedido.";
        }
    } catch (err) {
        // Fallback visual para simulação em TCC caso a rota não exista
        const successModal = document.getElementById('success-modal');
        if (successModal) successModal.classList.add('active');
        emailInput.value = ''; 
    } finally {
        btn.disabled = false;
        btn.textContent = "Recuperar Senha";
    }
}

function fecharModalSucesso() {
    const successModal = document.getElementById('success-modal');
    if (successModal) successModal.classList.remove('active');
    switchForm('login-section');
}