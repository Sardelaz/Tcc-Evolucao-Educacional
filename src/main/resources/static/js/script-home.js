const btnCheckin = document.getElementById('checkin-btn');
const countStreak = document.getElementById('day-streak-count');
const btnDesafioCard = document.getElementById('desafio-card');
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

        const displayMoedas = document.getElementById('display-moedas');
        if (displayMoedas) displayMoedas.textContent = `🪙 ${perfil.moedas || 0}`;

        const displayLiga = document.getElementById('display-liga');
        if (displayLiga) displayLiga.textContent = `LIGA ${perfil.liga || 'FERRO'}`;

        const adminCard = document.getElementById('admin-panel-card');
        if (adminCard && perfil.role === 'ROLE_ADMIN') adminCard.style.display = 'flex';

        const displayName = document.getElementById('display-user-name');
        if (displayName) displayName.textContent = perfil.nome || 'Estudante';

        desafioJaConcluidoHoje = perfil.desafioConcluidoHoje;

        if (perfil.jaFezCheckinHoje && btnCheckin) {
            btnCheckin.disabled = true;
            btnCheckin.textContent = 'Feito! (+100 XP)';
            btnCheckin.style.opacity = '0.7';
            btnCheckin.style.cursor = 'not-allowed';
        }

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

        const currentAvatarIcon = document.getElementById('current-avatar-icon');
        const avatarGrid = document.getElementById('avatar-grid');
        const savedAvatar = perfil.avatar || '👨‍🎓';
        if (currentAvatarIcon) currentAvatarIcon.textContent = savedAvatar;
        
        if(avatarGrid) {
            avatarGrid.innerHTML = '';
            avataresPadrao.forEach(emoji => {
                const opt = document.createElement('div');
                opt.className = 'avatar-option';
                if(emoji === savedAvatar) opt.classList.add('selected');
                opt.textContent = emoji;
                opt.onclick = () => {
                    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
                    opt.classList.add('selected');
                    currentAvatarIcon.textContent = emoji;
                    fetch('/api/usuario/avatar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ avatar: emoji })
                    });
                    setTimeout(() => document.getElementById('avatar-modal').classList.remove('active'), 200);
                };
                avatarGrid.appendChild(opt);
            });
        }
    })
    .catch(err => console.error("Erro ao carregar perfil:", err));

if (btnCheckin) {
    btnCheckin.addEventListener('click', () => {
        fetch('/api/checkin', { method: 'POST' })
            .then(res => res.json())
            .then(dados => {
                if (dados.sucesso) {
                    location.reload();
                }
            });
    });
}

const profileAvatarBtn = document.getElementById('profile-avatar');
if (profileAvatarBtn) {
    profileAvatarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('avatar-modal').classList.add('active');
    });
}

// ===============================================
// LÓGICA DO DESAFIO DO DIA (Weekday Challenge)
// ===============================================
const desafiosSemana = [
    { titulo: "Descanso Ativo", desc: "Entre no app e faça o Check-in.", xp: 20 },
    { titulo: "Segunda com Foco", desc: "Conclua uma fase hoje.", xp: 50 },
    { titulo: "Terça Invencível", desc: "Faça um combo de 3 acertos em uma aula.", xp: 40 },
    { titulo: "Metade do Caminho", desc: "Acerte 5 questões sem errar nenhuma.", xp: 60 },
    { titulo: "Quinta de Conhecimento", desc: "Complete 2 fases hoje.", xp: 70 },
    { titulo: "Sextou Estudando", desc: "Faça seu check-in e complete uma fase.", xp: 50 },
    { titulo: "Sábado Genial", desc: "Gabarite (100%) qualquer fase.", xp: 80 }
];

