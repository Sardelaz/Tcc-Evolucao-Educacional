let questoes = [];
let questaoAtualIndex = 1;
let totalQuestoes = 5;

document.getElementById('qtd_perguntas').addEventListener('change', (e) => {
    totalQuestoes = parseInt(e.target.value) || 1;
    document.getElementById('indicador-questao').textContent = `Formulando Questão ${questaoAtualIndex} de ${totalQuestoes}`;
});

document.getElementById('form-admin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('tipo_pergunta').value;
    const isDesafio = document.getElementById('is_desafio').checked;

    const q = {
        tipo: tipo,
        enunciado: document.getElementById('enunciado').value,
        imagemUrl: document.getElementById('imagem_url').value,
        alternativaA: tipo === 'multipla' ? document.getElementById('alt_a').value : null,
        alternativaB: tipo === 'multipla' ? document.getElementById('alt_b').value : null,
        alternativaC: tipo === 'multipla' ? document.getElementById('alt_c').value : null,
        alternativaD: tipo === 'multipla' ? document.getElementById('alt_d').value : null,
        respostaCorreta: tipo === 'multipla' ? document.getElementById('resposta_correta_multipla').value : document.getElementById('resposta_correta_dissertativa').value,
        desafio: isDesafio,
        tempoDesafio: isDesafio ? parseInt(document.getElementById('tempo_desafio').value) : null,
        xpExtra: isDesafio ? parseInt(document.getElementById('xp_extra').value) : null
    };

    questoes.push(q);

    if (questaoAtualIndex < totalQuestoes) {
        questaoAtualIndex++;
        document.getElementById('indicador-questao').textContent = `Formulando Questão ${questaoAtualIndex} de ${totalQuestoes}`;
        limparCamposQuestao();
    } else {
        const payload = {
            modulo: document.getElementById('modulo').value,
            fase: parseInt(document.getElementById('fase').value),
            qtd: totalQuestoes,
            videoAulaUrl: document.getElementById('video_aula_url').value, // CAPTURA O URL DO VÍDEO
            questoes: questoes
        };

        const btn = document.getElementById('btn-submit');
        btn.textContent = "Salvando no Servidor...";
        btn.disabled = true;

        try {
            const response = await fetch(`/api/fases/${payload.modulo}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Fase criada com sucesso!');
                window.location.reload();
            } else {
                alert('Erro ao salvar fase no banco.');
                btn.textContent = "Salvar Pergunta";
                btn.disabled = false;
            }
        } catch (error) {
            alert('Erro de conexão.');
            btn.textContent = "Salvar Pergunta";
            btn.disabled = false;
        }
    }
});

function limparCamposQuestao() {
    document.getElementById('enunciado').value = '';
    document.getElementById('imagem_url').value = '';
    document.getElementById('alt_a').value = '';
    document.getElementById('alt_b').value = '';
    document.getElementById('alt_c').value = '';
    document.getElementById('alt_d').value = '';
    document.getElementById('resposta_correta_multipla').value = '';
    document.getElementById('resposta_correta_dissertativa').value = '';
    document.getElementById('upload_status').style.display = 'none';
    document.getElementById('imagem_upload').value = '';

    const checkDesafio = document.getElementById('is_desafio');
    if (checkDesafio) {
        checkDesafio.checked = false;
        document.getElementById('desafio-fields').style.display = 'none';
        document.getElementById('tempo_desafio').value = 30;
        document.getElementById('xp_extra').value = 50;
    }
}