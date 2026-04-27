const urlParams = new URLSearchParams(window.location.search);
const moduloAtual = urlParams.get('modulo');
const faseAtual = urlParams.get('fase');

// Variável para armazenar o ID real gerado pelo Banco de Dados para esta fase
let faseAtualDbId = null; 

let questoes = [];
let faseVideoUrl = '';
let indiceAtual = 0;
let errosCometidos = 0;
let acertosTotais = 0;
let streakAtual = 0;
let streakMaxima = 0;
let tempoInicio = Date.now();
let timerInterval;
let acertosPorMateria = {}; 

const mascotesAnimados = ['🦉', '🦊', '🐱', '🤖', '👽', '🐶', '🐯', '🐼', '🦖', '🐙', '🦄', '🧙‍♂️'];
let vidasJogador = 3;

let isFaseJaConcluida = false;
let desafioTimerInterval;
let tempoDesafioRestante;
let limiteDeTempoDoDesafio = 0;
let xpExtraGanhoNaFase = 0;
let totalDesafiosNaFase = 0;
let desafiosConcluidos = 0;
let tempoTotalGastoEmDesafios = 0;

const audioAcerto = new Audio('/audio/acerto.mp3');
const audioErro = new Audio('/audio/erro.mp3');

document.addEventListener('DOMContentLoaded', async () => {
    if (!moduloAtual || !faseAtual) {
        alert("Parâmetros inválidos!");
        window.location.href = '/';
        return;
    }

    document.getElementById('btn-iniciar-desafio').addEventListener('click', iniciarDesafioSurpresa);
    document.getElementById('btn-reiniciar-fase').addEventListener('click', () => { window.location.reload(); });

    const btnVoltarModulo = document.getElementById('btn-voltar-modulo');
    if (btnVoltarModulo) {
        btnVoltarModulo.addEventListener('click', () => {
            window.location.href = `/${moduloAtual}`;
        });
    }

    try {
        const [faseRes, progressoRes] = await Promise.all([
            fetch(`/api/fases/${moduloAtual}/${faseAtual}`),
            fetch('/api/progresso')
        ]);

        if (!faseRes.ok) throw new Error(`Fase não encontrada (Erro ${faseRes.status})`);

        const faseData = await faseRes.json();
        const progressoData = await progressoRes.json();

        faseAtualDbId = faseData.id;
        questoes = faseData.questoes || [];
        faseVideoUrl = faseData.videoAulaUrl || '';

        // CORREÇÃO: Cria a chave exata que o Backend usa, para não chocar com outros módulos
        const chaveUnica = `${moduloAtual}_fase${faseAtual}_id${faseAtualDbId}`;

        // Verifica o progresso da chave única desta fase exata (ou fallback pro modelo antigo)
        if (progressoData[chaveUnica] === 'completed' || progressoData[`${moduloAtual}-${faseAtual}`] === 'completed') {
            isFaseJaConcluida = true;
        }

        if (questoes.length === 0) {
            alert("Esta fase ainda não possui questões cadastradas. Por favor, adicione questões no painel de administração.");
            window.location.href = `/${moduloAtual}`; 
            return;
        }

        atualizarUIdeVidas();
        iniciarTimerGeral();
        carregarQuestao();
    } catch (error) {
        console.error("ERRO DETALHADO AO CARREGAR A FASE:", error);
        alert("Erro ao carregar a fase! Prima F12 e verifique a aba 'Console' para ver o motivo.");
    }
});

function atualizarUIdeVidas() {
    const hearts = document.querySelectorAll('#lives-container .heart');
    hearts.forEach((heart, index) => {
        if (index < vidasJogador) {
            heart.classList.add('active');
        } else {
            heart.classList.remove('active');
        }
    });
}