function verificarDesafioDia() {
    const dia = new Date().getDay();
    const desafio = desafiosSemana[dia];
    
    const card = document.createElement('div');
    card.style.cssText = `background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 10px; border: 1px solid #FFD700; margin-bottom: 20px;`;
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
                <h4 style="color: #FFD700; margin: 0 0 5px 0;">🎯 Meta de Hoje: ${desafio.titulo}</h4>
                <p style="color: #fff; font-size: 0.9rem; margin: 0;">${desafio.desc}</p>
                <span style="color: #58CC02; font-size: 0.8rem; font-weight: bold;">Recompensa: +${desafio.xp} XP / +50 Moedas</span>
            </div>
            <button id="claim-reward-btn" style="background: ${desafioJaConcluidoHoje ? '#58CC02' : '#FFD700'}; color: #000; border: none; padding: 8px 12px; border-radius: 8px; font-weight: bold; cursor: ${desafioJaConcluidoHoje ? 'default' : 'pointer'};" ${desafioJaConcluidoHoje ? 'disabled' : ''}>
                ${desafioJaConcluidoHoje ? 'Concluído' : 'Verificar'}
            </button>
        </div>
    `;

    if (!desafioJaConcluidoHoje) {
        card.querySelector('#claim-reward-btn').onclick = function() {
            this.textContent = "...";
            fetch('/api/desafio-diario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xp: desafio.xp })
            }).then(res => res.json()).then(data => {
                if(data.sucesso) location.reload();
                else alert("Objetivo ainda não atingido!");
            });
        };
    }

    return card;
}

// ===============================================
// SISTEMA UNIFICADO DE MISSÕES
// ===============================================
const missionsModal = document.getElementById('missions-modal');
const closeMissionsBtn = document.getElementById('close-missions-btn');
const missionsContainer = document.getElementById('missions-container-modal');

if (btnDesafioCard) btnDesafioCard.onclick = () => missionsModal.classList.add('active');
if (closeMissionsBtn) closeMissionsBtn.onclick = () => missionsModal.classList.remove('active');

function carregarMissoes() {
    fetch('/api/missoes')
        .then(res => res.json())
        .then(missoes => {
            if(!missionsContainer) return;
            missionsContainer.innerHTML = '';
            
            // 1. Adiciona o Desafio do Dia no topo
            const h3Desafio = document.createElement('h3');
            h3Desafio.style.cssText = "color: #aaa; font-size: 0.9rem; margin: 0 0 10px 5px; text-transform: uppercase;";
            h3Desafio.textContent = "Meta Diária do App";
            missionsContainer.appendChild(h3Desafio);
            missionsContainer.appendChild(verificarDesafioDia());

            const diarias = missoes.filter(m => m.missao.tipo === 'DIARIA');
            const semanais = missoes.filter(m => m.missao.tipo === 'SEMANAL');

            const renderSecao = (titulo, lista) => {
                if (lista.length === 0) return;
                const h3 = document.createElement('h3');
                h3.style.cssText = "color: #aaa; font-size: 0.9rem; margin: 20px 0 10px 5px; text-transform: uppercase;";
                h3.textContent = titulo;
                missionsContainer.appendChild(h3);

                lista.forEach(um => {
                    const progressoPct = Math.min(100, (um.progressoAtual / um.missao.objetivo) * 100);
                    const card = document.createElement('div');
                    card.style.cssText = `background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; border-left: 4px solid ${um.concluida ? '#58CC02' : '#FFD700'}; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;`;
                    
                    card.innerHTML = `
                        <div style="flex: 1;">
                            <h4 style="color: #fff; margin: 0 0 5px 0;">${um.concluida ? '✔️ ' : ''}${um.missao.descricao}</h4>
                            <div style="display: flex; gap: 10px; font-size: 0.8rem; color: #888;">
                                <span style="color: #58CC02;">+${um.missao.recompensaXp} XP</span>
                                <span style="color: #1cb0f6;">+${um.missao.recompensaMoedas} 🪙</span>
                            </div>
                            <div style="width: 100%; max-width: 250px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-top: 8px;">
                                <div style="width: ${progressoPct}%; height: 100%; background: ${um.concluida ? '#58CC02' : '#FFD700'}; transition: 0.5s;"></div>
                            </div>
                        </div>
                        <div style="font-weight: bold; color: ${um.concluida ? '#58CC02' : '#fff'};">${um.progressoAtual}/${um.missao.objetivo}</div>
                    `;
                    missionsContainer.appendChild(card);
                });
            };

            renderSecao("Missões do Sistema", diarias);
            renderSecao("Objetivos Semanais", semanais);
        });
}

// Inicia as missões
carregarMissoes();