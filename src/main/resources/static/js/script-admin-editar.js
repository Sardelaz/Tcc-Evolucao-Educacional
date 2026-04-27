let faseAtualId = null;
let questoesEdicao = [];

async function buscarFase() {
    const modulo = document.getElementById('busca-modulo').value;
    const fase = document.getElementById('busca-fase').value;
    const btn = document.getElementById('btn-buscar');
    btn.textContent = "A procurar...";

    try {
        const response = await fetch(`/api/fases/${modulo}/${fase}`);
        if (response.ok) {
            const data = await response.json();
            faseAtualId = data.id;
            
            // Limpeza automática do Banco de Dados para remover os JSONs corrompidos nas imagens antigas
            questoesEdicao = data.questoes.map(q => {
                if (q.imagemUrl && typeof q.imagemUrl === 'string' && q.imagemUrl.includes('{"url"')) {
                    try { q.imagemUrl = JSON.parse(q.imagemUrl).url; } catch(e) {}
                }
                // Garante que o boolean do desafio corresponda à variável exata do Spring Boot
                if (q.desafio !== undefined && q.isDesafio === undefined) {
                    q.isDesafio = q.desafio; 
                }
                return q;
            });

            // Carrega a URL da videoaula
            document.getElementById('edit_video_aula_url').value = data.videoAulaUrl || '';

            renderizarQuestoes();
            document.getElementById('editor-area').classList.remove('hidden');
            document.getElementById('fase-title').textContent = `Editando: ${modulo.toUpperCase()} - Fase ${fase}`;
        } else {
            alert("Fase não encontrada no banco de dados.");
            document.getElementById('editor-area').classList.add('hidden');
        }
    } catch (error) {
        console.error("Erro ao buscar fase:", error);
        alert("Erro de conexão.");
    }
    btn.textContent = "Carregar Dados da Fase";
}

