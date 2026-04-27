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
    let promoLimit = 0;
    let relegationLimit = 0;

    function atualizarInterfaceLiga(data) {
        const ligaStr = data.liga || 'FERRO';
        const emojis = { 'FERRO': '⚙️', 'BRONZE': '🥉', 'PRATA': '🥈', 'OURO': '🥇', 'DIAMANTE': '💎', 'LENDA': '🔥' };
        
        document.getElementById("liga-title-display").textContent = `Liga ${ligaStr}`;
        document.getElementById("liga-icon-display").textContent = emojis[ligaStr] || '🏆';
        
        if (cycleDateEl) cycleDateEl.textContent = data.dataFimCiclo || '--/-- às --:--';

        if (data.requisitos) {
            nextLigaEl.textContent = `Rumo à Liga ${data.requisitos.proximaLiga}`;
            promoDescEl.textContent = data.requisitos.descricao;
            promoLimit = data.requisitos.promocaoTop;
            relegationLimit = data.requisitos.rebaixamentoPos;
        }
    }

    function renderRanking(users, startOffset) {
        if (rankingItemsContainer) rankingItemsContainer.innerHTML = "";

        if (!users || users.length === 0) {
            rankingItemsContainer.innerHTML = "<div class='loading-state'>Nenhum estudante encontrado na liga.</div>";
            
            // Limpa o pódio se não houver ninguém
            [1, 2, 3].forEach(pos => {
                const c = podiumElements[pos];
                if (c) {
                    c.querySelector(".user-name").textContent = "-";
                    c.querySelector(".user-xp").textContent = "0 XP";
                }
            });
            return;
        }

        users.forEach((user, index) => {
            const position = startOffset + index + 1; 

            if (position <= 3 && currentPage === 0) {
                const container = podiumElements[position];
                if (container) {
                    container.querySelector(".user-name").textContent = user.nome || "Estudante";
                    container.querySelector(".user-xp").textContent = `${user.xp || 0} XP`;
                    const avatarEl = container.querySelector(".user-avatar");
                    if (avatarEl && user.avatar) avatarEl.textContent = user.avatar;
                }
            } 
            
            const item = document.createElement("div");
            const inPromo = position <= promoLimit && promoLimit > 0;
            const inRelegation = position >= relegationLimit && relegationLimit > 0;
            item.className = `ranking-item ${user.isCurrentUser ? 'is-me' : ''}`;

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
                <div class="item-xp">${user.xp || 0} XP</div>
            `;
            rankingItemsContainer.appendChild(item);
        });

        // Limpa partes do pódio se existirem menos de 3 usuários
        if (currentPage === 0 && users.length < 3) {
            for (let i = users.length + 1; i <= 3; i++) {
                const c = podiumElements[i];
                if (c) {
                    c.querySelector(".user-name").textContent = "-";
                    c.querySelector(".user-xp").textContent = "0 XP";
                }
            }
        }
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
                btnNext.disabled = (currentPage + 1) >= data.totalPages || data.totalPages === 0;
            })
            .catch(err => console.error("Erro ao carregar ranking:", err));
    }

    btnPrev.onclick = () => fetchRanking(currentPage - 1);
    btnNext.onclick = () => fetchRanking(currentPage + 1);
    fetchRanking(0);
});