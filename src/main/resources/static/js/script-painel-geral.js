document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. BASE DE DADOS SIMULADA (Alunos e Geral)
    // ==========================================
    
    const alunosData = [
        {
            id: "geral",
            nome: "Visão Geral (Todos)",
            nivel: "Turma Completa",
            avatar: "🌍",
            dadosGrafico: {
                labels: ['Razão e Proporção', 'Estatística', 'Probabilidade', 'Aritmética', 'Geometria'],
                taxaErros: [65, 45, 80, 30, 55] 
            },
            questoesMaisErradas: [
                { modulo: 'Probabilidade - Fase 2', enunciado: 'Se jogarmos dois dados perfeitos, qual a probabilidade de a soma ser 7?', valor: 142, tipo: 'erros' },
                { modulo: 'Razão e Proporção - Fase 3', enunciado: 'Uma escala de 1:50000 significa que 2cm no mapa representam quantos km na realidade?', valor: 115, tipo: 'erros' },
                { modulo: 'Geometria - Fase 1', enunciado: 'Qual a área de um trapézio com bases 10 e 6, e altura 4?', valor: 98, tipo: 'erros' }
            ],
            fasesPerfeitas: [
                { modulo: 'Aritmética', fase: 1, valor: 45 },
                { modulo: 'Estatística', fase: 1, valor: 38 },
                { modulo: 'Razão e Proporção', fase: 1, valor: 32 }
            ]
        },
        {
            id: "aluno_1",
            nome: "João Augusto Sardela",
            nivel: "Nível 5",
            avatar: "👨‍🎓",
            progressoModulos: [
                { nome: 'Razão e Proporção', faseAtual: 4, totalFases: 5, cor: '#00A8FF' },
                { nome: 'Estatística', faseAtual: 2, totalFases: 4, cor: '#9C27B0' },
                { nome: 'Probabilidade', faseAtual: 1, totalFases: 5, cor: '#00BCD4' },
                { nome: 'Aritmética', faseAtual: 6, totalFases: 6, cor: '#FFD700' }
            ],
            dadosGrafico: {
                labels: ['Razão e Proporção', 'Estatística', 'Probabilidade', 'Aritmética', 'Geometria'],
                taxaErros: [20, 10, 85, 5, 40] 
            },
            questoesMaisErradas: [
                { modulo: 'Probabilidade - Fase 2', enunciado: 'Se jogarmos dois dados perfeitos, qual a probabilidade de a soma ser 7?', valor: 4, tipo: 'erros' },
                { modulo: 'Geometria - Fase 2', enunciado: 'Qual o volume de um cilindro de raio 2 e altura 5?', valor: 3, tipo: 'erros' }
            ],
            fasesPerfeitas: [
                { modulo: 'Aritmética', fase: 1 },
                { modulo: 'Estatística', fase: 1 },
                { modulo: 'Razão e Proporção', fase: 1 }
            ]
        },
        {
            id: "aluno_2",
            nome: "Maria Oliveira",
            nivel: "Nível 3",
            avatar: "👩‍🎓",
            progressoModulos: [
                { nome: 'Razão e Proporção', faseAtual: 1, totalFases: 5, cor: '#00A8FF' },
                { nome: 'Estatística', faseAtual: 1, totalFases: 4, cor: '#9C27B0' },
                { nome: 'Probabilidade', faseAtual: 3, totalFases: 5, cor: '#00BCD4' },
                { nome: 'Aritmética', faseAtual: 2, totalFases: 6, cor: '#FFD700' }
            ],
            dadosGrafico: {
                labels: ['Razão e Proporção', 'Estatística', 'Probabilidade', 'Aritmética', 'Geometria'],
                taxaErros: [80, 50, 20, 15, 60] 
            },
            questoesMaisErradas: [
                { modulo: 'Razão e Proporção - Fase 3', enunciado: 'Uma escala de 1:50000 significa que 2cm no mapa representam quantos km na realidade?', valor: 5, tipo: 'erros' },
                { modulo: 'Estatística - Fase 2', enunciado: 'Calcule a mediana da sequência: 1, 4, 7, 9, 10.', valor: 4, tipo: 'erros' }
            ],
            fasesPerfeitas: [
                { modulo: 'Probabilidade', fase: 1 }
            ]
        },
        {
            id: "aluno_3",
            nome: "Carlos Eduardo",
            nivel: "Nível 7",
            avatar: "🧑‍💻",
            progressoModulos: [
                { nome: 'Razão e Proporção', faseAtual: 5, totalFases: 5, cor: '#00A8FF' },
                { nome: 'Estatística', faseAtual: 4, totalFases: 4, cor: '#9C27B0' },
                { nome: 'Probabilidade', faseAtual: 4, totalFases: 5, cor: '#00BCD4' },
                { nome: 'Aritmética', faseAtual: 6, totalFases: 6, cor: '#FFD700' }
            ],
            dadosGrafico: {
                labels: ['Razão e Proporção', 'Estatística', 'Probabilidade', 'Aritmética', 'Geometria'],
                taxaErros: [10, 5, 15, 10, 25] 
            },
            questoesMaisErradas: [
                { modulo: 'Geometria - Fase 3', enunciado: 'Qual é a fórmula do Teorema de Pitágoras?', valor: 2, tipo: 'erros' }
            ],
            fasesPerfeitas: [
                { modulo: 'Razão e Proporção', fase: 3 },
                { modulo: 'Probabilidade', fase: 2 }
            ]
        }
    ];

    let myChart = null; 
    let alunoAtivoId = 'geral'; 
    const ctx = document.getElementById('graficoDificuldade').getContext('2d');
    const listaAlunosEl = document.getElementById('lista-alunos');
    const inputBusca = document.getElementById('busca-aluno');

    // ==========================================
    // 2. FUNÇÕES DE RENDERIZAÇÃO
    // ==========================================

    function renderizarProgresso(dadosAluno) {
        const secaoProgresso = document.getElementById('secao-progresso');
        const listaModulos = document.getElementById('lista-progresso-modulos');

        if (dadosAluno.id === 'geral' || !dadosAluno.progressoModulos) {
            secaoProgresso.style.display = 'none';
            return;
        }

        secaoProgresso.style.display = 'block';
        listaModulos.innerHTML = '';

        dadosAluno.progressoModulos.forEach(mod => {
            let calcFase = mod.faseAtual > mod.totalFases ? mod.totalFases : mod.faseAtual;
            let porcentagem = (calcFase / mod.totalFases) * 100;
            
            let textoFase = mod.faseAtual > mod.totalFases || mod.faseAtual === mod.totalFases
                            ? 'Módulo Concluído ✅' 
                            : `Fase ${mod.faseAtual} de ${mod.totalFases}`;

            listaModulos.innerHTML += `
                <div class="modulo-progress-card" style="border-left: 4px solid ${mod.cor}">
                    <div class="mod-info">
                        <h4 style="color: ${mod.cor}">${mod.nome}</h4>
                        <span>${textoFase}</span>
                    </div>
                    <div class="mod-bar-bg">
                        <div class="mod-bar-fill" style="width: ${porcentagem}%; background-color: ${mod.cor}"></div>
                    </div>
                </div>
            `;
        });
    }

    function renderizarListas(dadosAluno) {
        const listaErradas = document.getElementById('lista-mais-erradas');
        const listaPerfeitas = document.getElementById('lista-fases-perfeitas');
        const tituloPerfeitas = document.getElementById('titulo-acertos');
        const subtituloPerfeitas = document.getElementById('subtitulo-acertos');
        
        listaErradas.innerHTML = '';
        listaPerfeitas.innerHTML = '';

        if (dadosAluno.id === 'geral') {
            tituloPerfeitas.textContent = "🌟 Fases Mais Gabaritadas";
            subtituloPerfeitas.textContent = "Fases concluídas sem erros pela turma";
        } else {
            tituloPerfeitas.textContent = "🌟 Fases Perfeitas";
            subtituloPerfeitas.textContent = "Fases concluídas com 100% de acerto";
        }

        // Renderiza Erros
        if(dadosAluno.questoesMaisErradas.length === 0) {
            listaErradas.innerHTML = '<p style="color:#888; text-align:center; padding:10px;">Nenhum erro registrado.</p>';
        } else {
            dadosAluno.questoesMaisErradas.forEach(q => {
                listaErradas.innerHTML += `
                    <li class="question-item">
                        <div class="question-info">
                            <div class="question-module">${q.modulo}</div>
                            <div class="question-text">"${q.enunciado}"</div>
                        </div>
                        <div class="question-stat stat-erro">
                            ${q.valor}<br><span style="font-size:0.7rem; font-weight:400; color:#888;">erros</span>
                        </div>
                    </li>`;
            });
        }

        // Renderiza Fases Perfeitas
        if(!dadosAluno.fasesPerfeitas || dadosAluno.fasesPerfeitas.length === 0) {
            listaPerfeitas.innerHTML = '<p style="color:#888; text-align:center; padding:10px;">Nenhuma fase perfeita registrada.</p>';
        } else {
            dadosAluno.fasesPerfeitas.forEach(f => {
                let infoExtra = dadosAluno.id === 'geral' 
                    ? `${f.valor}<br><span style="font-size:0.7rem; font-weight:400; color:#888;">alunos</span>`
                    : `🌟<br><span style="font-size:0.7rem; font-weight:400; color:#888;">perfeita</span>`;

                listaPerfeitas.innerHTML += `
                    <li class="question-item">
                        <div class="question-info">
                            <div class="question-module">${f.modulo}</div>
                            <div class="question-text">Fase ${f.fase}</div>
                        </div>
                        <div class="question-stat stat-acerto">
                            ${infoExtra}
                        </div>
                    </li>`;
            });
        }
    }

    function renderizarGrafico(dadosGrafico) {
        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dadosGrafico.labels,
                datasets: [{
                    label: 'Taxa de Erro (%)',
                    data: dadosGrafico.taxaErros,
                    backgroundColor: [
                        'rgba(231, 76, 60, 0.7)',  
                        'rgba(241, 196, 15, 0.7)', 
                        'rgba(231, 76, 60, 0.9)',  
                        'rgba(46, 204, 113, 0.7)', 
                        'rgba(230, 126, 34, 0.7)'  
                    ],
                    borderColor: ['#c0392b', '#f39c12', '#c0392b', '#27ae60', '#d35400'],
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#EAEAEA', font: { family: 'Poppins' } } },
                    tooltip: {
                        callbacks: { label: function(context) { return `Taxa de erro: ${context.parsed.y}%`; } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#EAEAEA', callback: function(value) { return value + '%' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#EAEAEA', font: { family: 'Poppins' } }
                    }
                }
            }
        });
    }

    function renderizarBarraLateral(filtro = "") {
        listaAlunosEl.innerHTML = '';
        const termo = filtro.toLowerCase().trim();

        const alunosFiltrados = alunosData.filter(aluno => 
            aluno.id === 'geral' || aluno.nome.toLowerCase().includes(termo)
        );

        if(alunosFiltrados.length === 1 && alunosFiltrados[0].id === 'geral' && termo !== "") {
            listaAlunosEl.innerHTML = `<p style="color: #888; text-align: center; font-size: 0.9rem; padding: 10px;">Nenhum aluno encontrado.</p>`;
        }

        alunosFiltrados.forEach(aluno => {
            const li = document.createElement('li');
            li.className = 'aluno-item';
            if(aluno.id === alunoAtivoId) {
                li.classList.add('active');
            }
            li.innerHTML = `
                <div class="aluno-avatar">${aluno.avatar}</div>
                <div class="aluno-info">
                    <h4>${aluno.nome}</h4>
                    <span>${aluno.nivel}</span>
                </div>
            `;
            li.addEventListener('click', () => selecionarAluno(aluno.id, li));
            listaAlunosEl.appendChild(li);
        });
    }

    function selecionarAluno(idAluno, elementoClicado) {
        const dados = alunosData.find(a => a.id === idAluno);
        if(!dados) return;

        alunoAtivoId = idAluno;

        document.querySelectorAll('.aluno-item').forEach(el => el.classList.remove('active'));
        if(elementoClicado) {
            elementoClicado.classList.add('active');
        } else {
            const itens = document.querySelectorAll('.aluno-item');
            if(itens.length > 0) itens[0].classList.add('active');
        }

        const tituloEl = document.getElementById('titulo-analise');
        if (idAluno === 'geral') {
            tituloEl.textContent = "Análise Geral da Turma";
        } else {
            tituloEl.textContent = `Análise Individual: ${dados.nome}`;
        }

        renderizarProgresso(dados);
        renderizarGrafico(dados.dadosGrafico);
        renderizarListas(dados);
    }

    inputBusca.addEventListener('input', (e) => {
        renderizarBarraLateral(e.target.value);
    });

    renderizarBarraLateral();
    selecionarAluno('geral', null);
});