function renderizarQuestoes() {
    const container = document.getElementById('questoes-container');
    container.innerHTML = '';

    questoesEdicao.forEach((q, index) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'questao-editor-box';

        // Lógica para a Resposta Correta
        const respC = (q.respostaCorreta || 'A').toUpperCase();
        let campoResposta = '';
        if (q.tipo === 'multipla') {
            campoResposta = `
                <select onchange="atualizarQuestao(${index}, 'respostaCorreta', this.value)">
                    <option value="A" ${respC === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${respC === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${respC === 'C' ? 'selected' : ''}>C</option>
                    <option value="D" ${respC === 'D' ? 'selected' : ''}>D</option>
                </select>`;
        } else {
            campoResposta = `<input type="text" value="${q.respostaCorreta || ''}" onchange="atualizarQuestao(${index}, 'respostaCorreta', this.value)" placeholder="Resposta exata">`;
        }

        // Renderização das Alternativas
        const areaAlternativas = q.tipo === 'multipla' ? `
            <div class="form-group">
                <label>Alternativas</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <input type="text" placeholder="Alternativa A" value="${q.alternativaA || ''}" onchange="atualizarQuestao(${index}, 'alternativaA', this.value)">
                    <input type="text" placeholder="Alternativa B" value="${q.alternativaB || ''}" onchange="atualizarQuestao(${index}, 'alternativaB', this.value)">
                    <input type="text" placeholder="Alternativa C" value="${q.alternativaC || ''}" onchange="atualizarQuestao(${index}, 'alternativaC', this.value)">
                    <input type="text" placeholder="Alternativa D" value="${q.alternativaD || ''}" onchange="atualizarQuestao(${index}, 'alternativaD', this.value)">
                </div>
            </div>` : '';

        // Gestão Segura de Imagem
        const imgSrc = q.imagemUrl ? q.imagemUrl : '';
        const imgDisplay = q.imagemUrl ? 'block' : 'none';
        
        const areaImagem = `
            <div class="form-group">
                <label>Imagem da Questão</label>
                <div style="display: flex; align-items: center; gap: 15px; margin-top: 5px;">
                    <img src="${imgSrc}" style="display: ${imgDisplay}; width: 80px; height: 60px; object-fit: cover; border-radius: 5px; border: 1px solid #444;" id="preview-${index}">
                    <div style="flex: 1;">
                        <input type="text" placeholder="URL da Imagem (Ex: /uploads/img.png)" value="${q.imagemUrl || ''}" onchange="atualizarQuestao(${index}, 'imagemUrl', this.value)" style="margin-bottom: 5px;">
                        <input type="file" onchange="fazerUploadEdicao(${index}, this)" style="font-size: 0.8rem;">
                    </div>
                </div>
                <small id="status-upload-${index}" style="display: none; margin-top: 5px;"></small>
            </div>`;

        // Previne NaN para não disparar 400 Bad Request
        const desafioBox = `
        <div style="background: rgba(255, 215, 0, 0.1); padding: 10px; border-radius: 8px; margin-top:15px; border: 1px solid rgba(255,215,0,0.3);">
            <label style="color: #FFD700; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" ${q.isDesafio ? 'checked' : ''} onchange="atualizarQuestao(${index}, 'isDesafio', this.checked); renderizarQuestoes();"> 
                É um Desafio contra o Tempo?
            </label>
            ${q.isDesafio ? `
            <div style="display: flex; gap: 10px; margin-top:10px;">
                <div style="flex: 1;">
                    <label style="font-size: 0.8rem; color:#aaa;">Segundos</label>
                    <input type="number" value="${q.tempoDesafio || 30}" onchange="atualizarQuestao(${index}, 'tempoDesafio', parseInt(this.value) || 30)">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.8rem; color:#aaa;">XP Extra</label>
                    <input type="number" value="${q.xpExtra || 50}" onchange="atualizarQuestao(${index}, 'xpExtra', parseInt(this.value) || 50)">
                </div>
            </div>` : ''}
        </div>`;

        qDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: var(--cor-xp);">Questão ${index + 1}</h4>
            </div>

            <div class="form-group">
                <label>Tipo de Questão</label>
                <select onchange="atualizarQuestao(${index}, 'tipo', this.value); renderizarQuestoes();">
                    <option value="multipla" ${q.tipo === 'multipla' ? 'selected' : ''}>Múltipla Escolha</option>
                    <option value="dissertativa" ${q.tipo === 'dissertativa' ? 'selected' : ''}>Dissertativa</option>
                </select>
            </div>

            <div class="form-group">
                <label>Enunciado</label>
                <textarea onchange="atualizarQuestao(${index}, 'enunciado', this.value)" rows="2">${q.enunciado || ''}</textarea>
            </div>

            ${areaImagem}
            ${areaAlternativas}

            <div class="form-group">
                <label>Resposta Correta</label>
                ${campoResposta}
            </div>

            ${desafioBox}

            <div style="margin-top: 20px; text-align: right; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                <button type="button" onclick="removerQuestao(${index})" style="background-color: #f44336; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s;">🗑️ Excluir esta Questão</button>
            </div>
        `;
        container.appendChild(qDiv);
    });
}

function atualizarQuestao(index, campo, valor) {
    questoesEdicao[index][campo] = valor;
}

async function fazerUploadEdicao(index, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    const statusSpan = document.getElementById(`status-upload-${index}`);
    statusSpan.style.display = 'block';
    statusSpan.style.color = '#fff';
    statusSpan.textContent = 'Enviando...';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            questoesEdicao[index].imagemUrl = data.url;
            statusSpan.style.color = '#4CAF50';
            statusSpan.textContent = 'Upload concluído!';
            
            const previewImg = document.getElementById(`preview-${index}`);
            previewImg.src = data.url;
            previewImg.style.display = 'block';
        } else {
            throw new Error('Falha no upload');
        }
    } catch (error) {
        statusSpan.style.color = '#F44336';
        statusSpan.textContent = 'Erro ao enviar imagem.';
    }
}

function removerQuestao(index) {
    if (confirm("Tem a certeza que deseja excluir esta questão específica?")) {
        questoesEdicao.splice(index, 1);
        renderizarQuestoes();
    }
}

function adicionarQuestao() {
    questoesEdicao.push({
        tipo: 'multipla',
        enunciado: 'Nova Questão',
        imagemUrl: '',
        alternativaA: '', alternativaB: '', alternativaC: '', alternativaD: '',
        respostaCorreta: 'A',
        isDesafio: false,
        tempoDesafio: 30,
        xpExtra: 50
    });
    renderizarQuestoes();
}

async function salvarEdicao() {
    if (!faseAtualId) return;

    if (questoesEdicao.length === 0) {
        alert("A fase precisa ter pelo menos 1 questão antes de salvar.");
        return;
    }

    const faseNum = parseInt(document.getElementById('busca-fase').value);
    if (!faseNum) {
        alert("Número da fase inválido.");
        return;
    }

    // CORREÇÃO CRÍTICA: Limpamos os IDs da fase e das questões antes de enviar.
    // Como o backend deleta a fase antiga e cria uma nova (para gerar um ID novo e resetar o progresso),
    // enviar IDs antigos faz o Hibernate dar erro de "Detached Entity" e bloquear a exclusão de questões!
    const questoesLimpas = questoesEdicao.map(q => {
        const novaQ = { ...q };
        delete novaQ.id; // Remove o ID da questão para forçar criação de uma limpa
        return novaQ;
    });

    const payload = {
        modulo: document.getElementById('busca-modulo').value,
        fase: faseNum,
        qtd: questoesLimpas.length,
        videoAulaUrl: document.getElementById('edit_video_aula_url').value,
        questoes: questoesLimpas
    };

    try {
        const response = await fetch(`/api/fases/${payload.modulo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Alterações salvas com sucesso!');
        } else {
            const errText = await response.text();
            console.error("Erro do backend:", errText);
            alert(`Erro ${response.status} ao salvar! Verifique se os campos estão preenchidos.`);
        }
    } catch (error) {
        alert('Erro de conexão ao salvar.');
    }
}

async function excluirFase() {
    const modulo = document.getElementById('busca-modulo').value;
    const faseNum = document.getElementById('busca-fase').value;

    if (!modulo || !faseNum) {
        alert("Selecione uma fase válida para excluir.");
        return;
    }

    if (!confirm(`TEM CERTEZA QUE DESEJA EXCLUIR DEFINITIVAMENTE A FASE ${faseNum} DO MÓDULO ${modulo.toUpperCase()}? Esta ação é irreversível e excluirá todas as questões.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/fases/${modulo}/${faseNum}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert("Fase excluída com sucesso do sistema!");
            window.location.reload(); 
        } else {
            const errorText = await response.text();
            alert("Erro ao excluir fase: " + errorText);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão ao tentar excluir a fase.");
    }
}