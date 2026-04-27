const btnCheckin = document.getElementById('checkin-btn');
const countStreak = document.getElementById('day-streak-count');
let desafioJaConcluidoHoje = false;

// LER DADOS DO PERFIL E APLICAR COSMÉTICOS DA LOJA
fetch('/api/perfil')
    .then(res => res.json())
    .then(perfil => {
        if (countStreak) countStreak.textContent = `🔥 ${perfil.streak}`;
        const lvlBadge = document.getElementById('user-level-badge');
        if (lvlBadge) lvlBadge.textContent = `Nível ${perfil.nivel}`;
        const currXp = document.getElementById('current-xp-text');
        if (currXp) currXp.textContent = `${perfil.xp} XP`;
        const nextXp = document.getElementById('next-level-xp');
        if (nextXp) nextXp.textContent = `Meta: ${perfil.xpProximoNivel} XP`;
        
        const xpProgress = document.getElementById('xp-progress-bar');
        if(xpProgress) {
            const xpNesteNivel = perfil.xp % 100;
            xpProgress.style.width = `${xpNesteNivel}%`;
        }
        desafioJaConcluidoHoje = perfil.desafioConcluidoHoje;

        if (perfil.jaFezCheckinHoje && btnCheckin) {
            btnCheckin.disabled = true;
            btnCheckin.textContent = 'Feito! (+100 XP)';
            btnCheckin.style.opacity = '0.7';
            btnCheckin.style.cursor = 'not-allowed';
        }

        // ===============================================
        // INTEGRAÇÃO COM OS ITENS COMPRADOS NA LOJA VIRTUAL
        // ===============================================
        const avataresPadrao = ['👨‍🎓', '👩‍🎓', '🧑‍💻', '👩‍💻', '🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️', '🤖', '👽', '🦊', '🐱', '🦁', '🐼', '🦄', '🐲'];
        
        if (perfil.itensComprados && perfil.itensComprados.includes('avatar_rei')) avataresPadrao.push('👑');
        if (perfil.itensComprados && perfil.itensComprados.includes('avatar_dragao')) avataresPadrao.push('🐉');
        if (perfil.itensComprados && perfil.itensComprados.includes('avatar_coruja')) avataresPadrao.push('🦉');

        if (perfil.itensComprados && perfil.itensComprados.includes('borda_diamante')) {
            const avatarEl = document.getElementById('profile-avatar');
            if (avatarEl) {
                avatarEl.style.border = '4px solid #00e5ff';
                avatarEl.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.6)';
            }
        }
        if (perfil.itensComprados && perfil.itensComprados.includes('efeito_raio')) {
            const nameEl = document.getElementById('display-user-name');
            if (nameEl && !nameEl.textContent.includes('⚡')) {
                nameEl.textContent += ' ⚡';
                nameEl.style.color = '#FFD700';
                nameEl.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
            }
        }

        // ===============================================
        // CORREÇÃO MESTRE: Renderizar Avatar do Servidor
        // ===============================================
        const currentAvatarIcon = document.getElementById('current-avatar-icon');
        const avatarGrid = document.getElementById('avatar-grid');
        
        // Pega o avatar que veio do perfil (Base de Dados)
        const savedAvatar = perfil.avatar || '👨‍🎓';
        if (currentAvatarIcon) currentAvatarIcon.textContent = savedAvatar;
        
        if(avatarGrid) {
            avatarGrid.innerHTML = '';
            avataresPadrao.forEach(emoji => {
                const opt = document.createElement('div');
                opt.className = 'avatar-option';
                if(emoji === savedAvatar) opt.classList.add('selected');
                opt.textContent = emoji;
                
                if (['👑', '🐉', '🦉'].includes(emoji)) {
                    opt.style.background = 'rgba(255, 215, 0, 0.1)';
                    opt.style.borderColor = '#FFD700';
                }
                
                opt.onclick = () => {
                    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
                    opt.classList.add('selected');
                    currentAvatarIcon.textContent = emoji;

                    // CORREÇÃO: Gravar no Banco de Dados via API
                    fetch('/api/usuario/avatar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ avatar: emoji })
                    }).then(() => {
                        // Opcional: Atualizar localStorage apenas para cache local de sessão rápida
                        localStorage.setItem('userAvatar', emoji);
                    });

                    setTimeout(() => document.getElementById('avatar-modal').classList.remove('active'), 200);
                };
                avatarGrid.appendChild(opt);
            });
        }
    })
    .catch(err => console.error("Erro ao carregar perfil na home:", err));

const profileAvatarBtn = document.getElementById('profile-avatar');
if (profileAvatarBtn) {
    profileAvatarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('avatar-modal').classList.add('active');
    });
}

