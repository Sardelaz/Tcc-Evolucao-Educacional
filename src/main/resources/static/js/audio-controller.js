document.addEventListener("DOMContentLoaded", () => {
    const music = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    
    if (music && musicToggle) {
        const savedVol = localStorage.getItem('musicVolume');
        music.volume = savedVol ? parseFloat(savedVol) : 0.3;
        
        const isMusicPlaying = localStorage.getItem('musicPlaying') === 'true';

        if (isMusicPlaying) {
            music.play().then(() => {
                musicToggle.textContent = '🎵 Música ON';
            }).catch(() => {
                musicToggle.textContent = '🎵 Música OFF';
            });
        }

        musicToggle.addEventListener('click', () => {
            if (music.paused) {
                music.play();
                musicToggle.textContent = '🎵 Música ON';
                localStorage.setItem('musicPlaying', 'true');
            } else {
                music.pause();
                musicToggle.textContent = '🎵 Música OFF';
                localStorage.setItem('musicPlaying', 'false');
            }
        });

        document.body.addEventListener('click', function unlockAudio() {
            if (localStorage.getItem('musicPlaying') === 'true' && music.paused) {
                music.play();
                musicToggle.textContent = '🎵 Música ON';
            }
            document.body.removeEventListener('click', unlockAudio);
        }, { once: true });
    }
});