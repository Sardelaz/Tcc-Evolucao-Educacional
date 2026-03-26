let questoesEmMemoria = [];

function toggleAlternativas() {
    const tipo = document.getElementById('tipo_pergunta').value;
    const box = document.getElementById('box-alternativas');
    const respMultipla = document.getElementById('resposta_correta_multipla');
    const respDissertativa = document.getElementById('resposta_correta_dissertativa');

    if (tipo === 'dissertativa') {
        box.classList.add('hidden');
        respMultipla.classList.add('hidden');
        respMultipla.removeAttribute('required');
        respDissertativa.classList.remove('hidden');
        respDissertativa.setAttribute('required', 'true');
    } else {
        box.classList.remove('hidden');
        respMultipla.classList.remove('hidden');
        respMultipla.setAttribute('required', 'true');
        respDissertativa.classList.add('hidden');
        respDissertativa.removeAttribute('required');
    }
}

async function fazerUpload(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const statusSpan = document.getElementById('upload_status');
    statusSpan.textContent = "Enviando imagem...";
    statusSpan.style.display = "block";
    statusSpan.style.color = "#FFD700";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.url) {
            document.getElementById('imagem_url').value = data.url;
            statusSpan.textContent = "Upload concluído com sucesso!";
            statusSpan.style.color = "#4CAF50";
        } else {
            statusSpan.textContent = "Erro no upload.";
            statusSpan.style.color = "#e74c3c";
        }
    } catch (e) {
        statusSpan.textContent = "Erro de conexão com o servidor.";
        statusSpan.style.color = "#e74c3c";
    }
}

function atualizarInterface() {
    const qtdDesejada = parseInt(document.getElementById('qtd_perguntas').value) || 1;
    const questaoAtual = questoesEmMemoria.length + 1;
    const indicador = document.getElementById('indicador-questao');
    const btnSubmit = document.getElementById('btn-submit');

    if (questaoAtual <= qtdDesejada) {
        indicador.textContent = `Formulando Questão ${questaoAtual} de ${qtdDesejada}`;
    }

    if (questaoAtual < qtdDesejada) {
        btnSubmit.textContent = "Salvar Pergunta (Ir para a Próxima)";
        btnSubmit.style.backgroundColor = "#e74c3c";
    } else if (questaoAtual === qtdDesejada) {
        btnSubmit.textContent = "Salvar e Publicar Simulado";
        btnSubmit.style.backgroundColor = "#4CAF50";
    }

    const temPerguntaSalva = questoesEmMemoria.length > 0;
    document.getElementById('modulo_simulado').disabled = temPerguntaSalva;
    document.getElementById('qtd_perguntas').disabled = temPerguntaSalva;
}

document.getElementById('qtd_perguntas').addEventListener('input', atualizarInterface);
window.onload = () => { toggleAlternativas(); atualizarInterface(); };

document.getElementById('form-admin-simulado').addEventListener('submit', function (e) {
    e.preventDefault();

    const qtdDesejada = parseInt(document.getElementById('qtd_perguntas').value);
    const tipo = document.getElementById('tipo_pergunta').value;

    let respostaFinal = "";
    if (tipo === 'multipla') {
        const letra = document.getElementById('resposta_correta_multipla').value;
        const mapaAlternativas = {
            'A': document.getElementById('alt_a').value,
            'B': document.getElementById('alt_b').value,
            'C': document.getElementById('alt_c').value,
            'D': document.getElementById('alt_d').value
        };
        respostaFinal = mapaAlternativas[letra];
    } else {
        respostaFinal = document.getElementById('resposta_correta_dissertativa').value;
    }

    const novaQuestao = {
        tipo: tipo,
        enunciado: document.getElementById('enunciado').value,
        imagemUrl: document.getElementById('imagem_url').value, 
        alternativas: tipo === 'multipla' ? [
            document.getElementById('alt_a').value,
            document.getElementById('alt_b').value,
            document.getElementById('alt_c').value,
            document.getElementById('alt_d').value
        ] : [],
        resposta: respostaFinal
    };

    questoesEmMemoria.push(novaQuestao);

    if (questoesEmMemoria.length < qtdDesejada) {
        document.getElementById('enunciado').value = '';
        document.getElementById('imagem_url').value = ''; 
        document.getElementById('imagem_upload').value = ''; 
        document.getElementById('upload_status').style.display = 'none'; 
        document.getElementById('alt_a').value = '';
        document.getElementById('alt_b').value = '';
        document.getElementById('alt_c').value = '';
        document.getElementById('alt_d').value = '';
        document.getElementById('resposta_correta_multipla').value = '';
        document.getElementById('resposta_correta_dissertativa').value = '';
        atualizarInterface();
        document.getElementById('enunciado').focus();
    } else {
        const modulo = document.getElementById('modulo_simulado').value;
        const fase = parseInt(document.getElementById('fase_simulado').value);
        const faseObj = { fase: fase, qtd: qtdDesejada, questoes: questoesEmMemoria };

        const chaveLocal = `fases_${modulo}`;
        let fasesLocais = JSON.parse(localStorage.getItem(chaveLocal) || "[]");
        fasesLocais = fasesLocais.filter(f => f.fase !== fase); 
        fasesLocais.push(faseObj);
        fasesLocais.sort((a, b) => a.fase - b.fase);
        localStorage.setItem(chaveLocal, JSON.stringify(fasesLocais));

        fetch(`/api/fases/${modulo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faseObj)
        }).then(() => {
            alert(`🎉 Sucesso! O Simulado de ${modulo.replace('simulado_','').toUpperCase()} foi salvo e já está disponível para os alunos.`);
            questoesEmMemoria = [];
            this.reset();
            document.getElementById('modulo_simulado').disabled = false;
            document.getElementById('qtd_perguntas').disabled = false;
            document.getElementById('upload_status').style.display = 'none';
            toggleAlternativas();
            atualizarInterface();
        }).catch(err => {
            alert("Salvo localmente! (Servidor Java não respondeu)");
            console.error(err);
        });
    }
});