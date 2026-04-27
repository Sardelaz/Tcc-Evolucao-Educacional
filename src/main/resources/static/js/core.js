// Interceptador Global do Fetch API para enviar o token CSRF automaticamente
const originalFetch = window.fetch;
window.fetch = async function() {
    let [resource, config] = arguments;
    
    if (config && (config.method === 'POST' || config.method === 'PUT' || config.method === 'DELETE')) {
        const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
        if (match) {
            config.headers = config.headers || {};
            config.headers['X-XSRF-TOKEN'] = match[2];
        }
    }
    return originalFetch(resource, config);
};

// ==========================================
// ESTILOS DINÂMICOS DO MODO CLARO (SUAVIZADO)
// ==========================================
const lightModeStyles = document.createElement('style');
lightModeStyles.innerHTML = `
    /* Fundo suave (off-white Slate) muito mais confortável para os olhos */
    body.light-mode {
        background-color: #F4F6F8 !important; 
        color: #334155 !important;
    }

    /* Paineis e Cartões - Branco puro com sombra elegante e borda discreta */
    body.light-mode .profile-panel,
    body.light-mode .nav-card,
    body.light-mode .area-card,
    body.light-mode .module-card,
    body.light-mode .action-card,
    body.light-mode .mission-card,
    body.light-mode .loja-card,
    body.light-mode .modal-content,
    body.light-mode .settings-modal-content,
    body.light-mode .summary-card,
    body.light-mode .admin-banner,
    body.light-mode .top-nav,
    body.light-mode .top-bar,
    body.light-mode .bottom-bar {
        background: #FFFFFF !important;
        border-color: #E2E8F0 !important;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03) !important;
    }

    /* Limpar Sombras de Texto Brilhantes (vindas do modo neon/escuro) */
    body.light-mode .loja-header h1,
    body.light-mode .display-user-name,
    body.light-mode .item-icon {
        text-shadow: none !important;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.08)) !important;
    }
    
    /* Textos e Títulos Globais */
    body.light-mode .top-nav h2,
    body.light-mode .top-bar h2,
    body.light-mode .loja-header h1 {
        color: #0F172A !important;
    }

    /* Textos Descritivos */
    body.light-mode p,
    body.light-mode .item-desc,
    body.light-mode .stat-item,
    body.light-mode .modal-subtitle,
    body.light-mode .loja-header p {
        color: #64748B !important;
    }

    /* O PULO DO GATO: Escurecer textos e ícones coloridos vibrantes 
       (que eram para o escuro) para melhorar contraste no fundo branco */
    body.light-mode .nav-card h2,
    body.light-mode .mission-card h2,
    body.light-mode .admin-banner h3,
    body.light-mode .module-card h3,
    body.light-mode .loja-card .item-title {
        filter: brightness(0.8) !important;
    }

    /* Limpar Fundos Hardcoded Escuros (Ex: mostrador de moedas e ranking) */
    body.light-mode .coin-display {
        background: #FEF3C7 !important; /* Âmbar muito suave */
        border: 1px solid #F59E0B !important;
        color: #B45309 !important;
        box-shadow: none !important;
    }

    /* Botões Base de Navegação */
    body.light-mode .btn-voltar,
    body.light-mode .modal-close {
        color: #64748B !important;
        text-shadow: none !important;
    }
    body.light-mode .btn-voltar:hover,
    body.light-mode .modal-close:hover {
        color: #0F172A !important;
    }

    /* Formulários: Inputs e Selects */
    body.light-mode .settings-input,
    body.light-mode input,
    body.light-mode select,
    body.light-mode textarea {
        background: #F8FAFC !important;
        color: #1E293B !important;
        border: 1px solid #CBD5E1 !important;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
    }
    body.light-mode .settings-input:focus,
    body.light-mode input:focus {
        border-color: var(--cor-primaria) !important;
        box-shadow: 0 0 0 3px rgba(28, 176, 246, 0.15) !important;
        outline: none;
    }
    body.light-mode .settings-input option {
        background: #FFFFFF !important;
        color: #1E293B !important;
    }

    /* Partículas de fundo: Quase transparentes para não poluir a tela clara */
    body.light-mode #art-background {
        filter: invert(1) opacity(0.06) !important;
    }

    /* Barras de XP e Containers de Progresso */
    body.light-mode .xp-bar-bg,
    body.light-mode .progress-container {
        background: #E2E8F0 !important;
        border-color: #CBD5E1 !important;
    }

    /* Modais de Avatar */
    body.light-mode .avatar {
        background: #F8FAFC !important;
        border-color: #CBD5E1 !important;
    }
    body.light-mode .avatar-option {
        background: #F1F5F9 !important;
        border-color: #CBD5E1 !important;
    }
    body.light-mode .avatar-option:hover {
        background: #E0F2FE !important;
    }
    body.light-mode .avatar-option.selected {
        background: #FEF3C7 !important;
        border-color: #F59E0B !important;
    }
`;
document.head.appendChild(lightModeStyles);

