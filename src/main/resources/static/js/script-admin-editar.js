let faseAtualEditando = null;

// Busca os dados da fase no LocalStorage ou no Servidor
async function buscarFase() {
    const modulo = document.getElementById('busca-modulo').value;
    const faseId = parseInt(document.getElementById('busca-fase').value);

    if (!faseId || faseId < 1) {
        alert("Digite um número de fase válido.");
        return;
    }

    // 1. Tenta buscar no localStorage primeiro
    const chaveLocal = `fases_${modulo}`;
    let fasesLocais = JSON.parse(localStorage.getItem(chaveLocal) || "[]");
    let faseEncontrada = fasesLocais.find(f => f.fase === faseId);

    // 2. Se não achar no local, tenta no servidor Java
    if (!faseEncontrada) {
        try {
            const response = await fetch(`/api/fases/${modulo}/${faseId}`);
            if (response.ok) {
                const data = await response.json();
                if(data && data.fase) {
                    faseEncontrada = data;
                }
            }
        } catch (e) {
            console.log("Fase não encontrada no servidor, erro de conexão.");
        }
    }

    if (!faseEncontrada || !faseEncontrada.questoes) {
        alert(`Fase ${faseId} do módulo "${modulo.toUpperCase()}" não foi encontrada!`);
        document.getElementById('editor-area').classList.add('hidden');
        return;
    }

    faseAtualEditando = faseEncontrada;
    
    // Mostra a área de edição
    document.getElementById('editor-area').classList.remove('hidden');
    document.getElementById('fase-title').textContent = `Editando: ${modulo.toUpperCase()} - Fase ${faseId}`;

    renderizarQuestoes();
}

// NOVO: Função para fazer upload direto na tela de edição
async function fazerUploadEdicao(inputElement, index) {
    const file = inputElement.files[0];
    if (!file) return;

    const statusSpan = document.getElementById(`upload_status_${index}`);
    // Acha o campo de URL da mesma questão (card) que a pessoa clicou
    const urlInput = inputElement.closest('.questao-card').querySelector('.q-imagem-url');

    statusSpan.textContent = "Enviando...";
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
            urlInput.value = data.url; // Joga o caminho retornado pro campo de URL
            statusSpan.textContent = "Upload concluído!";
            statusSpan.style.color = "#4CAF50";
        } else {
            statusSpan.textContent = "Erro no upload.";
            statusSpan.style.color = "#e74c3c";
        }
    } catch (e) {
        statusSpan.textContent = "Erro de conexão.";
        statusSpan.style.color = "#e74c3c";
    }
}

// Desenha na tela os cards para cada questão existente
function renderizarQuestoes() {
    const container = document.getElementById('questoes-container');
    container.innerHTML = '';

    faseAtualEditando.questoes.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'questao-card';
        card.dataset.index = index;

        // Garante que o array de alternativas tenha 4 posições vazias se não existir
        const alts = q.alternativas && q.alternativas.length === 4 ? q.alternativas : ['', '', '', ''];
        
        // Verifica qual letra é a correta baseada no texto da resposta
        let letraCorretaSelecionada = '';
        if (q.tipo === 'multipla') {
            if (q.resposta === alts[0]) letraCorretaSelecionada = 'A';
            else if (q.resposta === alts[1]) letraCorretaSelecionada = 'B';
            else if (q.resposta === alts[2]) letraCorretaSelecionada = 'C';
            else if (q.resposta === alts[3]) letraCorretaSelecionada = 'D';
        }

        card.innerHTML = `
            <button class="btn-remover" onclick="removerQuestao(${index})" title="Excluir Questão">Excluir 🗑️</button>
            <h3>Questão ${index + 1}</h3>
            
            <div class="form-group">
                <label>Tipo de Pergunta</label>
                <select class="q-tipo" onchange="toggleAlternativasEdicao(this)">
                    <option value="multipla" ${q.tipo === 'multipla' ? 'selected' : ''}>Múltipla Escolha</option>
                    <option value="dissertativa" ${q.tipo === 'dissertativa' ? 'selected' : ''}>Dissertativa (Texto livre)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Enunciado da Pergunta</label>
                <textarea class="q-enunciado" rows="3" required>${q.enunciado || ''}</textarea>
            </div>

            <div class="form-group">
                <label>URL da Imagem (Opcional)</label>
                <input type="text" class="q-imagem-url" placeholder="https://exemplo.com/imagem.png" value="${q.imagemUrl || ''}">
            </div>

            <div class="form-group">
                <label style="color: #00A8FF;">Ou Envie do Computador</label>
                <input type="file" class="q-imagem-file" accept="image/*" style="padding: 8px; background: rgba(0,0,0,0.2);" onchange="fazerUploadEdicao(this, ${index})">
                <span id="upload_status_${index}" style="font-size: 0.9rem; margin-top: 5px; display: none;"></span>
            </div>

            <div class="alternativas-box ${q.tipo === 'dissertativa' ? 'hidden' : ''}">
                <p style="margin-bottom: 10px; font-size: 0.9rem; color: #888;">Alternativas:</p>
                <div class="form-group"><input type="text" class="q-alt-a" placeholder="Alternativa A" value="${alts[0]}"></div>
                <div class="form-group"><input type="text" class="q-alt-b" placeholder="Alternativa B" value="${alts[1]}"></div>
                <div class="form-group"><input type="text" class="q-alt-c" placeholder="Alternativa C" value="${alts[2]}"></div>
                <div class="form-group"><input type="text" class="q-alt-d" placeholder="Alternativa D" value="${alts[3]}"></div>
            </div>

            <div class="form-group">
                <label>Resposta Correta</label>
                
                <select class="q-resp-multipla ${q.tipo === 'dissertativa' ? 'hidden' : ''}">
                    <option value="" disabled ${letraCorretaSelecionada === '' ? 'selected' : ''}>Selecione a letra correta</option>
                    <option value="A" ${letraCorretaSelecionada === 'A' ? 'selected' : ''}>Alternativa A</option>
                    <option value="B" ${letraCorretaSelecionada === 'B' ? 'selected' : ''}>Alternativa B</option>
                    <option value="C" ${letraCorretaSelecionada === 'C' ? 'selected' : ''}>Alternativa C</option>
                    <option value="D" ${letraCorretaSelecionada === 'D' ? 'selected' : ''}>Alternativa D</option>
                </select>
                
                <input type="text" class="q-resp-dissertativa ${q.tipo === 'multipla' ? 'hidden' : ''}" placeholder="Digite a resposta exata" value="${q.tipo === 'dissertativa' ? q.resposta : ''}">
            </div>
        `;

        container.appendChild(card);
    });
}

