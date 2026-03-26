document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // ANIMAÇÃO DE FUNDO (PARTÍCULAS)
    // ==========================================
    const canvas = document.getElementById('art-background'); 
    if(canvas) {
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
                // Cores variando para o tema do simulado (avermelhados e laranjas)
                this.color = `hsl(${Math.random() * 40 + 340}, 70%, 50%)`; 
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
            let numberOfParticles = (canvas.height * canvas.width) / 12000; 
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
    }
});