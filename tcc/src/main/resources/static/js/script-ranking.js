document.addEventListener("DOMContentLoaded", () => {
    const podiumElements = {
        1: document.getElementById("rank-1"),
        2: document.getElementById("rank-2"),
        3: document.getElementById("rank-3")
    };
    const rankingItemsContainer = document.getElementById("ranking-items");
    
    // Controles de Paginação
    const btnPrev = document.getElementById("btn-prev-page");
    const btnNext = document.getElementById("btn-next-page");
    const pageInfo = document.getElementById("page-info");
    
    let currentPage = 0;
    const pageSize = 10;

    btnPrev.addEventListener("click", () => {
        if (currentPage > 0) fetchRanking(currentPage - 1);
    });

    btnNext.addEventListener("click", () => {
        fetchRanking(currentPage + 1);
    });

    function atualizarTitulosLiga(ligaStr) {
        const titleEl = document.getElementById("liga-title-display");
        const iconEl = document.getElementById("liga-icon-display");
        
        let emoji = "🏆";
        if (ligaStr === "FERRO") emoji = "⚙️";
        else if (ligaStr === "BRONZE") emoji = "🥉";
        else if (ligaStr === "PRATA") emoji = "🥈";
        else if (ligaStr === "OURO") emoji = "🥇";
        else if (ligaStr === "DIAMANTE") emoji = "💎";
        else if (ligaStr === "LENDA") emoji = "🔥";
        
        if (titleEl) titleEl.textContent = `Liga ${ligaStr}`;
        if (iconEl) iconEl.textContent = emoji;
    }

    function renderRanking(users, startOffset) {
        if (rankingItemsContainer) {
            rankingItemsContainer.innerHTML = "";
        }

        if (!users || users.length === 0) {
            if (rankingItemsContainer) {
                rankingItemsContainer.innerHTML = "<div class='loading-state'>Nenhum estudante encontrado nesta liga.</div>";
            }
            // Limpa pódio
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
            const position = startOffset + index + 1; // Posição Real Global

            // LÓGICA DO PÓDIO (Somente aparece na página 0, posições 1, 2, 3)
            if (position <= 3) {
                const container = podiumElements[position];
                if (container) {
                    const nameEl = container.querySelector(".user-name");
                    if (nameEl) nameEl.textContent = user.nome || "Estudante";

                    const xpEl = container.querySelector(".user-xp");
                    if (xpEl) xpEl.textContent = `${user.xp || 0} XP`;

                    const avatarEl = container.querySelector(".user-avatar");
                    if (avatarEl && user.avatar) {
                        avatarEl.textContent = user.avatar;
                    }
                }
            } 
            // LÓGICA DA LISTA (4º em diante)
            else {
                if (rankingItemsContainer) {
                    const item = document.createElement("div");
                    item.className = `ranking-item ${user.isCurrentUser ? 'is-me' : ''}`;

                    item.innerHTML = `
                        <div class="item-rank">${position}º</div>
                        <div class="item-user">
                            <div class="item-avatar">${user.avatar || '👤'}</div>
                            <span class="item-name">${user.nome}</span>
                        </div>
                        <div class="item-xp">${user.xp} XP</div>
                    `;
                    rankingItemsContainer.appendChild(item);
                }
            }
        });

        // Limpa partes do pódio se não existirem jogadores suficientes na página 0
        if (startOffset === 0 && users.length < 3) {
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
            .then(res => {
                if (!res.ok) throw new Error("Falha na resposta do servidor");
                return res.json();
            })
            .then(data => {
                currentPage = data.currentPage;
                const totalPages = data.totalPages;
                
                atualizarTitulosLiga(data.liga || 'FERRO');
                
                // Calcula o offset para saber qual é a posição do jogador atual no array
                const startOffset = currentPage * pageSize;
                renderRanking(data.usuarios || [], startOffset);
                
                // Atualiza Interface de Paginação
                pageInfo.textContent = `Página ${currentPage + 1} de ${totalPages === 0 ? 1 : totalPages}`;
                btnPrev.disabled = currentPage === 0;
                btnNext.disabled = currentPage >= totalPages - 1;
            })
            .catch(err => {
                console.error("Erro ao carregar ranking:", err);
                if (rankingItemsContainer) {
                    rankingItemsContainer.innerHTML = "<div class='loading-state' style='color: #e74c3c;'>Erro ao sincronizar dados com o servidor.</div>";
                }
            });
    }

    fetchRanking(0);
});