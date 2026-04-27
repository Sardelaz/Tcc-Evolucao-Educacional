document.addEventListener("DOMContentLoaded", () => {
    const podiumElements = {
        1: document.getElementById("rank-1"),
        2: document.getElementById("rank-2"),
        3: document.getElementById("rank-3")
    };
    const rankingItemsContainer = document.getElementById("ranking-items");
    
    const btnPrev = document.getElementById("btn-prev-page");
    const btnNext = document.getElementById("btn-next-page");
    const pageInfo = document.getElementById("page-info");
    
    const nextLigaEl = document.getElementById("next-liga-name");
    const promoDescEl = document.getElementById("promotion-desc");
    const promoBarEl = document.getElementById("promotion-progress");
    const cycleDateEl = document.getElementById("cycle-end-date");
    
    let currentPage = 0;
    const pageSize = 10;
    let promoLimit = 3;
    let relegationLimit = 15;

    btnPrev.addEventListener("click", () => {
        if (currentPage > 0) fetchRanking(currentPage - 1);
    });

    btnNext.addEventListener("click", () => {
        fetchRanking(currentPage + 1);
    });

    function atualizarInterfaceLiga(data) {
        const ligaStr = data.liga || 'FERRO';
        const requisitos = data.requisitos;
        
        const titleEl = document.getElementById("liga-title-display");
        const iconEl = document.getElementById("liga-icon-display");
        const emojis = { 'FERRO': '⚙️', 'BRONZE': '🥉', 'PRATA': '🥈', 'OURO': '🥇', 'DIAMANTE': '💎', 'LENDA': '🔥' };
        
        if (titleEl) titleEl.textContent = `Liga ${ligaStr}`;
        if (iconEl) iconEl.textContent = emojis[ligaStr] || '🏆';

        if (cycleDateEl) cycleDateEl.textContent = data.dataFimCiclo || 'Calculando...';

        if (requisitos) {
            nextLigaEl.textContent = `Rumo à Liga ${requisitos.proximaLiga}`;
            promoDescEl.textContent = requisitos.descricao;
            promoLimit = requisitos.promocaoTop;
            relegationLimit = requisitos.rebaixamentoPos;
            promoBarEl.style.width = "100%"; 
        }
    }

    function renderRanking(users, startOffset) {
        if (rankingItemsContainer) rankingItemsContainer.innerHTML = "";

        if (!users || users.length === 0) {
            if (rankingItemsContainer) rankingItemsContainer.innerHTML = "<div class='loading-state'>Nenhum estudante nesta liga ainda.</div>";
            return;
        }

        users.forEach((user, index) => {
            const position = startOffset + index + 1; 

            if (position <= 3) {
                const container = podiumElements[position];
                if (container) {
                    container.querySelector(".user-name").textContent = user.nome || "Estudante";
                    container.querySelector(".user-xp").textContent = `${user.xp || 0} XP`;
                    const avatarEl = container.querySelector(".user-avatar");
                    if (avatarEl && user.avatar) avatarEl.textContent = user.avatar;
                }
            } 
            
            if (rankingItemsContainer) {
                const item = document.createElement("div");
                const inPromo = position <= promoLimit && promoLimit > 0;
                const inRelegation = position >= relegationLimit && relegationLimit > 0;
                
                item.className = `ranking-item ${user.isCurrentUser ? 'is-me' : ''} ${inPromo ? 'promotion-zone' : ''} ${inRelegation ? 'relegation-zone' : ''}`;

                item.innerHTML = `
                    <div class="item-rank">${position}º</div>
                    <div class="item-user">
                        <div class="item-avatar">${user.avatar || '👤'}</div>
                        <span class="item-name">
                            ${user.nome} 
                            ${inPromo ? '<span class="tag-promo">↑ Subindo</span>' : ''}
                            ${inRelegation ? '<span class="tag-releg">↓ Caindo</span>' : ''}
                        </span>
                    </div>
                    <div class="item-xp">${user.xp} XP</div>
                `;
                rankingItemsContainer.appendChild(item);
            }
        });
    }

    function fetchRanking(targetPage = 0) {
        const currentAvatar = localStorage.getItem('userAvatar') || '👨‍🎓';
        
        fetch(`/api/ranking?page=${targetPage}&size=${pageSize}&avatar=${currentAvatar}`)
            .then(res => res.json())
            .then(data => {
                currentPage = data.currentPage;
                atualizarInterfaceLiga(data);
                renderRanking(data.usuarios || [], currentPage * pageSize);
                
                pageInfo.textContent = `Página ${currentPage + 1}`;
                btnPrev.disabled = currentPage === 0;
                btnNext.disabled = currentPage >= data.totalPages - 1;
            })
            .catch(err => console.error("Erro no ranking:", err));
    }

    fetchRanking(0);
});