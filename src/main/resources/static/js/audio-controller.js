// src/main/resources/static/js/audio-controller.js

document.addEventListener('DOMContentLoaded', () => {
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');

    if (!bgMusic || !musicToggle) return;

    bgMusic.volume = 0.3;

    // Verifica se a música deve estar a tocar ao carregar a página
    if (sessionStorage.getItem('musicPlaying') === 'true') {
        const savedTime = parseFloat(sessionStorage.getItem('musicTime') || 0);
        bgMusic.currentTime = savedTime;
        bgMusic.play().then(() => {
            musicToggle.innerHTML = '🔊 Música ON';
        }).catch(e => {
            console.log("Reprodução automática bloqueada pelo navegador.");
            sessionStorage.setItem('musicPlaying', 'false');
        });
    }

    // Atualiza o tempo atual no sessionStorage para persistência entre trocas de página
    bgMusic.addEventListener('timeupdate', () => {
        if (!bgMusic.paused) {
            sessionStorage.setItem('musicTime', bgMusic.currentTime);
        }
    });

    // Lógica do botão de alternância (ON/OFF)
    musicToggle.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play();
            sessionStorage.setItem('musicPlaying', 'true');
            musicToggle.innerHTML = '🔊 Música ON';
        } else {
            bgMusic.pause();
            sessionStorage.setItem('musicPlaying', 'false');
            musicToggle.innerHTML = '🎵 Música OFF';
        }
    });
});