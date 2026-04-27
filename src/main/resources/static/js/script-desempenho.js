document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Busca perfil do usuário e lista de conquistas disponíveis simultaneamente
        const [perfilRes, conquistasRes] = await Promise.all([
            fetch('/api/perfil'),
            fetch('/api/conquistas')
        ]);

        const user = await perfilRes.json();
        const conquistasDB = await conquistasRes.json();

        // Atualizar Estatísticas
        document.getElementById('stat-acertos').textContent = user.totalAcertos || 0;
        document.getElementById('stat-erros').textContent = user.totalErros || 0;
        document.getElementById('stat-desafios').textContent = user.desafiosVencidos || 0;
        document.getElementById('stat-ofensiva').textContent = user.streak || 0;

        // 2. Mapear Conquistas Fixas (Legado)
        const conquistasFixas = [
            { id: "badge_iniciante", icon: "🌱", name: "Iniciante", desc: "500 XP atingidos" },
            { id: "badge_ofensiva_7", icon: "🔥", name: "Focado", desc: "7 dias de ofensiva" },
            { id: "badge_primeiro_simulado", icon: "📝", name: "Candidato", desc: "1º simulado feito" },
            { id: "badge_desafio_diario", icon: "✅", name: "Dever Cumprido", desc: "Missão diária feita" }
        ];

        // 3. Mesclar com Conquistas Dinâmicas do Professor
        const todasConquistas = [...conquistasFixas];
        conquistasDB.forEach(c => {
            todasConquistas.push({
                id: "dynamic_" + c.id,
                icon: c.icone,
                name: c.nome,
                desc: c.descricao
            });
        });

        // 4. Renderizar Galeria
        const grid = document.getElementById('badges-grid');
        grid.innerHTML = '';

        todasConquistas.forEach(conquista => {
            const isUnlocked = user.emblemas && user.emblemas.includes(conquista.id);
            
            const item = document.createElement('div');
            item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            item.innerHTML = `
                <span class="badge-icon">${conquista.icon}</span>
                <p class="badge-name">${conquista.name}</p>
                <p class="badge-desc">${conquista.desc}</p>
                ${isUnlocked ? '<div class="check-mark">✓</div>' : ''}
            `;
            grid.appendChild(item);
        });

        // 5. Gráfico de Pizza
        const ctx = document.getElementById('chartPizza').getContext('2d');
        const total = (user.totalAcertos || 0) + (user.totalErros || 0);
        const dados = total === 0 ? [1, 0] : [user.totalAcertos, user.totalErros];
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Acertos', 'Erros'],
                datasets: [{
                    data: dados,
                    backgroundColor: total === 0 ? ['#333', '#111'] : ['#58CC02', '#FF4B4B'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#aaa' } } } }
        });

    } catch (e) { console.error("Erro:", e); }
});