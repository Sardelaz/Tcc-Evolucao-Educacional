let simuladoAtualId = null;
let simuladoQuestoes = [];
let questaoSendoEditadaIndex = null;

async function buscarSimulado() {
    const modulo = document.getElementById('modulo_busca').value;
    if (!modulo) return alert("Selecione um simulado.");

    document.getElementById('status-busca').textContent = "Carregando simulado...";

    try {
        const response = await fetch(`/api/fases/${modulo}/1`);
        if (response.ok) {
            const data = await response.json();
            simuladoAtualId = data.id;
            simuladoQuestoes = data.questoes;

            document.getElementById('edit_video_aula_url').value = data.videoAulaUrl || '';

            renderizarListaQuestoes();
            document.getElementById('status-busca').textContent = "";
            document.getElementById('btn-salvar-tudo').style.display = 'block';
        } else {
            document.getElementById('status-busca').textContent = "Simulado não encontrado.";
            document.getElementById('container-lista-questoes').style.display = 'none';
            document.getElementById('secao-editor').style.display = 'none';
            document.getElementById('btn-salvar-tudo').style.display = 'none';
        }
    } catch (error) {
        document.getElementById('status-busca').textContent = "Erro ao buscar simulado.";
    }
}

function renderizarListaQuestoes() {
    const container = document.getElementById('container-lista-questoes');
    container.innerHTML = '';

    simuladoQuestoes.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'questao-item-btn';
        const excerto = q.enunciado.length > 50 ? q.enunciado.substring(0, 50) + '...' : q.enunciado;
        btn.textContent = `Questão ${index + 1}: ${excerto}`;
        btn.onclick = () => carregarQuestaoParaEdicao(index, btn);
        container.appendChild(btn);
    });

    container.style.display = 'block';
}

function carregarQuestaoParaEdicao(index, btnElement) {
    document.querySelectorAll('.questao-item-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    questaoSendoEditadaIndex = index;
    const q = simuladoQuestoes[index];

    document.getElementById('secao-editor').style.display = 'block';
    document.getElementById('titulo-editando').textContent = `Editando Questão ${index + 1}`;

    document.getElementById('tipo_pergunta').value = q.tipo;
    if (typeof toggleAlternativas === 'function') toggleAlternativas();

    document.getElementById('enunciado').value = q.enunciado;
    document.getElementById('imagem_url').value = q.imagemUrl || '';

    if (q.tipo === 'multipla') {
        document.getElementById('alt_a').value = q.alternativaA || '';
        document.getElementById('alt_b').value = q.alternativaB || '';
        document.getElementById('alt_c').value = q.alternativaC || '';
        document.getElementById('alt_d').value = q.alternativaD || '';
        document.getElementById('resposta_correta_multipla').value = q.respostaCorreta;
    } else {
        document.getElementById('resposta_correta_dissertativa').value = q.respostaCorreta;
    }
}

function salvarEdicaoQuestao() {
    if (questaoSendoEditadaIndex === null) return;

    const tipo = document.getElementById('tipo_pergunta').value;
    const q = simuladoQuestoes[questaoSendoEditadaIndex];

    q.tipo = tipo;
    q.enunciado = document.getElementById('enunciado').value;
    q.imagemUrl = document.getElementById('imagem_url').value;

    if (tipo === 'multipla') {
        q.alternativaA = document.getElementById('alt_a').value;
        q.alternativaB = document.getElementById('alt_b').value;
        q.alternativaC = document.getElementById('alt_c').value;
        q.alternativaD = document.getElementById('alt_d').value;
        q.respostaCorreta = document.getElementById('resposta_correta_multipla').value;
    } else {
        q.respostaCorreta = document.getElementById('resposta_correta_dissertativa').value;
    }

    alert('Edição da questão aplicada localmente. Não se esqueça de "Salvar Simulado Atualizado no Servidor"!');
    renderizarListaQuestoes();
    document.getElementById('secao-editor').style.display = 'none';
}

async function salvarSimuladoCompleto() {
    if (!simuladoAtualId) return;

    const payload = {
        id: simuladoAtualId,
        modulo: document.getElementById('modulo_busca').value,
        fase: 1,
        qtd: simuladoQuestoes.length,
        videoAulaUrl: document.getElementById('edit_video_aula_url').value, // SALVA A URL EDITADA
        questoes: simuladoQuestoes
    };

    const btn = document.getElementById('btn-salvar-tudo');
    btn.textContent = "Salvando no servidor...";

    try {
        const response = await fetch(`/api/fases/${payload.modulo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Simulado atualizado com sucesso no servidor!');
            window.location.reload();
        } else {
            alert('Erro ao atualizar simulado.');
        }
    } catch (error) {
        alert('Erro de conexão ao salvar.');
    }
    btn.textContent = "Salvar Simulado Atualizado no Servidor";
}