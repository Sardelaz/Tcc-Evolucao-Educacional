let questoesEmMemoria = [];

// Esconde ou mostra as alternativas dependendo do tipo de pergunta
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

// Atualiza os textos e botões conforme o professor vai criando as questões
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
        btnSubmit.style.backgroundColor = "#00A8FF";
    } else if (questaoAtual === qtdDesejada) {
        btnSubmit.textContent = "Salvar e Finalizar Criação da Fase";
        btnSubmit.style.backgroundColor = "#4CAF50";
    }

    // Trava as configurações da fase depois que começou a criar as questões
    const temPerguntaSalva = questoesEmMemoria.length > 0;
    document.getElementById('modulo').disabled = temPerguntaSalva;
    document.getElementById('fase').disabled = temPerguntaSalva;
    document.getElementById('qtd_perguntas').disabled = temPerguntaSalva;
}

document.getElementById('qtd_perguntas').addEventListener('input', atualizarInterface);
window.onload = () => { toggleAlternativas(); atualizarInterface(); };

document.getElementById('form-admin').addEventListener('submit', function (e) {
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
        alternativas: tipo === 'multipla' ? [
            document.getElementById('alt_a').value,
            document.getElementById('alt_b').value,
            document.getElementById('alt_c').value,
            document.getElementById('alt_d').value
        ] : [],
        resposta: respostaFinal
    };

    questoesEmMemoria.push(novaQuestao);

    // Se ainda faltam perguntas, limpa os campos e foca no enunciado
    if (questoesEmMemoria.length < qtdDesejada) {
        document.getElementById('enunciado').value = '';
        document.getElementById('alt_a').value = '';
        document.getElementById('alt_b').value = '';
        document.getElementById('alt_c').value = '';
        document.getElementById('alt_d').value = '';
        document.getElementById('resposta_correta_multipla').value = '';
        document.getElementById('resposta_correta_dissertativa').value = '';
        atualizarInterface();
        document.getElementById('enunciado').focus();
    } else {
        const modulo = document.getElementById('modulo').value;
        const fase = parseInt(document.getElementById('fase').value);
        const faseObj = { fase: fase, qtd: qtdDesejada, questoes: questoesEmMemoria };

        // === PERSISTÊNCIA NO LOCALSTORAGE ===
        // Isso salva no seu navegador para não perder os dados se o Java reiniciar
        const chaveLocal = `fases_${modulo}`;
        let fasesLocais = JSON.parse(localStorage.getItem(chaveLocal) || "[]");
        fasesLocais = fasesLocais.filter(f => f.fase !== fase); // Remove se já existir a mesma fase
        fasesLocais.push(faseObj);
        fasesLocais.sort((a, b) => a.fase - b.fase);
        localStorage.setItem(chaveLocal, JSON.stringify(fasesLocais));

        // Envia também para o servidor Java
        fetch(`/api/fases/${modulo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faseObj)
        }).then(() => {
            alert(`🎉 Sucesso! A Fase ${fase} foi salva no navegador e no servidor.`);
            questoesEmMemoria = [];
            this.reset();
            document.getElementById('modulo').disabled = false;
            document.getElementById('fase').disabled = false;
            document.getElementById('qtd_perguntas').disabled = false;
            toggleAlternativas();
            atualizarInterface();
        }).catch(err => {
            alert("Salvo localmente! (Servidor Java não respondeu)");
            console.error(err);
        });
    }
});