function formatarTempo(segs) {
    const m = Math.floor(segs / 60).toString().padStart(2, '0');
    const s = (segs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function iniciarTimerGeral() {
    timerInterval = setInterval(() => {
        const segundosPassados = Math.floor((Date.now() - tempoInicio) / 1000);
        document.getElementById('timer-text').textContent = formatarTempo(segundosPassados);
    }, 1000);
}

function carregarQuestao() {
    clearInterval(desafioTimerInterval);

    const q = questoes[indiceAtual];

    const feedback = document.getElementById('feedback-msg');
    feedback.className = 'feedback';
    feedback.textContent = '';

    const btnVerificar = document.getElementById('btn-verificar');
    btnVerificar.style.display = 'block';
    btnVerificar.textContent = "Verificar";
    btnVerificar.onclick = verificarResposta;
    btnVerificar.style.background = 'var(--cor-primaria)';
    btnVerificar.disabled = false;

    if (q.desafio && !q.desafioFalho) {
        if (!q.visto) {
            totalDesafiosNaFase++;
            q.visto = true;
        }

        limiteDeTempoDoDesafio = q.tempoDesafio || 30;

        if (isFaseJaConcluida) {
            document.getElementById('modal-pre-desafio-desc').innerHTML = "Complete esta questão mais difícil dentro do tempo limite.<br><br><span style='color:#FF4B4B; font-weight:bold;'>Como já completou esta fase anteriormente, não receberá XP extra neste desafio.</span>";
        } else {
            document.getElementById('modal-pre-desafio-desc').textContent = "Complete esta questão mais difícil dentro do tempo limite para ganhar XP extra. Se falhar, você perderá uma vida e a recompensa!";
        }

        document.getElementById('modal-pre-desafio').classList.add('active');
        document.getElementById('area-pergunta-principal').style.display = 'none';
        document.querySelector('.bottom-bar').style.display = 'none';
        document.getElementById('challenge-bar').style.display = 'none';
    } else {
        const modal = document.getElementById('modal-pre-desafio');
        if (modal) modal.classList.remove('active');

        const areaPergunta = document.getElementById('area-pergunta-principal');
        if (areaPergunta) {
            areaPergunta.style.display = 'flex';
            areaPergunta.classList.remove('desafio-mode');
        }

        const bottomBar = document.querySelector('.bottom-bar');
        if (bottomBar) bottomBar.style.display = 'flex';

        const challengeBar = document.getElementById('challenge-bar');
        if (challengeBar) challengeBar.style.display = 'none';

        montarDOMDaQuestao(q);
    }
}

function iniciarDesafioSurpresa() {
    const q = questoes[indiceAtual];

    document.getElementById('modal-pre-desafio').classList.remove('active');
    document.getElementById('area-pergunta-principal').style.display = 'flex';
    document.querySelector('.bottom-bar').style.display = 'flex';

    montarDOMDaQuestao(q);

    const challengeBar = document.getElementById('challenge-bar');
    const questionArea = document.getElementById('area-pergunta-principal');

    tempoDesafioRestante = limiteDeTempoDoDesafio;

    challengeBar.style.display = 'flex';
    questionArea.classList.add('desafio-mode');

    const xpAmostrar = isFaseJaConcluida ? 0 : (q.xpExtra || 50);

    document.getElementById('challenge-time-text').textContent = tempoDesafioRestante + "s";
    document.getElementById('challenge-xp-text').textContent = `+${xpAmostrar} XP`;

    desafioTimerInterval = setInterval(() => {
        tempoDesafioRestante--;
        document.getElementById('challenge-time-text').textContent = tempoDesafioRestante + "s";

        if (tempoDesafioRestante <= 0) {
            clearInterval(desafioTimerInterval);
            falharDesafioPorTempo();
        }
    }, 1000);
}

function montarDOMDaQuestao(q) {
    document.getElementById('titulo-pergunta').textContent = q.enunciado;
    
    const mascoteSorteado = mascotesAnimados[Math.floor(Math.random() * mascotesAnimados.length)];
    document.getElementById('mascote-atual').textContent = mascoteSorteado;

    const imgElem = document.getElementById('imagem-pergunta');
    if (q.imagemUrl && q.imagemUrl.trim() !== '') {
        let caminhoImagem = q.imagemUrl.trim()
            .replace(/['"]/g, '')      
            .replace(/%22/g, '')      
            .replace(/%7[dD]/g, '')    
            .replace(/}/g, '')         
            .replace(/\/uploads\//g, ''); 

        imgElem.src = `/uploads/${caminhoImagem}`;
        imgElem.style.display = 'block';
        imgElem.style.margin = '0 auto 20px auto';
        imgElem.style.maxWidth = '100%';
        imgElem.style.borderRadius = '10px';
    } else {
        imgElem.style.display = 'none';
        imgElem.src = '';
    }

    const area = document.getElementById('area-resposta');
    area.innerHTML = '';

    if (q.tipo === 'multipla') {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        ['A', 'B', 'C', 'D'].forEach(letra => {
            if (q[`alternativa${letra}`]) {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = q[`alternativa${letra}`];
                
                btn.dataset.letra = letra;

                btn.onclick = () => {
                    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
                grid.appendChild(btn);
            }
        });
        area.appendChild(grid);
    } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'resposta-dissertativa';
        input.className = 'input-dissertativa';
        input.placeholder = 'Digite a sua resposta...';
        area.appendChild(input);
    }

    const progresso = (indiceAtual / questoes.length) * 100;
    document.querySelector('.progress-bar').style.width = `${progresso}%`;
}

function falharDesafioPorTempo() {
    const sfxEnabled = localStorage.getItem('sfxEnabled') !== 'off';
    if (sfxEnabled) audioErro.play();

    tempoTotalGastoEmDesafios += limiteDeTempoDoDesafio;
    errosCometidos++;
    streakAtual = 0;
    vidasJogador--;
    atualizarUIdeVidas();
    document.getElementById('streak-text').textContent = streakAtual;

    const q = questoes[indiceAtual];
    q.desafioFalho = true;

    const feedback = document.getElementById('feedback-msg');

    if (vidasJogador <= 0) {
        feedback.textContent = `⏰ Tempo Esgotado!`;
        feedback.className = 'feedback incorrect show';
        document.getElementById('btn-verificar').style.display = 'none';
        setTimeout(() => { document.getElementById('modal-game-over').classList.add('active'); }, 1500);
        return;
    }

    feedback.textContent = `⏰ Tempo Esgotado! A recompensa extra foi perdida. Tente novamente!`;
    feedback.className = 'feedback incorrect show';

    const btnVerificar = document.getElementById('btn-verificar');
    btnVerificar.style.background = '#F44336';
    btnVerificar.textContent = "Tentar Novamente";
    btnVerificar.onclick = () => { carregarQuestao(); };

    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    const inputD = document.getElementById('resposta-dissertativa');
    if (inputD) inputD.disabled = true;
}

function verificarResposta() {
    clearInterval(desafioTimerInterval);

    const q = questoes[indiceAtual];
    let respostaUsuario = null;

    if (q.tipo === 'multipla') {
        const selecionada = document.querySelector('.option-btn.selected');
        if (!selecionada) return alert('Selecione uma alternativa!');
        respostaUsuario = selecionada.dataset.letra;
    } else {
        const input = document.getElementById('resposta-dissertativa');
        if (!input.value.trim()) return alert('Digite a sua resposta!');
        respostaUsuario = input.value.trim().toLowerCase();
    }

    const correta = (q.respostaCorreta || "").toLowerCase();
    const isCerto = (respostaUsuario && respostaUsuario.toLowerCase() === correta);

    const feedback = document.getElementById('feedback-msg');
    const btnVerificar = document.getElementById('btn-verificar');
    const sfxEnabled = localStorage.getItem('sfxEnabled') !== 'off';

    document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        const letraBotao = b.dataset.letra;
        
        if (!isCerto && letraBotao && letraBotao.toLowerCase() === correta) {
            b.style.borderColor = "#58CC02";
            b.style.boxShadow = "0 0 15px rgba(88, 204, 2, 0.5)";
            b.style.color = "#58CC02";
            b.innerHTML += " ✔️";
        }
    });

    const inputD = document.getElementById('resposta-dissertativa');
    if (inputD) inputD.disabled = true;

    if (isCerto) {
        if (sfxEnabled) audioAcerto.play();

        const mat = q.modulo || moduloAtual;
        acertosPorMateria[mat] = (acertosPorMateria[mat] || 0) + 1;

        if (q.desafio && !q.desafioFalho) {
            desafiosConcluidos++;
            tempoTotalGastoEmDesafios += (limiteDeTempoDoDesafio - tempoDesafioRestante);

            if (!isFaseJaConcluida) {
                feedback.textContent = `🎉 Desafio Vencido! +${q.xpExtra} XP Garantido!`;
            } else {
                feedback.textContent = `🎉 Desafio Vencido! (Fase já concluída, sem XP extra)`;
            }
        } else {
            feedback.textContent = '🎉 Correto! Muito bem!';
        }

        feedback.className = 'feedback correct show';
        btnVerificar.style.background = '#4CAF50';
        
        acertosTotais++;
        streakAtual++;
        if (streakAtual > streakMaxima) streakMaxima = streakAtual;
        document.getElementById('streak-text').textContent = streakAtual;

        btnVerificar.textContent = "Continuar";
        btnVerificar.onclick = () => {
            indiceAtual++;
            if (indiceAtual >= questoes.length) finalizarFase();
            else carregarQuestao();
        };

    } else {
        if (sfxEnabled) audioErro.play();

        if (q.desafio && !q.desafioFalho) {
            tempoTotalGastoEmDesafios += (limiteDeTempoDoDesafio - tempoDesafioRestante);
            q.desafioFalho = true;
        }

        feedback.textContent = `❌ Incorreto! A resposta correta está destacada em verde. Você perdeu uma vida.`;
        feedback.className = 'feedback incorrect show';

        errosCometidos++;
        streakAtual = 0;
        vidasJogador--;
        atualizarUIdeVidas();
        document.getElementById('streak-text').textContent = streakAtual;

        if (vidasJogador <= 0) {
            btnVerificar.style.display = 'none';
            setTimeout(() => { document.getElementById('modal-game-over').classList.add('active'); }, 2000);
            return;
        }

        btnVerificar.style.background = '#F44336';
        btnVerificar.textContent = "Tentar Novamente";
        btnVerificar.onclick = () => { carregarQuestao(); };
    }
}

function getEmbedUrl(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
}

function finalizarFase() {
    clearInterval(timerInterval);
    document.querySelector('.progress-bar').style.width = `100%`;
    document.getElementById('area-pergunta-principal').style.display = 'none';
    document.getElementById('challenge-bar').style.display = 'none';
    document.querySelector('.bottom-bar').style.display = 'none';
    document.getElementById('feedback-msg').style.display = 'none';

    document.getElementById('resumo-acertos').textContent = acertosTotais;
    document.getElementById('resumo-vidas').textContent = `${vidasJogador} ❤️`;
    document.getElementById('resumo-streak').textContent = `${streakMaxima} 🔥`;

    if (totalDesafiosNaFase > 0) {
        let statusText = desafiosConcluidos === totalDesafiosNaFase ? 'Concluído ✅' : (desafiosConcluidos > 0 ? `${desafiosConcluidos}/${totalDesafiosNaFase} Concluídos ⚠️` : 'Falhou ❌');
        let statusColor = desafiosConcluidos === totalDesafiosNaFase ? '#58CC02' : (desafiosConcluidos > 0 ? '#f39c12' : '#FF4B4B');

        const statusSpan = document.getElementById('resumo-desafio-status');
        statusSpan.textContent = statusText;
        statusSpan.style.color = statusColor;
        statusSpan.style.fontWeight = 'bold';
    } else {
        document.getElementById('resumo-desafio-status').textContent = 'Nenhum';
        document.getElementById('resumo-desafio-status').style.color = '#aaa';
    }

    const segundosTotais = Math.floor((Date.now() - tempoInicio) / 1000);
    document.getElementById('resumo-tempo').textContent = formatarTempo(segundosTotais);

    const videoCard = document.getElementById('video-card');
    const iframe = document.getElementById('video-iframe');

    if (faseVideoUrl && faseVideoUrl.trim() !== '') {
        const embedUrl = getEmbedUrl(faseVideoUrl);
        iframe.src = embedUrl;
        videoCard.style.display = 'flex';
    } else {
        videoCard.style.display = 'none';
    }

    if (moduloAtual.includes('simulado') && Object.keys(acertosPorMateria).length > 0) {
        let feedbackHTML = "<div style='text-align: left; margin-top: 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px;'>";
        feedbackHTML += "<h4 style='color: var(--cor-xp); margin-bottom: 10px;'>Análise Detalhada:</h4>";
        for (let materia in acertosPorMateria) {
            feedbackHTML += `<p style='font-size: 0.9rem; margin-bottom: 5px;'>✅ ${materia.toUpperCase().replace('SIMULADO_', '')}: ${acertosPorMateria[materia]} acerto(s)</p>`;
        }
        feedbackHTML += "</div>";
        document.querySelector('.summary-card').insertAdjacentHTML('beforeend', feedbackHTML);
    }

    // CORREÇÃO: Envia o progresso com a chave robusta do BD
    const chaveUnicaParaSalvar = `${moduloAtual}_fase${faseAtual}_id${faseAtualDbId}`;

    fetch(`/api/progresso/${chaveUnicaParaSalvar}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            modulo: moduloAtual,
            fase: parseInt(faseAtual),
            acertos: acertosTotais,
            erros: errosCometidos,
            maxStreak: streakMaxima,
            tempoSegundos: segundosTotais,
            totalQuestoes: questoes.length,
            desafiosVencidosNestaFase: desafiosConcluidos,
            acertosPorMateria: acertosPorMateria
        })
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById('resumo-xp-extra').textContent = `+${data.xpGanho || 0} XP Total`;
            document.getElementById('tela-resumo').classList.add('active');

            if (data.badgesNovos && data.badgesNovos.length > 0) {
                alert(`🏆 Parabéns! Você desbloqueou uma nova conquista! Vá ao seu perfil para conferir.`);
            }
        })
        .catch(err => {
            console.error("Erro de conexão ao salvar progresso:", err);
            document.getElementById('tela-resumo').classList.add('active');
        });
}