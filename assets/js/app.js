// Carregar configuração
let CONFIG = {};
let catalogo = { produtos: [] };

async function carregarConfig() {
    try {
        const response = await fetch('data/config.json');
        CONFIG = await response.json();
    } catch (error) {
        console.error('Erro ao carregar config:', error);
    }
}

async function carregarCatalogo() {
    try {
        const response = await fetch('data/catalogo.json');
        catalogo = await response.json();
    } catch (error) {
        console.error('Erro ao carregar catálogo:', error);
    }
}

// Renderizar marcas na home
function renderizarMarcas() {
    const marcasGrid = document.getElementById('marcas-grid');
    if (!marcasGrid) return;
    
    const marcas = {};
    catalogo.produtos.forEach(p => {
        if (!marcas[p.marca]) {
            marcas[p.marca] = 0;
        }
        marcas[p.marca]++;
    });
    
    marcasGrid.innerHTML = Object.entries(marcas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([marca, qtd]) => `
            <div class="marca-card">
                <span class="marca-nome">${marca}</span>
                <span class="marca-qtd">${qtd} produtos</span>
            </div>
        `).join('');
}

// Renderizar produtos em destaque
function renderizarDestaques() {
    const container = document.getElementById('produtos-destaque');
    if (!container) return;
    
    const destaques = catalogo.produtos
        .filter(p => p.destaque)
        .slice(0, 8);
    
    container.innerHTML = destaques.map(produto => `
        <article class="card-produto" data-id="${produto.id}">
            <div class="card-imagem">
                <img src="${produto.imagem}" alt="${produto.nome}" 
                     onerror="this.src='assets/images/placeholder.png'">
                ${produto.nova_chegada ? '<span class="card-badge">Novo</span>' : ''}
            </div>
            <div class="card-conteudo">
                <h4 class="card-nome">${produto.nome}</h4>
                <p class="card-marca">${produto.marca} • ${produto.volume}</p>
                <div class="card-precos">
                    <span class="preco-final">R$ ${produto.preco_final_brl.toFixed(2)}</span>
                </div>
                <div class="card-botoes">
                    <button class="btn-card btn-comprar" 
                            data-whatsapp-produto="${produto.id}">
                        <i data-lucide="message-circle"></i>
                        Comprar
                    </button>
                    <a href="catalogo.html?produto=${produto.id}" 
                       class="btn-card btn-detalhes">
                        <i data-lucide="eye"></i>
                        Detalhes
                    </a>
                </div>
            </div>
        </article>
    `).join('');
    
    // Re-inicializar ícones
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Inicializar WhatsApp
    if (window.inicializarWhatsApp) {
        window.inicializarWhatsApp();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarConfig();
    await carregarCatalogo();
    
    renderizarMarcas();
    renderizarDestaques();
    
    // Inicializar ícones
    if (window.lucide) {
        window.lucide.createIcons();
    }
});