// Oculta/Mostra campos de múltipla escolha baseando-se no select de Tipo de Pergunta
function toggleAlternativasEdicao(selectElement) {
    const card = selectElement.closest('.questao-card');
    const tipo = selectElement.value;
    
    const boxAlt = card.querySelector('.alternativas-box');
    const selectMultipla = card.querySelector('.q-resp-multipla');
    const inputDissertativa = card.querySelector('.q-resp-dissertativa');

    if (tipo === 'dissertativa') {
        boxAlt.classList.add('hidden');
        selectMultipla.classList.add('hidden');
        inputDissertativa.classList.remove('hidden');
    } else {
        boxAlt.classList.remove('hidden');
        selectMultipla.classList.remove('hidden');
        inputDissertativa.classList.add('hidden');
    }
}

// Adiciona um card em branco ao final da lista
function adicionarQuestao() {
    faseAtualEditando.questoes.push({
        tipo: 'multipla',
        enunciado: '',
        imagemUrl: '',
        alternativas: ['', '', '', ''],
        resposta: ''
    });
    renderizarQuestoes();
}

// Remove a questão do array e re-renderiza a tela
function removerQuestao(index) {
    if(confirm('Tem certeza que deseja remover esta questão permanentemente?')) {
        faseAtualEditando.questoes.splice(index, 1);
        renderizarQuestoes();
    }
}

// Lê tudo que está na tela e constrói o objeto atualizado
function coletarDadosDoForm() {
    const cards = document.querySelectorAll('.questao-card');
    const novasQuestoes = [];

    cards.forEach(card => {
        const tipo = card.querySelector('.q-tipo').value;
        const enunciado = card.querySelector('.q-enunciado').value;
        const imagemUrl = card.querySelector('.q-imagem-url').value; // Pega o que estiver na URL
        let alternativas = [];
        let resposta = '';

        if (tipo === 'multipla') {
            const altA = card.querySelector('.q-alt-a').value;
            const altB = card.querySelector('.q-alt-b').value;
            const altC = card.querySelector('.q-alt-c').value;
            const altD = card.querySelector('.q-alt-d').value;
            alternativas = [altA, altB, altC, altD];

            const letraCorreta = card.querySelector('.q-resp-multipla').value;
            if(letraCorreta === 'A') resposta = altA;
            if(letraCorreta === 'B') resposta = altB;
            if(letraCorreta === 'C') resposta = altC;
            if(letraCorreta === 'D') resposta = altD;
        } else {
            resposta = card.querySelector('.q-resp-dissertativa').value;
        }

        novasQuestoes.push({
            tipo: tipo,
            enunciado: enunciado,
            imagemUrl: imagemUrl,
            alternativas: alternativas,
            resposta: resposta
        });
    });

    faseAtualEditando.questoes = novasQuestoes;
    faseAtualEditando.qtd = novasQuestoes.length;
}

// Salva o objeto no LocalStorage e Manda pro Servidor
function salvarEdicao() {
    coletarDadosDoForm();

    const modulo = document.getElementById('busca-modulo').value;
    const faseId = faseAtualEditando.fase;

    if(faseAtualEditando.questoes.length === 0) {
        alert("A fase precisa ter pelo menos 1 questão.");
        return;
    }

    // === 1. Salvar no LocalStorage ===
    const chaveLocal = `fases_${modulo}`;
    let fasesLocais = JSON.parse(localStorage.getItem(chaveLocal) || "[]");
    
    // Filtra removendo a antiga e adicionando a nova versão
    fasesLocais = fasesLocais.filter(f => f.fase !== faseId);
    fasesLocais.push(faseAtualEditando);
    
    // Reordena
    fasesLocais.sort((a, b) => a.fase - b.fase);
    localStorage.setItem(chaveLocal, JSON.stringify(fasesLocais));

    // === 2. Enviar pro Servidor Java ===
    fetch(`/api/fases/${modulo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faseAtualEditando)
    }).then(() => {
        alert(`Sucesso! A Fase ${faseId} foi atualizada com sucesso.`);
    }).catch(err => {
        alert("Alterações salvas localmente! (O servidor Java não respondeu).");
        console.error(err);
    });
}