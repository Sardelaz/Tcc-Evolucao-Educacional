document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. DADOS SIMULADOS (Para visualização)
    // No futuro, substitua isso por uma chamada ao Backend (ex: fetch('/api/estatisticas'))
    // ==========================================
    
    // Dados para o Gráfico (Taxa de Erro por Matéria/Assunto)
    const dadosGrafico = {
        labels: ['Razão e Proporção', 'Estatística', 'Probabilidade', 'Aritmética', 'Geometria'],
        taxaErros: [65, 45, 80, 30, 55] // Porcentagem média de erro dos alunos nestes módulos
    };

    // Dados para as listas de questões
    const questoesMaisErradas = [
        {
            modulo: 'Probabilidade - Fase 2',
            enunciado: 'Se jogarmos dois dados perfeitos, qual a probabilidade de a soma ser 7?',
            erros: 142
        },
        {
            modulo: 'Razão e Proporção - Fase 3',
            enunciado: 'Uma escala de 1:50000 significa que 2cm no mapa representam quantos km na realidade?',
            erros: 115
        },
        {
            modulo: 'Geometria - Fase 1',
            enunciado: 'Qual a área de um trapézio com bases 10 e 6, e altura 4?',
            erros: 98
        }
    ];

    const questoesMaisAcertadas = [
        {
            modulo: 'Aritmética - Fase 1',
            enunciado: 'Quanto é 15% de 200?',
            acertos: 320
        },
        {
            modulo: 'Estatística - Fase 1',
            enunciado: 'Qual a moda no conjunto de dados: [2, 3, 3, 4, 5, 3]?',
            acertos: 295
        },
        {
            modulo: 'Razão e Proporção - Fase 1',
            enunciado: 'Se 2 pães custam R$ 1,00, quanto custam 10 pães?',
            acertos: 280
        }
    ];

    // ==========================================
    // 2. RENDERIZAÇÃO DO GRÁFICO (Chart.js)
    // ==========================================
    const ctx = document.getElementById('graficoDificuldade').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dadosGrafico.labels,
            datasets: [{
                label: 'Taxa de Erro (%)',
                data: dadosGrafico.taxaErros,
                backgroundColor: [
                    'rgba(231, 76, 60, 0.7)',  // Vermelho para alta dificuldade
                    'rgba(241, 196, 15, 0.7)', // Amarelo
                    'rgba(231, 76, 60, 0.9)',  // Vermelho escuro
                    'rgba(46, 204, 113, 0.7)', // Verde para baixa dificuldade
                    'rgba(230, 126, 34, 0.7)'  // Laranja
                ],
                borderColor: [
                    '#c0392b',
                    '#f39c12',
                    '#c0392b',
                    '#27ae60',
                    '#d35400'
                ],
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#EAEAEA', font: { family: 'Poppins' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Taxa de erro: ${context.parsed.y}%`;
                        }
                    }
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

    // ==========================================
    // 3. RENDERIZAÇÃO DAS LISTAS DE QUESTÕES
    // ==========================================
    const listaErradasElement = document.getElementById('lista-mais-erradas');
    const listaAcertadasElement = document.getElementById('lista-mais-acertadas');

    // Popular lista de erros
    questoesMaisErradas.forEach(questao => {
        const li = document.createElement('li');
        li.className = 'question-item';
        li.innerHTML = `
            <div class="question-info">
                <div class="question-module">${questao.modulo}</div>
                <div class="question-text">"${questao.enunciado}"</div>
            </div>
            <div class="question-stat stat-erro">
                ${questao.erros}<br><span style="font-size:0.7rem; font-weight:400; color:#888;">erros</span>
            </div>
        `;
        listaErradasElement.appendChild(li);
    });

    // Popular lista de acertos
    questoesMaisAcertadas.forEach(questao => {
        const li = document.createElement('li');
        li.className = 'question-item';
        li.innerHTML = `
            <div class="question-info">
                <div class="question-module">${questao.modulo}</div>
                <div class="question-text">"${questao.enunciado}"</div>
            </div>
            <div class="question-stat stat-acerto">
                ${questao.acertos}<br><span style="font-size:0.7rem; font-weight:400; color:#888;">acertos</span>
            </div>
        `;
        listaAcertadasElement.appendChild(li);
    });

});