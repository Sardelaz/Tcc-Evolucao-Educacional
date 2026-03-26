let simuladoEmMemoria = null; // Objeto da fase (simulado inteiro)
let questoesEmMemoria = []; // Array das questões
let indiceEdicaoAtual = -1; // Qual questão está sendo editada

// Alterna entre Múltipla Escolha e Dissertativa
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

// Busca o Simulado no servidor / localStorage
async function buscarSimulado() {
    const modulo = document.getElementById('modulo_busca').value;
    const statusDiv = document.getElementById('status-busca');
    const listaContainer = document.getElementById('container-lista-questoes');
    const editorSecao = document.getElementById('secao-editor');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo');

    if (!modulo) {
        statusDiv.textContent = "Por favor, selecione um simulado.";
        statusDiv.style.color = "#e74c3c";
        return;
    }

    statusDiv.textContent = "Buscando simulado...";
    statusDiv.style.color = "#EAEAEA";
    listaContainer.style.display = "none";
    editorSecao.style.display = "none";
    btnSalvarTudo.style.display = "none";

    try {
        let fasesLocais = JSON.parse(localStorage.getItem(`fases_${modulo}`) || "[]");
        const resp = await fetch(`/api/fases/${modulo}`);
        let fasesServidor = await resp.json();

        let fasesFinais = fasesServidor.length > 0 ? fasesServidor : fasesLocais;

        // Simulados sempre ficam salvos na Fase 1 do módulo "simulado_X"
        let simulado = fasesFinais.find(f => f.fase === 1);

        if (!simulado || !simulado.questoes || simulado.questoes.length === 0) {
            statusDiv.textContent = "Nenhum simulado cadastrado para esta matéria ainda.";
            statusDiv.style.color = "#f39c12";
            return;
        }

        simuladoEmMemoria = simulado;
        questoesEmMemoria = [...simulado.questoes]; // Copia o array

        statusDiv.textContent = `Simulado encontrado! Contém ${questoesEmMemoria.length} questões.`;
        statusDiv.style.color = "#4CAF50";

        renderizarListaQuestoes();
        
        listaContainer.style.display = "block";
        btnSalvarTudo.style.display = "block";

    } catch (error) {
        console.error("Erro ao buscar:", error);
        statusDiv.textContent = "Erro ao buscar dados do servidor.";
        statusDiv.style.color = "#e74c3c";
    }
}

// Renderiza os botões das questões
function renderizarListaQuestoes() {
    const listaContainer = document.getElementById('container-lista-questoes');
    listaContainer.innerHTML = '<p style="margin-bottom: 10px; font-size: 0.9rem; color: #888;">Selecione a questão que deseja editar:</p>';

    questoesEmMemoria.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'questao-item-btn';
        if (index === indiceEdicaoAtual) btn.classList.add('active');
        
        let resumoEnunciado = q.enunciado.length > 50 ? q.enunciado.substring(0, 50) + "..." : q.enunciado;
        btn.innerHTML = `<strong>Questão ${index + 1}:</strong> ${resumoEnunciado}`;
        
        btn.onclick = () => carregarQuestaoParaEdicao(index);
        listaContainer.appendChild(btn);
    });
}

// Coloca os dados da questão no formulário
function carregarQuestaoParaEdicao(index) {
    indiceEdicaoAtual = index;
    renderizarListaQuestoes(); // Atualiza a classe 'active'

    const q = questoesEmMemoria[index];
    document.getElementById('secao-editor').style.display = "block";
    document.getElementById('titulo-editando').textContent = `Editando Questão ${index + 1}`;

    document.getElementById('tipo_pergunta').value = q.tipo || 'multipla';
    toggleAlternativas();

    document.getElementById('enunciado').value = q.enunciado || '';
    document.getElementById('imagem_url').value = q.imagemUrl || '';

    if (q.tipo === 'multipla' || !q.tipo) {
        if (q.alternativas && q.alternativas.length === 4) {
            document.getElementById('alt_a').value = q.alternativas[0];
            document.getElementById('alt_b').value = q.alternativas[1];
            document.getElementById('alt_c').value = q.alternativas[2];
            document.getElementById('alt_d').value = q.alternativas[3];
        }

        // Descobrir qual letra é a resposta correta
        let letraCorreta = "";
        if (q.resposta === q.alternativas[0]) letraCorreta = "A";
        else if (q.resposta === q.alternativas[1]) letraCorreta = "B";
        else if (q.resposta === q.alternativas[2]) letraCorreta = "C";
        else if (q.resposta === q.alternativas[3]) letraCorreta = "D";

        document.getElementById('resposta_correta_multipla').value = letraCorreta;
    } else {
        document.getElementById('resposta_correta_dissertativa').value = q.resposta || '';
    }
}

