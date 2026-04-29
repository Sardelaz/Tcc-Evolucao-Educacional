let questoesSimulado = [];
let questaoSimuladoIndex = 1;
let totalQuestoesSimulado = 10;

document.getElementById('qtd_perguntas').addEventListener('change', (e) => {
    totalQuestoesSimulado = parseInt(e.target.value) || 1;
    document.getElementById('indicador-questao').textContent = `Formulando Questão ${questaoSimuladoIndex} de ${totalQuestoesSimulado}`;
});

document.getElementById('form-admin-simulado').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('tipo_pergunta').value;
    const q = {
        tipo: tipo,
        enunciado: document.getElementById('enunciado').value,
        imagemUrl: document.getElementById('imagem_url').value,
        alternativaA: tipo === 'multipla' ? document.getElementById('alt_a').value : null,
        alternativaB: tipo === 'multipla' ? document.getElementById('alt_b').value : null,
        alternativaC: tipo === 'multipla' ? document.getElementById('alt_c').value : null,
        alternativaD: tipo === 'multipla' ? document.getElementById('alt_d').value : null,
        respostaCorreta: tipo === 'multipla' ? document.getElementById('resposta_correta_multipla').value : document.getElementById('resposta_correta_dissertativa').value,
        desafio: false,
        // CORREÇÃO: Alterado de null para 0
        tempoDesafio: 0, 
        // CORREÇÃO: Alterado de null para 0
        xpExtra: 0 
    };

    questoesSimulado.push(q);

    if (questaoSimuladoIndex < totalQuestoesSimulado) {
        questaoSimuladoIndex++;
        document.getElementById('indicador-questao').textContent = `Formulando Questão ${questaoSimuladoIndex} de ${totalQuestoesSimulado}`;

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
    } else {
        const payload = {
            modulo: document.getElementById('modulo_simulado').value,
            fase: 1,
            qtd: totalQuestoesSimulado,
            videoAulaUrl: document.getElementById('video_aula_url').value, // SALVA A URL DO VIDEO
            questoes: questoesSimulado
        };

        const btn = document.getElementById('btn-submit');
        btn.textContent = "Salvando Simulado...";
        btn.disabled = true;

        try {
            const response = await fetch(`/api/fases/${payload.modulo}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Simulado Oficial criado com sucesso!');
                window.location.href = '/painel-geral';
            } else {
                alert('Erro ao salvar simulado.');
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