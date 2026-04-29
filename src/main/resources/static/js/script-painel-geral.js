document.addEventListener('DOMContentLoaded', () => {
    const listaAlunosUl = document.getElementById('lista-alunos');
    const tituloAnalise = document.getElementById('titulo-analise');
    const inputBusca = document.getElementById('busca-aluno');
    const adminToggle = document.getElementById('admin-toggle');
    const adminContent = document.getElementById('admin-content');
    
    const selectModulo = document.getElementById('select-modulo-filtro');
    const selectFase = document.getElementById('select-fase-filtro');
    const btnDetalhes = document.getElementById('btn-buscar-detalhes');
    const areaDetalhes = document.getElementById('area-detalhes-fase');

    let todosAlunos = [];
    let alunoSelecionadoId = null;
    let meuGrafico;
    let progressoGlobalAluno = {};

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

    fetch(`/api/admin/relatorios/usuarios/lista?t=${Date.now()}`)
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
        const kLower = chave.toLowerCase();
        if (kLower.includes('_fase')) {
            const partes = chave.split('_fase');
            const mod = mapaNomesModulos[partes[0].toLowerCase()] || partes[0].toUpperCase();
            const num = partes[1].split('_id')[0];
            return `${mod} - Fase ${num}`;
        }
        return chave.toUpperCase().replace('MAT-', 'FASE ').replace('-', ' FASE ');
    }

    window.carregarAnaliseGeral = function() {
        alunoSelecionadoId = null;
        areaDetalhes.style.display = 'none';
        if (tituloAnalise) tituloAnalise.innerHTML = `Visão Geral: <span style="color:#FFD700;">Desempenho da Turma</span>`;
        const perf = document.getElementById('perfil-aluno');
        const prog = document.getElementById('secao-progresso');
        if (perf) perf.style.display = 'none';
        if (prog) prog.style.display = 'none';
        
        fetch(`/api/admin/relatorios/geral?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                atualizarGrafico(data.acertos, data.erros);
                
                const listaP = document.getElementById('lista-fases-perfeitas');
                if (listaP) {
                    listaP.innerHTML = '';
                    if (data.fasesMaisPerfeitas && data.fasesMaisPerfeitas.length > 0) {
                        data.fasesMaisPerfeitas.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = `⭐ ${item.nomeFase} - ${item.quantidade} concluídas`;
                            listaP.appendChild(li);
                        });
                    } else {
                        listaP.innerHTML = '<li style="color:#888;">Nenhuma fase perfeita na turma ainda.</li>';
                    }
                }
                
                const listaC = document.getElementById('lista-mais-erradas');
                if (listaC) {
                    listaC.innerHTML = '';
                    if (data.questoesCriticasGeral && data.questoesCriticasGeral.length > 0) {
                        data.questoesCriticasGeral.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = `❌ ${item}`;
                            listaC.appendChild(li);
                        });
                    } else {
                        listaC.innerHTML = '<li style="color:#888;">Nenhum erro crítico registrado na turma.</li>';
                    }
                }
            });
    };

    function lerDadosMisturados(str) {
        let obj = {};
        if (!str) return obj;
        if (typeof str === 'object') str = JSON.stringify(str);
        const extrair = (regex) => {
            const match = str.match(regex);
            return match ? Number(match[1]) : undefined;
        };
        obj.acertos = extrair(/acertos["']?\s*[:=]\s*(\d+)/i);
        obj.erros = extrair(/erros["']?\s*[:=]\s*(\d+)/i);
        obj.tempoSegundos = extrair(/tempo(?:Segundos)?["']?\s*[:=]\s*(\d+)/i);
        obj.vidasRestantes = extrair(/vidas(?:Restantes)?["']?\s*[:=]\s*(\d+)/i);
        obj.totalDesafiosFase = extrair(/totalDesafiosFase["']?\s*[:=]\s*(\d+)/i);
        obj.desafiosVencidosNestaFase = extrair(/desafiosVencidos(?:NestaFase)?["']?\s*[:=]\s*(\d+)/i);
        if (obj.acertos === undefined && obj.tempoSegundos === undefined) {
            try {
                let parsed = JSON.parse(str);
                while (typeof parsed === 'string') { parsed = JSON.parse(parsed); }
                if (typeof parsed === 'object' && parsed !== null) return parsed;
            } catch (e) {}
        }
        return obj;
    }

    window.carregarAnaliseIndividual = function(id) {
        alunoSelecionadoId = id;
        areaDetalhes.style.display = 'none';
        fetch(`/api/admin/relatorios/usuarios/analise/${id}?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                if (tituloAnalise) tituloAnalise.innerHTML = `Análise de <span style="color:var(--cor-xp)">${data.nome}</span>`;
                const perf = document.getElementById('perfil-aluno');
                const prog = document.getElementById('secao-progresso');
                if (perf) perf.style.display = 'block';
                if (prog) prog.style.display = 'block';

                selectModulo.innerHTML = '<option value="">Selecionar Módulo</option>';
                progressoGlobalAluno = data.statusFases || {};
                const modulosEncontrados = new Set();
                Object.keys(progressoGlobalAluno).forEach(key => {
                    const kLower = key.toLowerCase();
                    const modId = kLower.split('_fase')[0].split('-')[0].trim();
                    if (!modulosEncontrados.has(modId)) {
                        modulosEncontrados.add(modId);
                        const opt = document.createElement('option');
                        opt.value = modId;
                        opt.textContent = mapaNomesModulos[modId] || modId.toUpperCase();
                        selectModulo.appendChild(opt);
                    }
                });

                selectModulo.onchange = () => {
                    selectFase.innerHTML = '<option value="">Fase</option>';
                    const mod = selectModulo.value;
                    if (!mod) return;
                    const fasesUnicas = new Set();
                    Object.keys(progressoGlobalAluno).forEach(key => {
                        const kLower = key.toLowerCase();
                        if (kLower.startsWith(mod.toLowerCase())) {
                            let num;
                            if (kLower.includes('_fase')) num = kLower.split('_fase')[1].split('_id')[0];
                            else if (kLower.includes('-')) num = kLower.split('-')[1];
                            if (num && !isNaN(parseInt(num))) fasesUnicas.add(parseInt(num));
                        }
                    });
                    [...fasesUnicas].sort((a,b) => a-b).forEach(f => {
                        const opt = document.createElement('option');
                        opt.value = f;
                        opt.textContent = f;
                        selectFase.appendChild(opt);
                    });
                };

                btnDetalhes.onclick = () => {
                    const mod = selectModulo.value;
                    const fase = selectFase.value;
                    if (!mod || !fase) return alert("Selecione módulo e fase.");
                    fetch(`/api/admin/relatorios/usuarios/detalhes-fase/${alunoSelecionadoId}?modulo=${mod}&fase=${fase}&t=${Date.now()}`)
                        .then(res => res.json())
                        .then(det => {
                            if (det.encontrado && det.dadosBrutos) {
                                let dados = lerDadosMisturados(det.dadosBrutos);
                                if (!dados || typeof dados !== 'object') dados = {};
                                areaDetalhes.style.display = 'block';
                                const acertos = dados.acertos !== undefined ? dados.acertos : 0;
                                const erros = dados.erros !== undefined ? dados.erros : 0;
                                const tempo = dados.tempoSegundos !== undefined ? dados.tempoSegundos : 0;
                                const vidas = dados.vidasRestantes !== undefined ? dados.vidasRestantes : 3;
                                const totalDesafios = dados.totalDesafiosFase !== undefined ? dados.totalDesafiosFase : 0;
                                const desafiosVencidos = dados.desafiosVencidosNestaFase !== undefined ? dados.desafiosVencidosNestaFase : 0;

                                document.getElementById('det-acertos').textContent = acertos;
                                document.getElementById('det-erros').textContent = erros;
                                const min = Math.floor(tempo / 60);
                                const seg = tempo % 60;
                                document.getElementById('det-tempo').textContent = `${min}:${seg.toString().padStart(2, '0')}`;
                                document.getElementById('det-vidas').textContent = `${vidas} ❤️`;
                                if (totalDesafios > 0) {
                                    const concluido = desafiosVencidos === totalDesafios;
                                    document.getElementById('det-desafio').textContent = concluido ? "Sim ✅" : "Não ❌";
                                    document.getElementById('det-desafio').style.color = concluido ? "#58cc02" : "#ff4b4b";
                                } else {
                                    document.getElementById('det-desafio').textContent = "Nenhum";
                                    document.getElementById('det-desafio').style.color = "#888";
                                }
                            } else {
                                alert("Nenhum dado detalhado encontrado para esta fase.");
                            }
                        })
                        .catch(err => alert("Erro ao ler os dados históricos desta fase."));
                };

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
                    if (data.statusRanking === 'PROMOVIDO') elStatusRanking.innerHTML = `<span class="status-tag promo">↑ Subindo</span>`;
                    else if (data.statusRanking === 'REBAIXADO') elStatusRanking.innerHTML = `<span class="status-tag rebaix">↓ Caindo</span>`;
                    else elStatusRanking.innerHTML = `<span class="status-tag mantem">↔ Estável</span>`;
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
                        const kLower = key.toLowerCase();
                        let modId, num;
                        if (kLower.includes('_fase')) {
                            const partes = kLower.split('_fase');
                            modId = partes[0].trim();
                            num = parseInt(partes[1].split('_id')[0]) || 0;
                        } else if (kLower.includes('-')) {
                            const partes = kLower.split('-');
                            modId = partes[0].trim();
                            num = parseInt(partes[1]) || 0;
                        } else return;
                        if (!progressoPorModulo[modId] || num > progressoPorModulo[modId]) progressoPorModulo[modId] = num;
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
                    if (data.fasesPerfeitas && data.fasesPerfeitas.length > 0) {
                        data.fasesPerfeitas.forEach(f => {
                            const li = document.createElement('li');
                            li.textContent = `⭐ ${f}`;
                            listaP.appendChild(li);
                        });
                    } else {
                        listaP.innerHTML = '<li style="color:#888;">Nenhuma fase perfeita ainda.</li>';
                    }
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
        
        let valAcertos = parseInt(acertos) || 0;
        let valErros = parseInt(erros) || 0;

        meuGrafico = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Acertos', 'Erros'],
                datasets: [{
                    data: [valAcertos, valErros],
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