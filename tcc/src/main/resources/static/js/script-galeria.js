let allVideos = [];

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('videos-grid');
    
    // Elementos de Filtro
    const filterTitle = document.getElementById('filter-title');
    const filterModule = document.getElementById('filter-module');
    const filterOrigin = document.getElementById('filter-origin');

    // Converte URL do Youtube para formato Embed
    function getEmbedUrl(url) {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    }

    // Função responsável por desenhar os vídeos na tela
    function renderVideos(videosToRender) {
        grid.innerHTML = '';
        
        if (videosToRender.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px 0;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                    <h3 style="color: #aaa; font-weight: 500;">Nenhum vídeo encontrado com os filtros atuais.</h3>
                    <button onclick="limparFiltros()" style="margin-top: 15px; padding: 10px 20px; background: transparent; border: 1px solid #1cb0f6; color: #1cb0f6; border-radius: 8px; cursor: pointer; font-family: inherit; transition: 0.3s;">Limpar Filtros</button>
                </div>
            `;
            return;
        }

        videosToRender.forEach(v => {
            const card = document.createElement('div');
            card.className = 'simulado-card';
            card.style.setProperty('--cor-tema', v.origem === 'fase' ? '#FFD700' : '#1cb0f6');
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'flex-start';
            card.style.padding = '20px';

            let formatModulo = v.modulo.charAt(0).toUpperCase() + v.modulo.slice(1);

            card.innerHTML = `
                <div style="width: 100%; aspect-ratio: 16/9; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 2px solid var(--cor-tema); box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                    <iframe src="${getEmbedUrl(v.url)}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>
                </div>
                <div class="card-content" style="width: 100%; text-align: center;">
                    <h4 style="margin-bottom: 8px; font-size: 1.15rem; color: #fff; font-weight: 700;">${v.titulo}</h4>
                    <p style="margin-bottom: 20px; color: #aaa; text-transform: uppercase; font-size: 0.85rem; font-weight: bold; letter-spacing: 1px;">Módulo: ${formatModulo}</p>
                    <div class="card-stats" style="justify-content: center; gap: 10px;">
                        <span style="background: rgba(255,255,255,0.05); padding: 6px 15px; border-radius: 8px; font-size: 0.85rem; border: 1px solid var(--cor-tema); color: #fff; font-weight: 500;">
                            ${v.origem === 'fase' ? '⭐ Fase Oficial' : '🎥 Vídeo Extra'}
                        </span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Função que aplica os filtros
    function applyFilters() {
        const titleQuery = filterTitle.value.toLowerCase().trim();
        const moduleQuery = filterModule.value;
        const originQuery = filterOrigin.value;

        const filtered = allVideos.filter(v => {
            const matchTitle = v.titulo.toLowerCase().includes(titleQuery);
            const matchModule = moduleQuery === 'todos' || v.modulo === moduleQuery;
            const matchOrigin = originQuery === 'todos' || v.origem === originQuery;

            return matchTitle && matchModule && matchOrigin;
        });

        renderVideos(filtered);
    }

    // Função auxiliar para limpar filtros (disparada pelo botão quando não há resultados)
    window.limparFiltros = function() {
        filterTitle.value = '';
        filterModule.value = 'todos';
        filterOrigin.value = 'todos';
        applyFilters();
    };

    // Adiciona os Event Listeners para filtrar em Tempo Real
    filterTitle.addEventListener('input', applyFilters);
    filterModule.addEventListener('change', applyFilters);
    filterOrigin.addEventListener('change', applyFilters);

    // Carregamento Inicial dos Dados do Banco
    try {
        const response = await fetch('/api/videos');
        allVideos = await response.json();
        
        if(allVideos.length === 0) {
            grid.innerHTML = '<h3 style="text-align: center; width: 100%; color: #aaa; margin-top: 50px;">Nenhuma videoaula foi cadastrada ainda pelos professores.</h3>';
        } else {
            renderVideos(allVideos);
        }
    } catch (error) {
        grid.innerHTML = '<h3 style="text-align: center; width: 100%; color: #FF4B4B; margin-top: 50px;">Erro ao carregar vídeos do servidor.</h3>';
    }
});