if (btnCheckin) {
    btnCheckin.addEventListener('click', () => {
        fetch('/api/checkin', { method: 'POST' })
            .then(res => res.json())
            .then(dados => {
                if (dados.sucesso === false) {
                    btnCheckin.disabled = true;
                    btnCheckin.textContent = 'Feito! (+100 XP)';
                    btnCheckin.style.opacity = '0.7';
                    btnCheckin.style.cursor = 'not-allowed';
                    return;
                }
                if (countStreak) countStreak.textContent = `🔥 ${dados.streak}`;
                const lvlBadge = document.getElementById('user-level-badge');
                if (lvlBadge) lvlBadge.textContent = `Nível ${dados.nivel}`;
                const currXp = document.getElementById('current-xp-text');
                if (currXp) currXp.textContent = `${dados.xp} XP`;
                const nextXp = document.getElementById('next-level-xp');
                if (nextXp) nextXp.textContent = `Meta: ${dados.nivel * 100} XP`;
                const xpProgress = document.getElementById('xp-progress-bar');
                if(xpProgress) {
                    const xpNesteNivel = dados.xp % 100;
                    xpProgress.style.width = `${xpNesteNivel}%`;
                }
                const displayMoedas = document.getElementById('display-moedas');
                if (displayMoedas) displayMoedas.textContent = `🪙 ${dados.moedas}`;

                btnCheckin.disabled = true;
                btnCheckin.textContent = 'Feito! (+100 XP)';
                btnCheckin.style.opacity = '0.7';
                btnCheckin.style.cursor = 'not-allowed';
            });
    });
}

const btnDesafioCard = document.getElementById('desafio-card');
const btnClaim = document.getElementById('claim-reward-btn');

const desafiosSemana = [
    { titulo: "Descanso Ativo", desc: "Entre no app e faça o Check-in.", xp: 20 },
    { titulo: "Segunda com Foco", desc: "Conclua uma fase hoje.", xp: 50 },
    { titulo: "Terça Invencível", desc: "Faça um combo de 3 acertos em uma aula.", xp: 40 },
    { titulo: "Metade do Caminho", desc: "Acerte 5 questões sem errar nenhuma.", xp: 60 },
    { titulo: "Quinta de Conhecimento", desc: "Complete 2 fases hoje.", xp: 70 },
    { titulo: "Sextou Estudando", desc: "Faça seu check-in e complete uma fase.", xp: 50 },
    { titulo: "Sábado Genial", desc: "Gabarite (100%) qualquer fase.", xp: 80 }
];

const hojeData = new Date();
const diaSemanaIndex = hojeData.getDay();
const desafioDeHoje = desafiosSemana[diaSemanaIndex];
const nomeDoDiaLocale = hojeData.toLocaleDateString('pt-BR', { weekday: 'long' });

if(btnDesafioCard && btnClaim) {
    function openModal(modalId) { document.getElementById(modalId).classList.add('active'); }
    
    btnDesafioCard.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = desafioDeHoje.titulo;
        document.getElementById('modal-subtitle').textContent = `Hoje é ${nomeDoDiaLocale}`;
        document.getElementById('modal-desc').textContent = desafioDeHoje.desc;
        document.getElementById('modal-reward').textContent = `+${desafioDeHoje.xp} XP e +50 Moedas`;

        if (desafioJaConcluidoHoje) {
            btnClaim.disabled = true;
            btnClaim.textContent = "Recompensa Resgatada!";
            btnClaim.style.background = "#58CC02";
            btnClaim.style.boxShadow = "0 4px 0 #4CAF50";
        } else {
            btnClaim.disabled = false;
            btnClaim.textContent = "Verificar Conclusão";
            btnClaim.style.background = "var(--cor-ranking)";
            btnClaim.style.boxShadow = "0 4px 0 #B8860B";
        }
        openModal('daily-modal');
    });

    btnClaim.addEventListener('click', () => {
        btnClaim.textContent = "A verificar...";
        btnClaim.disabled = true;

        fetch('/api/desafio-diario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xp: desafioDeHoje.xp })
        })
        .then(res => res.json())
        .then(dados => {
            if (dados.sucesso) {
                const lvlBadge = document.getElementById('user-level-badge');
                if (lvlBadge) lvlBadge.textContent = `Nível ${dados.nivel}`;
                const currXp = document.getElementById('current-xp-text');
                if (currXp) currXp.textContent = `${dados.xpTotal} XP`;
                const nextXp = document.getElementById('next-level-xp');
                if (nextXp) nextXp.textContent = `Meta: ${dados.nivel * 100} XP`;
                const xpProgress = document.getElementById('xp-progress-bar');
                if(xpProgress) {
                    const xpNesteNivel = dados.xpTotal % 100;
                    xpProgress.style.width = `${xpNesteNivel}%`;
                }
                
                const moedasEl = document.getElementById('display-moedas');
                if (moedasEl) moedasEl.textContent = `🪙 ${parseInt(moedasEl.textContent.replace(/\D/g,'')) + 50}`;

                desafioJaConcluidoHoje = true;
                btnClaim.style.background = "#58CC02";
                btnClaim.style.boxShadow = "0 4px 0 #4CAF50";
                btnClaim.textContent = `Sucesso! (+${dados.xpGanho} XP)`;

                setTimeout(() => document.getElementById('daily-modal').classList.remove('active'), 2000);
            } else {
                alert(dados.mensagem);
                btnClaim.disabled = false;
                btnClaim.textContent = "Verificar Conclusão";
            }
        })
        .catch(err => {
            console.error("Erro ao completar desafio:", err);
            btnClaim.disabled = false;
            btnClaim.textContent = "Tentar novamente";
        });
    });
}