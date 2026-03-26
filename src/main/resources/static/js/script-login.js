// Função para alternar entre os formulários (Login, Registro, Esqueci a Senha)
function switchForm(targetSectionId) {
    // Esconde todas as seções
    const sections = document.querySelectorAll('.auth-section');
    sections.forEach(section => {
        section.classList.remove('active');
        // Pequeno atraso para o display none permitir a animação de saída
        setTimeout(() => {
            if (!section.classList.contains('active')) {
                section.style.display = 'none';
            }
        }, 400); 
    });

    // Mostra a seção alvo
    const targetSection = document.getElementById(targetSectionId);
    targetSection.style.display = 'block';
    // Timeout necessário para o CSS transition de opacity e transform funcionar após display block
    setTimeout(() => {
        targetSection.classList.add('active');
    }, 10);
}

// Inicializa garantindo que apenas o login está visível
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('login-section').style.display = 'block';
});

// Lógica de simulação de "Esqueci a Senha"
function enviarRecuperacao(event) {
    event.preventDefault(); // Impede o reload da página
    const email = document.getElementById('forgot-email').value;
    
    if(email) {
        // Simula o envio
        document.getElementById('success-modal').classList.add('active');
        document.getElementById('forgot-email').value = ''; // Limpa o campo
    }
}

// Fecha o modal de sucesso e volta pro login
function fecharModalSucesso() {
    document.getElementById('success-modal').classList.remove('active');
    switchForm('login-section');
}


// ==========================================
// ANIMAÇÃO DE FUNDO (PARTÍCULAS)
// ==========================================
const canvas = document.getElementById('art-background'); 
const ctx = canvas.getContext('2d'); 
let particlesArray;

function setCanvasSize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
} 
setCanvasSize();

class Particle { 
    constructor() { 
        this.x = Math.random() * canvas.width; 
        this.y = Math.random() * canvas.height; 
        this.size = Math.random() * 1.5 + 0.5; 
        this.speedX = Math.random() * 1 - 0.5; 
        this.speedY = Math.random() * 1 - 0.5; 
        // Cores com tema azul/roxo combinando com o fundo dark
        this.color = `hsl(${Math.random() * 60 + 200}, 70%, 50%)`; 
    } 
    update() { 
        this.x += this.speedX; 
        this.y += this.speedY; 
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1; 
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1; 
    } 
    draw() { 
        ctx.fillStyle = this.color; 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
        ctx.fill(); 
    } 
}

function init() { 
    particlesArray = []; 
    let numberOfParticles = (canvas.height * canvas.width) / 10000; // Levemente mais partículas para o login
    for (let i = 0; i < numberOfParticles; i++) { 
        particlesArray.push(new Particle()); 
    } 
}

function animate() { 
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    for (let i = 0; i < particlesArray.length; i++) { 
        particlesArray[i].update(); 
        particlesArray[i].draw(); 
    } 
    requestAnimationFrame(animate); 
}

init(); 
animate(); 

window.addEventListener('resize', () => { 
    setCanvasSize(); 
    init(); 
});