document.addEventListener('DOMContentLoaded', () => {
    const listaAlunosUl = document.getElementById('lista-alunos');
    const tituloAnalise = document.getElementById('titulo-analise');
    const inputBusca = document.getElementById('busca-aluno');
    const adminToggle = document.getElementById('admin-toggle');
    const adminContent = document.getElementById('admin-content');
    
    let todosAlunos = [];
    let alunoSelecionadoId = null;
    let meuGrafico;

    // MAPEAMENTO DE NOMES DE MÓDULOS
    const mapaNomesModulos = {
        'mat': 'Razão e Proporção',
        'simulado': 'Simulados ENEM',
        'geometria': 'Geometria Espacial',
        'probabilidade': 'Probabilidade',
        'aritmetica': 'Aritmética'
    };

    if (adminToggle) {
        adminToggle.addEventListener('click', () => {
            adminContent.classList.toggle('expanded');
            adminToggle.classList.toggle('expanded');
        });
    }

    fetch('/api/admin/relatorios/usuarios/lista')
        .then(res => res.json())
        .then(data => {
            todosAlunos = data;
            renderizarLista(todosAlunos);
            carregarAnaliseGeral();
        });

    function renderizarLista(lista) {
        listaAlunosUl.innerHTML = '';
        const liGeral = document.createElement('li');
        liGeral.className = 'aluno-item';
        liGeral.style.cssText = 'display:flex; align-items:center; padding:10px; margin-bottom:5px; cursor:pointer; border-radius:8px; background:rgba(255,215,0,0.1); border:1px solid #FFD700;';
        liGeral.innerHTML = `<span>📊</span><div style="margin-left:10px;"><strong style="color:#FFD700;">Visão Geral da Turma</strong></div>`;
        liGeral.onclick = () => carregarAnaliseGeral();
        listaAlunosUl.appendChild(liGeral);

        lista.forEach(aluno => {
            const li = document.createElement('li');
            li.className = 'aluno-item';
            li.style.cssText = 'display:flex; align-items:center; padding:10px; margin-bottom:5px; cursor:pointer; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid transparent;';
            li.innerHTML = `<span>${aluno.avatar}</span><div style="margin-left:10px;"><strong style="display:block; color:#fff; font-size:0.9rem;">${aluno.nome}</strong><span style="font-size:0.7rem; color:#888;">${aluno.email}</span></div>`;
            li.onclick = () => carregarAnaliseIndividual(aluno.id);
            listaAlunosUl.appendChild(li);
        });
    }

    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = todosAlunos.filter(a => 
            (a.nome && a.nome.toLowerCase().includes(termo)) || 
            (a.email && a.email.toLowerCase().includes(termo))
        );
        renderizarLista(filtrados);
    });

    // Função auxiliar para traduzir chaves de ID complexas (ex: estatistica_fase1_id50)
    function formatarNomeChave(chave) {
        if (!chave) return 'DESCONHECIDA';
        if (chave.includes('_fase')) {
            const partes = chave.split('_fase');
            const mod = mapaNomesModulos[partes[0]] || partes[0].toUpperCase();
            const num = partes[1].split('_id')[0];
            return `${mod} - FASE ${num}`;
        }
        return chave.toUpperCase().replace('MAT-', 'FASE ').replace('-', ' FASE ');
    }

    window.carregarAnaliseGeral = function() {
        alunoSelecionadoId = null;
        tituloAnalise.innerHTML = `Visão Geral: <span style="color:#FFD700;">Desempenho da Turma</span>`;
        document.getElementById('perfil-aluno').style.display = 'none';
        document.getElementById('secao-progresso').style.display = 'none';
        
        fetch('/api/admin/relatorios/geral')
            .then(res => res.json())
            .then(data => {
                atualizarGrafico(data.acertos, data.erros);
                
                const listaP = document.getElementById('lista-fases-perfeitas');
                listaP.innerHTML = '';
                (data.fasesMaisPerfeitas || []).forEach(item => {
                    const li = document.createElement('li');
                    // CORREÇÃO DA RENDERIZAÇÃO NO PAINEL ADMIN
                    li.textContent = `⭐ ${formatarNomeChave(item.nomeFase)} (${item.quantidade} alunos gabaritaram)`;
                    listaP.appendChild(li);
                });

                const listaC = document.getElementById('lista-mais-erradas');
                listaC.innerHTML = '';
                (data.fasesMaisCriticas || []).forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `❌ ${formatarNomeChave(item.nomeFase)} (${item.quantidade} alunos com erros)`;
                    listaC.appendChild(li);
                });
            });
    };

    window.carregarAnaliseIndividual = function(id) {
        alunoSelecionadoId = id;
        fetch(`/api/admin/relatorios/usuarios/analise/${id}`)
            .then(res => res.json())
            .then(data => {
                tituloAnalise.innerHTML = `Análise de <span style="color:var(--cor-xp)">${data.nome}</span>`;
                document.getElementById('perfil-aluno').style.display = 'block';
                document.getElementById('secao-progresso').style.display = 'block';

                document.getElementById('nome-aluno-perfil').textContent = data.nome;
                document.getElementById('email-aluno-perfil').textContent = data.email;
                document.getElementById('nivel-aluno-perfil').textContent = data.nivel;
                document.getElementById('streak-aluno-perfil').textContent = `${data.streak} 🔥`;
                document.getElementById('xp-aluno-perfil').textContent = data.xp;
                
                const conquistaContainer = document.getElementById('conquistas-aluno-perfil');
                conquistaContainer.innerHTML = '';
                (data.emblemas || []).forEach(eb => {
                    const span = document.createElement('span');
                    span.className = 'badge-item';
                    span.textContent = eb.replace('badge_', '').replace('_', ' ').toUpperCase();
                    conquistaContainer.appendChild(span);
                });

                const gridProgresso = document.getElementById('lista-progresso-modulos');
                gridProgresso.innerHTML = '';
                const progressoPorModulo = {};
                
                // CORREÇÃO DA LEITURA DE PROGRESSO INDIVIDUAL (Nova Chave Dinâmica e Fallback)
                Object.keys(data.statusFases || {}).forEach(key => {
                    let modId, num;
                    
                    if (key.includes('_fase')) {
                        const partes = key.split('_fase');
                        modId = partes[0];
                        num = parseInt(partes[1].split('_id')[0]) || 0;
                    } else if (key.includes('-')) {
                        const partes = key.split('-');
                        modId = partes[0];
                        num = parseInt(partes[1]) || 0;
                    } else {
                        return; // Ignora chaves desconhecidas
                    }

                    if (!progressoPorModulo[modId] || num > progressoPorModulo[modId]) {
                        progressoPorModulo[modId] = num;
                    }
                });
                
                for (const modId in progressoPorModulo) {
                    const nomeAmigavel = mapaNomesModulos[modId] || modId.toUpperCase();
                    const card = document.createElement('div');
                    card.className = 'modulo-progresso-card';
                    card.innerHTML = `<h5>${nomeAmigavel}</h5><span>Fase Atual: ${progressoPorModulo[modId]}</span>`;
                    gridProgresso.appendChild(card);
                }

                const listaR = document.getElementById('lista-mais-erradas');
                listaR.innerHTML = `<li style="border-left:3px solid #e74c3c; padding-left:10px; color:#e74c3c;"><strong>Sugestão IA:</strong> ${data.sugestao}</li>`;
                
                const listaP = document.getElementById('lista-fases-perfeitas');
                listaP.innerHTML = '';
                (data.fasesPerfeitas || []).forEach(f => {
                    const li = document.createElement('li');
                    li.textContent = `⭐ ${formatarNomeChave(f)}`;
                    listaP.appendChild(li);
                });

                atualizarGrafico(data.acertos, data.erros);
                document.getElementById('subtitulo-acertos').innerHTML = `<strong>Previsão:</strong> +${data.previsaoXp.toFixed(0)} XP esperado no próximo acesso.`;
            });
    };

    function atualizarGrafico(acertos, erros) {
        const ctx = document.getElementById('graficoDificuldade').getContext('2d');
        if (meuGrafico) meuGrafico.destroy();
        meuGrafico = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Acertos', 'Erros'],
                datasets: [{
                    data: [acertos, erros],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
            }
        });
    }

    document.getElementById('btn-alterar-senha').onclick = () => {
        const novaSenha = document.getElementById('nova-senha-input').value;
        if (!alunoSelecionadoId || !novaSenha) return alert("Selecione um aluno e defina a senha.");

        fetch(`/api/admin/relatorios/usuarios/alterar-senha/${alunoSelecionadoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novaSenha: novaSenha })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.mensagem || data.erro);
            document.getElementById('nova-senha-input').value = '';
        });
    };
});