// Salva a alteração apenas no array em memória
function salvarEdicaoQuestao() {
    if (indiceEdicaoAtual === -1) return;

    const tipo = document.getElementById('tipo_pergunta').value;
    const enunciado = document.getElementById('enunciado').value;
    const imagemUrl = document.getElementById('imagem_url').value;

    let respostaFinal = "";
    let alternativasArray = [];

    if (tipo === 'multipla') {
        alternativasArray = [
            document.getElementById('alt_a').value,
            document.getElementById('alt_b').value,
            document.getElementById('alt_c').value,
            document.getElementById('alt_d').value
        ];
        const letra = document.getElementById('resposta_correta_multipla').value;
        const mapaAlternativas = { 'A': alternativasArray[0], 'B': alternativasArray[1], 'C': alternativasArray[2], 'D': alternativasArray[3] };
        respostaFinal = mapaAlternativas[letra];

        if(!letra) { alert("Selecione a letra correta!"); return; }
    } else {
        respostaFinal = document.getElementById('resposta_correta_dissertativa').value;
        if(!respostaFinal) { alert("Digite a resposta correta!"); return; }
    }

    if (!enunciado) { alert("O enunciado não pode ser vazio!"); return; }

    // Atualiza a questão no array
    questoesEmMemoria[indiceEdicaoAtual] = {
        tipo: tipo,
        enunciado: enunciado,
        imagemUrl: imagemUrl,
        alternativas: alternativasArray,
        resposta: respostaFinal
    };

    alert(`Questão ${indiceEdicaoAtual + 1} atualizada na lista! Lembre-se de clicar em "Salvar Simulado Atualizado" no fim da página para gravar no servidor.`);
    
    // Esconde o editor e atualiza a lista
    document.getElementById('secao-editor').style.display = "none";
    indiceEdicaoAtual = -1;
    renderizarListaQuestoes();
}

// Pega o array atualizado e manda pro Servidor / LocalStorage
async function salvarSimuladoCompleto() {
    const modulo = document.getElementById('modulo_busca').value;
    const btn = document.getElementById('btn-salvar-tudo');

    if (!modulo || questoesEmMemoria.length === 0) return;

    btn.textContent = "Salvando...";
    btn.disabled = true;

    // Reconstrói o objeto Fase 1
    const simuladoAtualizado = {
        fase: 1,
        qtd: questoesEmMemoria.length,
        questoes: questoesEmMemoria
    };

    try {
        // Atualiza LocalStorage
        const chaveLocal = `fases_${modulo}`;
        let fasesLocais = JSON.parse(localStorage.getItem(chaveLocal) || "[]");
        fasesLocais = fasesLocais.filter(f => f.fase !== 1); // Remove a antiga fase 1
        fasesLocais.push(simuladoAtualizado);
        localStorage.setItem(chaveLocal, JSON.stringify(fasesLocais));

        // Envia para o Java (O POST na API atualiza/sobrescreve se tiver mesma fase)
        await fetch(`/api/fases/${modulo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(simuladoAtualizado)
        });

        alert("✅ Simulado atualizado com sucesso no servidor!");
        
        // Limpa a tela
        document.getElementById('status-busca').textContent = "";
        document.getElementById('container-lista-questoes').style.display = "none";
        document.getElementById('secao-editor').style.display = "none";
        btn.style.display = "none";
        document.getElementById('modulo_busca').value = "";

    } catch (e) {
        console.error(e);
        alert("⚠️ Salvo localmente, mas houve um erro ao enviar para o servidor Java.");
    } finally {
        btn.textContent = "Salvar Simulado Atualizado no Servidor";
        btn.disabled = false;
    }
}