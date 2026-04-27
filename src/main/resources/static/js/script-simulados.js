document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/modulos')
        .then(res => res.json())
        .then(async (modulos) => {
            const grid = document.getElementById('simulados-grid');
            if (grid) {
                grid.innerHTML = '';

                // Verificação assíncrona para conferir se cada simulado possui fases/questões
                const promessas = modulos.map(m => 
                    fetch(`/api/fases/simulado_${m.slug}`)
                        .then(res => res.json())
                        .then(fases => ({ ...m, disponivel: fases && fases.length > 0 }))
                        .catch(() => ({ ...m, disponivel: false }))
                );

                const modulosVerificados = await Promise.all(promessas);

                modulosVerificados.forEach(m => {
                    const btnClass = m.disponivel ? 'btn-iniciar' : 'btn-iniciar disabled';
                    const btnText = m.disponivel ? 'Iniciar Simulado' : 'Sem Questões';
                    const btnHref = m.disponivel ? `/aula?modulo=simulado_${m.slug}&fase=1` : 'javascript:void(0)';
                    const cardOpacity = m.disponivel ? '1' : '0.7';
                    const grayscale = m.disponivel ? '' : 'filter: grayscale(0.8);';

                    grid.innerHTML += `
                        <div class="simulado-card" style="--cor-tema: ${m.cor}; opacity: ${cardOpacity}; ${grayscale}">
                            <div class="card-icon">${m.icone}</div>
                            <div class="card-content">
                                <h4>${m.nome}</h4>
                                <p>Simulado focado nas questões cadastradas para o módulo de ${m.nome}.</p>
                                <div class="card-stats">
                                    <span>📋 Simulado Geral</span>
                                    <span>⏱️ Cronometrado</span>
                                </div>
                            </div>
                            <a href="${btnHref}" class="${btnClass}">${btnText}</a>
                        </div>
                    `;
                });

                if (modulos.length === 0) {
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #aaa;">Não há módulos de simulado disponíveis no momento.</p>';
                }

                // Efeito de hover apenas nos cards habilitados
                const cards = document.querySelectorAll('.simulado-card');
                cards.forEach(card => {
                    const btn = card.querySelector('.btn-iniciar');
                    if (!btn.classList.contains('disabled')) {
                        card.addEventListener('mouseenter', () => {
                            card.style.transform = 'translateY(-8px)';
                        });
                        card.addEventListener('mouseleave', () => {
                            card.style.transform = 'translateY(0)';
                        });
                    } else {
                        card.style.cursor = 'not-allowed';
                    }
                });
            }
        });
});