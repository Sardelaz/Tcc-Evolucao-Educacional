const btnCheckin = document.getElementById('checkin-btn');
const countStreak = document.getElementById('day-streak-count');
let desafioJaConcluidoHoje = false;

fetch('/api/perfil')
    .then(res => res.json())
    .then(perfil => {
        countStreak.textContent = `🔥 ${perfil.streak}`;
        document.getElementById('user-level-badge').textContent = `Nível ${perfil.nivel}`;
        document.getElementById('current-xp-text').textContent = `${perfil.xp} XP`;
        document.getElementById('next-level-xp').textContent = `Meta: ${perfil.xpProximoNivel} XP`;
        const xpNesteNivel = perfil.xp % 100;
        document.getElementById('xp-progress-bar').style.width = `${xpNesteNivel}%`;
        desafioJaConcluidoHoje = perfil.desafioConcluidoHoje;
    })
    .catch(err => console.error("Erro ao carregar perfil:", err));

btnCheckin.addEventListener('click', () => {
    fetch('/api/checkin', { method: 'POST' })
        .then(res => res.json())
        .then(dados => {
            countStreak.textContent = `🔥 ${dados.streak}`;
            document.getElementById('user-level-badge').textContent = `Nível ${dados.nivel}`;
            document.getElementById('current-xp-text').textContent = `${dados.xp} XP`;
            document.getElementById('next-level-xp').textContent = `Meta: ${dados.xpProximoNivel} XP`;
            const xpNesteNivel = dados.xp % 100;
            document.getElementById('xp-progress-bar').style.width = `${xpNesteNivel}%`;
            btnCheckin.disabled = true;
            btnCheckin.textContent = 'Feito! (+100 XP)';
        });
});

const modal = document.getElementById('daily-modal');
const btnDesafioCard = document.getElementById('desafio-card');
const btnCloseModal = document.getElementById('close-modal-btn');
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

btnDesafioCard.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = desafioDeHoje.titulo;
    document.getElementById('modal-subtitle').textContent = `Hoje é ${nomeDoDiaLocale}`;
    document.getElementById('modal-desc').textContent = desafioDeHoje.desc;
    document.getElementById('modal-reward').textContent = `+${desafioDeHoje.xp} XP`;

    if (desafioJaConcluidoHoje) {
        btnClaim.disabled = true;
        btnClaim.textContent = "Recompensa Resgatada!";
        btnClaim.style.background = "#4CAF50";
    } else {
        btnClaim.disabled = false;
        btnClaim.textContent = "Verificar Conclusão";
        btnClaim.style.background = "var(--cor-ranking)";
    }
    modal.classList.add('active');
});

btnCloseModal.addEventListener('click', () => {
    modal.classList.remove('active');
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
                document.getElementById('user-level-badge').textContent = `Nível ${dados.nivel}`;
                document.getElementById('current-xp-text').textContent = `${dados.xpTotal} XP`;
                document.getElementById('next-level-xp').textContent = `Meta: ${dados.xpProximoNivel} XP`;
                const xpNesteNivel = dados.xpTotal % 100;
                document.getElementById('xp-progress-bar').style.width = `${xpNesteNivel}%`;

                desafioJaConcluidoHoje = true;
                btnClaim.style.background = "#4CAF50";
                btnClaim.textContent = `Sucesso! (+${dados.xpGanho} XP)`;

                setTimeout(() => modal.classList.remove('active'), 2000);
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

const canvas = document.getElementById('art-background'); const ctx = canvas.getContext('2d'); let particlesArray;
function setCanvasSize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } setCanvasSize();
class Particle { constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * 1.5 + 0.5; this.speedX = Math.random() * 1 - 0.5; this.speedY = Math.random() * 1 - 0.5; this.color = `hsl(${Math.random() * 60 + 200}, 70%, 50%)`; } update() { this.x += this.speedX; this.y += this.speedY; if (this.x > canvas.width || this.x < 0) this.speedX *= -1; if (this.y > canvas.height || this.y < 0) this.speedY *= -1; } draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); } }
function init() { particlesArray = []; let numberOfParticles = (canvas.height * canvas.width) / 12000; for (let i = 0; i < numberOfParticles; i++) { particlesArray.push(new Particle()); } }
function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); particlesArray[i].draw(); } requestAnimationFrame(animate); }
init(); animate(); window.addEventListener('resize', () => { setCanvasSize(); init(); });
