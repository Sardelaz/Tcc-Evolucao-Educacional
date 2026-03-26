const params = new URLSearchParams(window.location.search);
const modulo = params.get('modulo');
const fase = parseInt(params.get('fase'));
if (modulo) document.getElementById('btn-voltar').href = `/${modulo}`;

let faseAtual;
let questaoIndex = 0;
let respostaCorreta = "";
let respostaUsuario = "";

let startTime = Date.now();
let timerInterval;
let acertosCount = 0;
let errosCount = 0;
let jaErrouAtual = false;

let currentStreak = 0;
let maxStreak = 0;
let isFasePerfeita = false;

function atualizarCronometro() {
    const agora = Date.now();
    const diferenca = Math.floor((agora - startTime) / 1000);
    const minutos = String(Math.floor(diferenca / 60)).padStart(2, '0');
    const segundos = String(diferenca % 60).padStart(2, '0');
    document.getElementById('timer-text').textContent = `${minutos}:${segundos}`;
}

async function iniciarAula() {
    try {
        const perfil = await fetch('/api/perfil').then(res => res.json());
        if (perfil.fasesPerfeitas && perfil.fasesPerfeitas.includes(`mat-${fase}`)) {
            isFasePerfeita = true;
        }

        const resposta = await fetch(`/api/fases/${modulo}`);
        const fasesDoModulo = await resposta.json();
        faseAtual = fasesDoModulo.find(f => f.fase === fase);

        if (!faseAtual || !faseAtual.questoes || faseAtual.questoes.length === 0) {
            document.getElementById('titulo-pergunta').textContent = "Erro: Fase não encontrada no Servidor Java.";
            document.getElementById('btn-verificar').style.display = 'none';
        } else {
            timerInterval = setInterval(atualizarCronometro, 1000);
            carregarQuestao();
        }
    } catch (error) {
        document.getElementById('titulo-pergunta').textContent = "Erro de conexão com o servidor Java.";
        document.getElementById('btn-verificar').style.display = 'none';
    }
}
iniciarAula();

function carregarQuestao() {
    jaErrouAtual = false;
    const questao = faseAtual.questoes[questaoIndex];
    document.getElementById('titulo-pergunta').textContent = questao.enunciado;
    respostaCorreta = questao.resposta;
    respostaUsuario = "";

    // LÓGICA DA IMAGEM
    const imgElement = document.getElementById('imagem-pergunta');
    if (questao.imagemUrl && questao.imagemUrl.trim() !== '') {
        imgElement.src = questao.imagemUrl;
        imgElement.style.display = 'block';
    } else {
        imgElement.src = '';
        imgElement.style.display = 'none';
    }

    const barraProgress = (questaoIndex / faseAtual.questoes.length) * 100;
    document.querySelector('.progress-bar').style.width = barraProgress + '%';

    const areaResposta = document.getElementById('area-resposta');

    if (questao.tipo === 'multipla') {
        let botoesHTML = '<div class="options-grid">';
        const letras = ['A', 'B', 'C', 'D'];
        questao.alternativas.forEach((alt, index) => {
            if (alt.trim() !== "") {
                botoesHTML += `<button class="option-btn" onclick="selectOption(this, '${alt}')">${letras[index]}) ${alt}</button>`;
            }
        });
        botoesHTML += '</div>';
        areaResposta.innerHTML = botoesHTML;
    } else {
        areaResposta.innerHTML = '<input type="text" id="input-dissertativa" class="dissertativa-input" placeholder="Digite a sua resposta aqui...">';
    }
}

function selectOption(clickedBtn, texto) {
    let buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    clickedBtn.classList.add('selected');
    respostaUsuario = texto;
}

