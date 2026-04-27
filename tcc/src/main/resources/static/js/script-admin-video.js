document.getElementById('form-admin-video').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        titulo: document.getElementById('titulo').value,
        modulo: document.getElementById('modulo').value,
        url: document.getElementById('url').value
    };

    const btn = document.getElementById('btn-submit');
    btn.textContent = "A salvar no servidor...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Videoaula cadastrada com sucesso!');
            window.location.href = '/painel-geral';
        } else {
            alert('Erro ao salvar vídeo no banco de dados.');
            btn.textContent = "Salvar Videoaula";
            btn.disabled = false;
        }
    } catch (error) {
        alert('Erro de conexão física.');
        btn.textContent = "Salvar Videoaula";
        btn.disabled = false;
    }
});