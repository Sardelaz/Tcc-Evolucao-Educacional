document.addEventListener('DOMContentLoaded', () => {
    const listaAlunosUl = document.getElementById('lista-alunos');
    const tituloAnalise = document.getElementById('titulo-analise');
    const inputBusca = document.getElementById('busca-aluno');
    const adminToggle = document.getElementById('admin-toggle');
    const adminContent = document.getElementById('admin-content');
    
    let todosAlunos = [];
    let alunoSelecionadoId = null;
    let meuGrafico;

    const mapaNomesModulos = {
        'mat': 'Razão e Proporção',
        'simulado': 'Simulados ENEM',
        'geometria': 'Geometria Espacial',
        'probabilidade': 'Probabilidade',
        'aritmetica': 'Aritmética'
    };

    if (adminToggle && adminContent) {
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
        if (!listaAlunosUl) return;
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

    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const filtrados = todosAlunos.filter(a => 
                (a.nome && a.nome.toLowerCase().includes(termo)) || 
                (a.email && a.email.toLowerCase().includes(termo))
            );
            renderizarLista(filtrados);
        });
    }

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
        if (tituloAnalise) tituloAnalise.innerHTML = `Visão Geral: <span style="color:#FFD700;">Desempenho da Turma</span>`;
        
        const perf = document.getElementById('perfil-aluno');
        const prog = document.getElementById('secao-progresso');
        if (perf) perf.style.display = 'none';
        if (prog) prog.style.display = 'none';
        
        fetch('/api/admin/relatorios/geral')
            .then(res => res.json())
            .then(data => {
                atualizarGrafico(data.acertos, data.erros);
                
                const listaP = document.getElementById('lista-fases-perfeitas');
                if (listaP) {
                    listaP.innerHTML = '';
                    (data.fasesMaisPerfeitas || []).forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = `⭐ ${formatarNomeChave(item.nomeFase)} (${item.quantidade} alunos gabaritaram)`;
                        listaP.appendChild(li);
                    });
                }

                const listaC = document.getElementById('lista-mais-erradas');
                if (listaC) {
                    listaC.innerHTML = '';
                    (data.questoesCriticasGeral || []).forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = `❌ ${item}`;
                        listaC.appendChild(li);
                    });
                }
            });
    };

    window.carregarAnaliseIndividual = function(id) {
        alunoSelecionadoId = id;
        fetch(`/api/admin/relatorios/usuarios/analise/${id}`)
            .then(res => res.json())
            .then(data => {
                if (tituloAnalise) tituloAnalise.innerHTML = `Análise de <span style="color:var(--cor-xp)">${data.nome}</span>`;
                
                const perf = document.getElementById('perfil-aluno');
                const prog = document.getElementById('secao-progresso');
                if (perf) perf.style.display = 'block';
                if (prog) prog.style.display = 'block';

                const elNome = document.getElementById('nome-aluno-perfil');
                const elEmail = document.getElementById('email-aluno-perfil');
                const elNivel = document.getElementById('nivel-aluno-perfil');
                const elStreak = document.getElementById('streak-aluno-perfil');
                const elXp = document.getElementById('xp-aluno-perfil');
                const elLiga = document.getElementById('liga-aluno-perfil');
                const elPosicao = document.getElementById('posicao-aluno-perfil');
                const elStatusRanking = document.getElementById('status-ranking-perfil');

                if (elNome) elNome.textContent = data.nome;
                if (elEmail) elEmail.textContent = data.email;
                if (elNivel) elNivel.textContent = data.nivel;
                if (elStreak) elStreak.textContent = `${data.streakDiaria || 0} 🔥`;
                if (elXp) elXp.textContent = data.xp;
                if (elLiga) elLiga.textContent = data.liga || 'FERRO';
                if (elPosicao) elPosicao.textContent = `#${data.posicao || '-'}`;

                if (elStatusRanking) {
                    if (data.statusRanking === 'PROMOVIDO') {
                        elStatusRanking.innerHTML = `<span class="status-tag promo">↑ Subindo</span>`;
                    } else if (data.statusRanking === 'REBAIXADO') {
                        elStatusRanking.innerHTML = `<span class="status-tag rebaix">↓ Caindo</span>`;
                    } else {
                        elStatusRanking.innerHTML = `<span class="status-tag mantem">↔ Estável</span>`;
                    }
                }
                
                const conquistaContainer = document.getElementById('conquistas-aluno-perfil');
                if (conquistaContainer) {
                    conquistaContainer.innerHTML = '';
                    (data.emblemas || []).forEach(eb => {
                        const span = document.createElement('span');
                        span.className = 'badge-item';
                        span.textContent = eb.replace('badge_', '').replace('_', ' ').toUpperCase();
                        conquistaContainer.appendChild(span);
                    });
                }

                const gridProgresso = document.getElementById('lista-progresso-modulos');
                if (gridProgresso) {
                    gridProgresso.innerHTML = '';
                    const progressoPorModulo = {};
                    
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
                            return;
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
                }

                const listaR = document.getElementById('lista-mais-erradas');
                if (listaR) {
                    listaR.innerHTML = `<li style="border-left:3px solid #e74c3c; padding-left:10px; color:#e74c3c; margin-bottom:10px;"><strong>Sugestão IA:</strong> ${data.sugestao || 'Continue praticando!'}</li>`;
                    
                    if (data.questoesErradasRecentes && data.questoesErradasRecentes.length > 0) {
                        data.questoesErradasRecentes.forEach(erro => {
                            const li = document.createElement('li');
                            li.style.marginBottom = "5px";
                            li.textContent = `❌ ${erro}`;
                            listaR.appendChild(li);
                        });
                    } else {
                        const li = document.createElement('li');
                        li.style.color = "#888";
                        li.textContent = "Nenhum erro crítico registrado recentemente.";
                        listaR.appendChild(li);
                    }
                }
                
                const listaP = document.getElementById('lista-fases-perfeitas');
                if (listaP) {
                    listaP.innerHTML = '';
                    (data.fasesPerfeitas || []).forEach(f => {
                        const li = document.createElement('li');
                        li.textContent = `⭐ ${formatarNomeChave(f)}`;
                        listaP.appendChild(li);
                    });
                }

                atualizarGrafico(data.acertos, data.erros);
                
                const elSubtitulo = document.getElementById('subtitulo-acertos');
                if (elSubtitulo) {
                    const previsaoValue = (data.previsaoXp !== undefined && data.previsaoXp !== null) ? data.previsaoXp : 0;
                    elSubtitulo.innerHTML = `<strong>Previsão:</strong> +${Number(previsaoValue).toFixed(0)} XP esperado no próximo acesso.`;
                }
            });
    };

    function atualizarGrafico(acertos, erros) {
        const canvas = document.getElementById('graficoDificuldade');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
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

    const btnSenha = document.getElementById('btn-alterar-senha');
    if (btnSenha) {
        btnSenha.onclick = () => {
            const inputSenha = document.getElementById('nova-senha-input');
            const novaSenha = inputSenha ? inputSenha.value : null;
            if (!alunoSelecionadoId || !novaSenha) return alert("Selecione um aluno e defina a senha.");

            fetch(`/api/admin/relatorios/usuarios/alterar-senha/${alunoSelecionadoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ novaSenha: novaSenha })
            })
            .then(res => res.json())
            .then(data => {
                alert(data.mensagem || data.erro);
                if (inputSenha) inputSenha.value = '';
            });
        };
    }
});