function verificarResposta() {
    const questao = faseAtual.questoes[questaoIndex];
    if (questao.tipo === 'dissertativa') {
        respostaUsuario = document.getElementById('input-dissertativa').value;
    }

    const feedback = document.getElementById('feedback-msg');
    const btn = document.getElementById('btn-verificar');

    if (respostaUsuario.trim() === "") {
        alert("Por favor, selecione ou digite uma resposta!");
        return;
    }

    feedback.style.display = '';

    if (respostaUsuario.trim().toLowerCase() === respostaCorreta.trim().toLowerCase()) {

        // SOM DE ACERTO
        new Audio('/audio/acerto.mp3').play().catch(e => console.log(e));

        let ganhouXpNaQuestao = false;

        if (!jaErrouAtual) {
            acertosCount++;
            currentStreak++;
            if (currentStreak > maxStreak) { maxStreak = currentStreak; }
            if (!isFasePerfeita) { ganhouXpNaQuestao = true; }

            const streakText = document.getElementById('streak-text');
            const streakContainer = document.getElementById('streak-container');
            streakText.textContent = currentStreak;

            streakContainer.classList.remove('pop-anim');
            void streakContainer.offsetWidth;
            streakContainer.classList.add('pop-anim');
        }

        feedback.className = "feedback success";
        let xpVisialHTML = ganhouXpNaQuestao ? `<span class="floating-xp">+10 XP</span>` : ``;
        feedback.innerHTML = `<span>Acertou em cheio! Parabéns!</span> ${xpVisialHTML}`;

        const barraProgressCompleto = ((questaoIndex + 1) / faseAtual.questoes.length) * 100;
        document.querySelector('.progress-bar').style.width = barraProgressCompleto + '%';

        if (questaoIndex < faseAtual.questoes.length - 1) {
            btn.textContent = "Próxima Pergunta";
            btn.onclick = () => {
                questaoIndex++;
                feedback.className = "feedback";
                btn.textContent = "Verificar";
                btn.onclick = verificarResposta;
                carregarQuestao();
            };
        } else {
            btn.textContent = "Ver Resultados";
            btn.onclick = () => {
                clearInterval(timerInterval);
                mostrarResultados();
            };
        }
    } else {

        // SOM DE ERRO
        new Audio('/audio/erro.mp3').play().catch(e => console.log(e));

        if (!jaErrouAtual) {
            errosCount++;
            jaErrouAtual = true;
        }

        currentStreak = 0;
        document.getElementById('streak-text').textContent = currentStreak;

        feedback.className = "feedback error";
        feedback.innerHTML = `<span>Resposta incorreta. Tente novamente!</span>`;
        btn.textContent = "Tentar Novamente";

        btn.onclick = () => {
            feedback.className = "feedback";
            btn.textContent = "Verificar";
            btn.onclick = verificarResposta;
            respostaUsuario = "";
            if (questao.tipo === 'dissertativa') {
                document.getElementById('input-dissertativa').value = '';
                document.getElementById('input-dissertativa').focus();
            } else {
                let buttons = document.querySelectorAll('.option-btn');
                buttons.forEach(b => b.classList.remove('selected'));
            }
        };
    }
}

function mostrarResultados() {
    document.getElementById('area-pergunta-principal').style.display = 'none';
    document.getElementById('feedback-msg').style.display = 'none';
    document.getElementById('tela-resumo').style.display = 'flex';

    document.getElementById('resumo-acertos').textContent = acertosCount;
    document.getElementById('resumo-erros').textContent = errosCount;
    document.getElementById('resumo-streak').textContent = maxStreak + " 🔥";
    document.getElementById('resumo-tempo').textContent = document.getElementById('timer-text').textContent;

    const btn = document.getElementById('btn-verificar');
    btn.textContent = "Carregando Recompensas...";
    btn.disabled = true;

    const dadosDesempenho = {
        acertos: acertosCount,
        maxStreak: maxStreak,
        totalQuestoes: faseAtual.questoes.length
    };

    fetch(`/api/progresso/mat-${fase}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDesempenho)
    })
        .then(resposta => resposta.json())
        .then(resultado => {
            const telaResumo = document.querySelector('.summary-card');
            const xpRow = document.createElement('div');
            xpRow.className = 'stat-row';

            if (resultado.xpGanho > 0) {
                xpRow.style.color = '#1cb0f6';
                xpRow.innerHTML = `<span class="stat-label">✨ Experiência Ganha</span><span class="stat-value">+${resultado.xpGanho} XP</span>`;
            } else {
                xpRow.style.color = '#888';
                xpRow.innerHTML = `<span class="stat-label">🎯 Fase já Gabaritada</span><span class="stat-value">0 XP</span>`;
            }

            xpRow.style.borderTop = '2px dashed rgba(255,255,255,0.2)';
            xpRow.style.marginTop = '15px';
            telaResumo.insertBefore(xpRow, telaResumo.lastElementChild);

            btn.textContent = "Concluir Fase";
            btn.disabled = false;
            btn.onclick = () => window.location.href = `/${modulo}`;
        })
        .catch(error => {
            window.location.href = `/${modulo}`;
        });
}