// Lógica Genérica de Modais
function setupModal(triggerId, modalId, closeId) {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);

    if (trigger && modal) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
}

// Fechar modal clicando fora
document.querySelectorAll('.modal-overlay, .settings-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (overlay.id === 'modal-game-over' || overlay.id === 'modal-pre-desafio') {
                return;
            }
            overlay.classList.remove('active');
        }
    });
});

// Ativação da Classe do Tema no Body
function aplicarTema(isLight) {
    if(isLight) {
        document.documentElement.style.setProperty('--cor-fundo', '#F4F6F8');
        document.documentElement.style.setProperty('--cor-container', '#FFFFFF');
        document.documentElement.style.setProperty('--cor-texto', '#334155');
        document.documentElement.style.setProperty('--cor-card', '#FFFFFF');
        document.documentElement.style.setProperty('--cor-borda', '#E2E8F0');
        document.body.classList.add('light-mode');
    } else {
        document.documentElement.style.removeProperty('--cor-fundo');
        document.documentElement.style.removeProperty('--cor-container');
        document.documentElement.style.removeProperty('--cor-texto');
        document.documentElement.style.removeProperty('--cor-card');
        document.documentElement.style.removeProperty('--cor-borda');
        document.body.classList.remove('light-mode');
    }
}

function dispararTraducao(lang) {
    const comboGoogle = document.querySelector('.goog-te-combo');
    if (comboGoogle) {
        comboGoogle.value = lang;
        comboGoogle.dispatchEvent(new Event('change'));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupModal('settings-toggle', 'settings-modal', 'close-settings-btn');
    
    const langSelect = document.getElementById('idioma-select');
    const savedLang = localStorage.getItem('userLang') || 'pt';
    if(langSelect) langSelect.value = savedLang;
    setTimeout(() => { if(savedLang !== 'pt') dispararTraducao(savedLang); }, 1500);

    // ==========================================
    // INJETAR O NOVO BOTÃO DE TEMA (REDESENHADO)
    // ==========================================
    const modalConfigContent = document.querySelector('.settings-modal-content');
    if(modalConfigContent && !document.getElementById('theme-toggle-btn')) {
        const themeBtn = document.createElement('button');
        themeBtn.id = 'theme-toggle-btn';
        
        function updateBtnVisuals(isLight) {
            themeBtn.innerHTML = isLight 
                ? '<span style="font-size:1.4rem;">🌙</span> <span>Ativar Tema Escuro</span>' 
                : '<span style="font-size:1.4rem;">☀️</span> <span>Ativar Tema Claro</span>';
            
            // O botão altera a cor conforme a ação que vai executar
            themeBtn.style.cssText = `
                width: 100%;
                padding: 14px 15px;
                margin-top: 25px;
                margin-bottom: 10px;
                border-radius: 12px;
                border: none;
                background: ${isLight ? 'linear-gradient(135deg, #1E293B, #0F172A)' : 'linear-gradient(135deg, #FFD700, #FFA500)'};
                color: ${isLight ? '#FFFFFF' : '#000000'};
                font-family: 'Poppins', sans-serif;
                font-weight: 700;
                font-size: 1.05rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                box-shadow: 0 4px 15px ${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255, 215, 0, 0.4)'};
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            `;
        }

        themeBtn.onmouseover = () => {
            themeBtn.style.transform = 'translateY(-3px) scale(1.02)';
            themeBtn.style.boxShadow = localStorage.getItem('appTheme') === 'light' 
                ? '0 8px 25px rgba(0,0,0,0.4)' 
                : '0 8px 25px rgba(255, 215, 0, 0.6)';
        };
        themeBtn.onmouseout = () => {
            themeBtn.style.transform = 'translateY(0) scale(1)';
            themeBtn.style.boxShadow = localStorage.getItem('appTheme') === 'light' 
                ? '0 4px 15px rgba(0,0,0,0.3)' 
                : '0 4px 15px rgba(255, 215, 0, 0.4)';
        };
        
        const temaSalvo = localStorage.getItem('appTheme') === 'light';
        aplicarTema(temaSalvo);
        updateBtnVisuals(temaSalvo);
        
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isNowLight = localStorage.getItem('appTheme') !== 'light';
            localStorage.setItem('appTheme', isNowLight ? 'light' : 'dark');
            aplicarTema(isNowLight);
            updateBtnVisuals(isNowLight);
        });

        const submitBtn = document.getElementById('save-settings-btn') || modalConfigContent.querySelector('button[type="submit"]');
        if (submitBtn && submitBtn.parentNode) {
            submitBtn.parentNode.insertBefore(themeBtn, submitBtn); 
        } else {
            modalConfigContent.appendChild(themeBtn); 
        }
    } else {
        aplicarTema(localStorage.getItem('appTheme') === 'light');
    }

    const settingsForm = document.getElementById('settings-form');
    if(settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const idiomaSelecionado = document.getElementById('idioma-select').value;
            localStorage.setItem('userLang', idiomaSelecionado);
            dispararTraducao(idiomaSelecionado);
            alert("Configurações atualizadas com sucesso!");
            document.getElementById('settings-modal').classList.remove('active');
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login';
            } catch (error) { window.location.href = '/login'; }
        });
    }

    // LER O PERFIL DO BACKEND PARA RENDERIZAR MOEDAS E LIGA GLOBAIS
    fetch('/api/perfil').then(res => res.json()).then(perfil => {
        const barraMoedas = document.getElementById('display-moedas');
        if(barraMoedas) barraMoedas.textContent = `🪙 ${perfil.moedas}`;
        
        const barraLiga = document.getElementById('display-liga');
        if(barraLiga) barraLiga.textContent = `LIGA ${perfil.liga.toUpperCase()}`;

        const displayName = document.getElementById('display-user-name');
        if(displayName) displayName.textContent = perfil.nome;
        
        const adminCard = document.getElementById('admin-panel-card');
        if(adminCard && (perfil.role === 'ROLE_ADMIN' || perfil.role === 'ROLE_PROFESSOR')) {
            adminCard.style.display = 'flex';
        }

        
    }).catch(() => {});
    
    // CARREGADOR DE MÓDULOS DINÂMICOS
    async function carregarModulosDinamicos() {
        const selects = document.querySelectorAll('select#modulo, select#busca-modulo, select#filter-module, select#modulo_simulado, select#modulo_busca');
        const homeGrid = document.getElementById('modulos-grid');
        
        try {
            const res = await fetch('/api/modulos');
            if (res.ok) {
                const modulos = await res.json();
                
                selects.forEach(select => {
                    const isSimulado = select.id.includes('simulado');
                    const isFilter = select.id.includes('filter');
                    
                    let html = '';
                    if (isFilter) html += '<option value="todos">Todos os Módulos</option>';
                    else html += '<option value="" disabled selected>Selecione o módulo...</option>';

                    modulos.forEach(m => {
                        let val = isSimulado ? `simulado_${m.slug}` : m.slug;
                        let nome = isSimulado ? `Simulado de ${m.nome}` : m.nome;
                        html += `<option value="${val}">${nome}</option>`;
                    });
                    
                    if (modulos.length > 0) select.innerHTML = html;
                });
                
                if(homeGrid) {
                    homeGrid.innerHTML = '';
                    modulos.forEach(m => {
                        homeGrid.innerHTML += `
                            <a href="/m/${m.slug}" class="area-card module-card" style="border-bottom: 4px solid ${m.cor}; box-shadow: 0 4px 15px rgba(0,0,0,0.2); text-decoration: none;">
                                <div class="icon" style="font-size: 3rem; margin-bottom: 10px;">${m.icone}</div>
                                <h3 style="color: ${m.cor}; text-align: center;">${m.nome}</h3>
                            </a>
                        `;
                    });
                    if (modulos.length === 0) {
                        homeGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">Nenhum módulo cadastrado ainda. Peça ao seu professor para criar!</p>`;
                    }
                }
            }
        } catch(e) { console.error("Erro ao carregar modulos dinâmicos", e); }
    }
    carregarModulosDinamicos();
});