// ==========================================
// 3. LÓGICA DE GERENCIAMENTO DE SIMULADOS
// ==========================================

window.abrirModalSimulado = function(e) {
    e.preventDefault();
    document.getElementById('modal-simulado').classList.add('active');
    
    // Reseta o select ao abrir o modal
    document.getElementById('simulado-modulo').value = "";
    document.getElementById('lista-fases-disponiveis').innerHTML = '<p style="color:#888; font-size: 0.9rem; text-align: center;">Selecione um módulo primeiro.</p>';
}

window.fecharModalSimulado = function() {
    document.getElementById('modal-simulado').classList.remove('active');
}

window.carregarFasesParaSimulado = async function() {
    const modulo = document.getElementById('simulado-modulo').value;
    const container = document.getElementById('lista-fases-disponiveis');
    
    if(!modulo) return;
    
    container.innerHTML = '<p style="color:#aaa; text-align: center;">Buscando fases do servidor...</p>';

    try {
        // Busca primeiro no LocalStorage (fallback), depois no servidor
        let fasesLocais = JSON.parse(localStorage.getItem(`fases_${modulo}`) || "[]");
        
        const resp = await fetch(`/api/fases/${modulo}`);
        let fasesServidor = await resp.json();

        let fasesFinais = fasesServidor.length > 0 ? fasesServidor : fasesLocais;

        if (!fasesFinais || fasesFinais.length === 0) {
            container.innerHTML = '<p style="color:#e74c3c; font-size: 0.9rem; text-align: center;">Nenhuma fase encontrada neste módulo. Crie fases em "Criar Nova Fase" primeiro.</p>';
            return;
        }

        // Armazena temporariamente na janela para construir o simulado depois
        window.fasesCarregadasTemp = fasesFinais;
        container.innerHTML = '';

        fasesFinais.forEach(f => {
            container.innerHTML += `
                <label style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; cursor: pointer; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                    <input type="checkbox" class="simulado-checkbox" value="${f.fase}" style="width: 18px; height: 18px;">
                    <span style="font-size: 1rem; color: #EAEAEA;">Fase ${f.fase} <span style="color:#888; font-size: 0.8rem;">(${f.qtd} questões)</span></span>
                </label>
            `;
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color:#e74c3c; text-align: center;">Erro de conexão ao buscar fases.</p>';
    }
}

window.salvarSimulado = async function() {
    const modulo = document.getElementById('simulado-modulo').value;
    const checkboxes = document.querySelectorAll('.simulado-checkbox:checked');
    
    if (!modulo) {
        alert("Por favor, selecione um módulo da matéria.");
        return;
    }
    
    if (checkboxes.length === 0) {
        alert("Selecione pelo menos uma fase da lista para compor as questões do simulado.");
        return;
    }

    const btnSalvar = document.querySelector('.btn-salvar-simulado');
    btnSalvar.textContent = "Gerando Simulado...";
    btnSalvar.disabled = true;

    let questoesSimulado = [];
    
    // Mescla todas as questões das fases selecionadas
    checkboxes.forEach(cb => {
        const faseNum = parseInt(cb.value);
        const faseEncontrada = window.fasesCarregadasTemp.find(f => f.fase === faseNum);
        if(faseEncontrada && faseEncontrada.questoes) {
            questoesSimulado = questoesSimulado.concat(faseEncontrada.questoes);
        }
    });

    // Embaralha as questões para o aluno não decorar a ordem
    questoesSimulado = questoesSimulado.sort(() => Math.random() - 0.5);

    // O simulado atua como a "Fase 1" de um módulo virtual chamado "simulado_{materia}"
    const simuladoObj = {
        fase: 1, 
        qtd: questoesSimulado.length,
        questoes: questoesSimulado
    };

    const nomeModuloSimulado = `simulado_${modulo}`;

    try {
        // Salva no banco em memória do Java
        await fetch(`/api/fases/${nomeModuloSimulado}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(simuladoObj)
        });

        // Salva no LocalStorage como backup
        const chaveLocal = `fases_${nomeModuloSimulado}`;
        localStorage.setItem(chaveLocal, JSON.stringify([simuladoObj]));

        alert(`✅ Simulado de ${modulo.toUpperCase()} gerado com sucesso! Contém ${questoesSimulado.length} questões embaralhadas.`);
        fecharModalSimulado();
    } catch (e) {
        console.error(e);
        alert("Aviso: O simulado foi criado localmente, mas o servidor Java não respondeu.");
    } finally {
        btnSalvar.textContent = "Gerar e Salvar Simulado";
        btnSalvar.disabled = false;
    }
}