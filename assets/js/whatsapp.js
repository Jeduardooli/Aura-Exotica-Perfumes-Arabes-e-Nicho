// Configuração WhatsApp
const WHATSAPP_CONFIG = {
    numero: '5511999999999',
    mensagem_padrao: 'Olá! Gostaria de saber mais sobre os perfumes árabes.',
    tempo_resposta: '5 minutos'
};

// Formatar número WhatsApp (garantir 9 dígitos)
function formatarWhatsApp(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 13 && numeros[2] === '9') {
        return numeros;
    }
    return numeros.length >= 11 ? 
        numeros.slice(0, 2) + '9' + numeros.slice(2, 11) : 
        numeros;
}

// Gerar link WhatsApp com mensagem personalizada
function gerarLinkWhatsApp(mensagem) {
    const numero = formatarWhatsApp(WHATSAPP_CONFIG.numero);
    const texto = encodeURIComponent(mensagem);
    return `https://wa.me/${numero}?text=${texto}`;
}

// Enviar produto específico para WhatsApp
function enviarProdutoWhatsApp(produto) {
    const mensagem = `Olá! 👋\n\n` +
        `Tenho interesse no perfume:\n` +
        `🧴 *${produto.nome}*\n` +
        `🔖 Código: ${produto.codigo}\n` +
        `💰 Preço: R$ ${produto.preco_final_brl.toFixed(2)}\n` +
        `📦 Volume: ${produto.volume}\n` +
        `👤 Gênero: ${produto.genero}\n\n` +
        `Gostaria de saber mais sobre disponibilidade e formas de pagamento. Aguardo retorno!`;
    
    const link = gerarLinkWhatsApp(mensagem);
    window.open(link, '_blank');
    
    // Tracking (opcional)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'whatsapp_click', {
            'event_category': 'vendas',
            'event_label': produto.nome,
            'value': produto.preco_final_brl
        });
    }
}

// Inicializar botões WhatsApp
function inicializarWhatsApp() {
    document.querySelectorAll('[data-whatsapp-produto]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const produtoId = btn.getAttribute('data-whatsapp-produto');
            const produto = window.catalogo?.produtos?.find(p => p.id === produtoId);
            if (produto) {
                enviarProdutoWhatsApp(produto);
            }
        });
    });
}

// Exportar funções
window.enviarProdutoWhatsApp = enviarProdutoWhatsApp;
window.gerarLinkWhatsApp = gerarLinkWhatsApp;
window.inicializarWhatsApp = inicializarWhatsApp;