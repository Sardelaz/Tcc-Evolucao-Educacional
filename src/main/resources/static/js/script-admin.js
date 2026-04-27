let questoes = [];
let questaoAtualIndex = 1;
let totalQuestoes = 5;

// Busca automaticamente a próxima fase e bloqueia o campo para evitar duplicatas
document.getElementById('modulo').addEventListener('change', async (e) => {
    const modulo = e.target.value;
    const faseInput = document.getElementById('fase');

    if (!modulo) return;

    try {
        const response = await fetch(`/api/fases/proxima/${modulo}`);
        if (response.ok) {
            const data = await response.json();
            faseInput.value = data.proximaFase;
            faseInput.readOnly = true; 
            
            // CORREÇÃO VISUAL: Garante que o fundo seja cinza claro mas o texto seja preto e visível
            faseInput.style.backgroundColor = "#e9ecef"; 
            faseInput.style.color = "#212529"; 
            faseInput.style.cursor = "not-allowed";
            console.log(`Próxima fase para ${modulo}: ${data.proximaFase}`);
        }
    } catch (error) {
        console.error("Erro ao buscar próxima fase:", error);
    }
});

document.getElementById('qtd_perguntas').addEventListener('change', (e) => {
    totalQuestoes = parseInt(e.target.value) || 1;
    document.getElementById('indicador-questao').textContent = `Formulando Questão ${questaoAtualIndex} de ${totalQuestoes}`;
});

document.getElementById('form-admin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('tipo_pergunta').value;

    // Validação de alternativas duplicadas (Front-end)
    if (tipo === 'multipla') {
        const altA = document.getElementById('alt_a').value.trim().toLowerCase();
        const altB = document.getElementById('alt_b').value.trim().toLowerCase();
        const altC = document.getElementById('alt_c').value.trim().toLowerCase();
        const altD = document.getElementById('alt_d').value.trim().toLowerCase();

        const preenchidas = [altA, altB, altC, altD].filter(val => val !== '');
        const unicas = new Set(preenchidas);

        if (preenchidas.length !== unicas.size) {
            alert('⚠️ ERRO: Você preencheu alternativas idênticas nesta questão!\nPor favor, corrija para continuar.');
            return;
        }
    }

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
            videoAulaUrl: document.getElementById('video_aula_url').value,
            especial: document.getElementById('is_especial').checked, // ADIÇÃO DO CAMPO ESPECIAL
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
                let msgErro = 'Erro ao salvar fase.';
                try {
                    const dataError = await response.json();
                    if (dataError.erro) msgErro = dataError.erro;
                } catch(e) {}
                alert('⚠️ ERRO: ' + msgErro);
                btn.textContent = "Salvar Pergunta";
                btn.disabled = false;
                questoes.pop();
            }
        } catch (error) {
            alert('Erro de conexão.');
            btn.textContent = "Salvar Pergunta";
            btn.disabled = false;
            questoes.pop();
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
    }
}