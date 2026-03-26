let rankingData = {};

document.addEventListener("DOMContentLoaded", async () => {
    const listContainer = document.getElementById('ranking-list');
    const tabs = document.querySelectorAll('.tab-btn');

    // Pega o avatar escolhido no LocalStorage para passar como parâmetro do current user
    const savedAvatar = localStorage.getItem('userAvatar') || '👨‍🎓';

    try {
        const res = await fetch('/api/ranking?avatar=' + encodeURIComponent(savedAvatar));
        rankingData = await res.json();
        
        // Renderiza o padrão ao iniciar a tela
        renderRanking('nivel');

        // Adiciona evento de clique para cada filtro (Aba)
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderRanking(tab.dataset.type);
            });
        });

    } catch (e) {
        console.error("Erro ao carregar o ranking:", e);
        listContainer.innerHTML = '<p style="text-align:center; color: #ff4b4b;">Erro ao carregar os dados do servidor.</p>';
    }
});

function renderRanking(type) {
    const listContainer = document.getElementById('ranking-list');
    listContainer.innerHTML = '';
    
    if (!rankingData[type] || rankingData[type].length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color: #888;">Nenhum dado encontrado.</p>';
        return;
    }

    rankingData[type].forEach((user, index) => {
        const pos = index + 1;
        const item = document.createElement('div');
        
        // Se for o usuário principal, aplica a classe "current-user" que dá o fundo dourado
        item.className = `ranking-item rank-${pos} ${user.isCurrentUser ? 'current-user' : ''}`;
        
        // Adiciona as medalhas pros 3 primeiros
        let posText = `#${pos}`;
        if (pos === 1) posText = '🥇';
        if (pos === 2) posText = '🥈';
        if (pos === 3) posText = '🥉';

        let scoreValue = '';
        let scoreLabel = '';
        let scoreColor = '';

        // Formata as cores e valores de acordo com a aba ativada
        if (type === 'nivel') {
            scoreValue = `${user.xp} XP`;
            scoreLabel = 'Nível ' + user.nivel;
            scoreColor = 'var(--cor-xp)';
        } else if (type === 'ofensiva') {
            scoreValue = `${user.ofensiva} 🔥`;
            scoreLabel = 'Dias Seguidos';
            scoreColor = 'var(--cor-ofensiva)';
        } else if (type === 'fases') {
            scoreValue = `${user.fases} 📚`;
            scoreLabel = 'Fases Concluídas';
            scoreColor = 'var(--cor-fases)';
        }

        item.innerHTML = `
            <div class="rank-pos">${posText}</div>
            <div class="user-info">
                <div class="avatar">${user.avatar}</div>
                <div class="user-details">
                    <h4>${user.nome}</h4>
                    ${user.isCurrentUser ? '<span>Você</span>' : ''}
                </div>
            </div>
            <div class="score-box" style="color: ${scoreColor}">
                ${scoreValue}
                <span class="score-label">${scoreLabel}</span>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// ==========================================
// ANIMAÇÃO DE FUNDO (PARTÍCULAS)
// ==========================================
const canvas = document.getElementById('art-background'); 
if(canvas) {
    const ctx = canvas.getContext('2d'); let particlesArray;
    function setCanvasSize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } setCanvasSize();
    class Particle { constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * 1.5 + 0.5; this.speedX = Math.random() * 1 - 0.5; this.speedY = Math.random() * 1 - 0.5; this.color = `hsl(${Math.random() * 60 + 200}, 70%, 50%)`; } update() { this.x += this.speedX; this.y += this.speedY; if (this.x > canvas.width || this.x < 0) this.speedX *= -1; if (this.y > canvas.height || this.y < 0) this.speedY *= -1; } draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); } }
    function init() { particlesArray = []; let numberOfParticles = (canvas.height * canvas.width) / 12000; for (let i = 0; i < numberOfParticles; i++) { particlesArray.push(new Particle()); } }
    function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); particlesArray[i].draw(); } requestAnimationFrame(animate); }
    init(); animate(); window.addEventListener('resize', () => { setCanvasSize(); init(); });
}