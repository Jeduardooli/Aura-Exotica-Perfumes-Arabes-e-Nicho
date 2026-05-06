(function () {
  "use strict";

  const CONFIG = {
    PRODUCTS_JSON: "data/products.json",
    FALLBACK_PRODUCTS_JSON: "matches-100-images-urls.json",
    WHATSAPP_PHONE: "5511999999999",
    INITIAL_VISIBLE: 12,
    LOAD_MORE_INCREMENT: 12,
    MAX_PRICE: 1500
  };

  const state = {
    products: [],
    filtered: [],
    visibleCount: CONFIG.INITIAL_VISIBLE,
    filters: {
      search: "",
      brand: null,
      gender: "all",
      category: null,
      maxPrice: CONFIG.MAX_PRICE
    },
    sort: "default"
  };

  const noteFamilies = [
    {
      top: ["Bergamota", "Pimenta Rosa", "Cardamomo"],
      heart: ["Lavanda", "Geranio", "Acorde Ambarado"],
      base: ["Oud", "Patchouli", "Cedro"],
      tags: ["amadeirado", "especiarias", "intenso"]
    },
    {
      top: ["Mandarina", "Pera", "Flor de Laranjeira"],
      heart: ["Jasmim", "Rosa", "Praline"],
      base: ["Baunilha", "Musk", "Sandalwood"],
      tags: ["doce", "floral", "elegante"]
    },
    {
      top: ["Limao Siciliano", "Menta", "Maca Verde"],
      heart: ["Sage", "Lavanda", "Noz Moscada"],
      base: ["Ambroxan", "Vetiver", "Madeiras Secas"],
      tags: ["fresco", "versatil", "moderno"]
    },
    {
      top: ["Acafrao", "Canela", "Noz Moscada"],
      heart: ["Rosa Turca", "Incenso", "Couro"],
      base: ["Oud", "Ambar", "Resinas"],
      tags: ["oriental", "noturno", "marcante"]
    }
  ];

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function money(value) {
    if (!Number.isFinite(Number(value))) return "Preco sob consulta";
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function inferGender(text) {
    const value = text.toLowerCase();
    if (value.includes("feminino") || value.includes("woman") || value.includes("women")) return "F";
    if (value.includes("masculino") || value.includes(" man") || value.includes("men")) return "M";
    return "U";
  }

  function inferConcentration(text) {
    const value = text.toLowerCase();
    if (value.includes("extrait")) return "Extrait";
    if (value.includes("parfum")) return "Parfum";
    if (value.includes("edt") || value.includes("toilette")) return "EDT";
    return "EDP";
  }

  function inferVolume(text) {
    const match = text.match(/(\d{2,3})\s*ml/i);
    return match ? Number(match[1]) : 100;
  }

  function inferPrice(rank) {
    const base = 219 + ((rank || 1) % 9) * 38;
    return Math.min(1490, base);
  }

  function buildInstallments(price) {
    return [1, 2, 3, 4, 5, 6].map((qty) => ({
      qty,
      value: Number((price / qty).toFixed(2))
    }));
  }

  function normalizeRawProduct(raw, index) {
    if (raw.notes && raw.installments) return raw;

    const fullName = raw.full_name || raw.fullName || `${raw.brand || "Aura"} - ${raw.name || "Perfume"}`;
    const parts = fullName.split(" - ");
    const brand = raw.brand || parts[0] || "Aura Exotica";
    const name = raw.name || parts.slice(1).join(" - ") || fullName;
    const price = Number(raw.price) || inferPrice(raw.rank || index + 1);
    const family = noteFamilies[index % noteFamilies.length];
    const gender = raw.gender || inferGender(`${fullName} ${raw.product_url || ""}`);
    const badge = index < 4 ? "hot" : index < 10 ? "new" : index % 11 === 0 ? "launch" : null;
    const categories = [
      "Arabes",
      gender === "M" ? "Masculino" : gender === "F" ? "Feminino" : "Unissex",
      index % 3 === 0 ? "Noite" : "Dia",
      index % 4 === 0 ? "Alta Fixacao" : "Versatil"
    ];

    return {
      id: raw.id || slugify(fullName),
      rank: raw.rank || index + 1,
      brand,
      name,
      price,
      installments: buildInstallments(price),
      gender,
      volume_ml: raw.volume_ml || inferVolume(`${fullName} ${raw.product_url || ""}`),
      concentration: raw.concentration || inferConcentration(fullName),
      notes: raw.notes || {
        top: family.top,
        heart: family.heart,
        base: family.base
      },
      description: raw.description || `${name} combina presenca, sofisticacao e assinatura olfativa envolvente. Uma escolha certeira para quem busca perfume original com aura premium e atendimento direto pelo WhatsApp.`,
      image: raw.image || raw.image_url || "assets/Logo-Aura-Exotica.svg",
      images: raw.images || [raw.image_url || raw.image || "assets/Logo-Aura-Exotica.svg"],
      badge,
      origin: raw.origin || (["Lattafa", "Armaf", "Rasasi", "Afnan"].includes(brand) ? "Oriente Medio" : "Importado"),
      category: raw.category || categories,
      tags: raw.tags || family.tags,
      stock: raw.stock !== false,
      productUrl: raw.product_url || raw.productUrl || ""
    };
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadProducts() {
    if (state.products.length) return state.products;
    try {
      const data = await fetchJson(CONFIG.PRODUCTS_JSON);
      state.products = data.map(normalizeRawProduct);
    } catch (firstError) {
      try {
        const fallback = await fetchJson(CONFIG.FALLBACK_PRODUCTS_JSON);
        state.products = fallback.map(normalizeRawProduct);
      } catch (secondError) {
        state.products = [];
        showError("Nao foi possivel carregar o catalogo agora. Recarregue a pagina.");
      }
    }
    state.filtered = state.products.slice();
    return state.products;
  }

  function genderLabel(value) {
    if (value === "M") return "Masculino";
    if (value === "F") return "Feminino";
    return "Unissex";
  }

  function badgeLabel(value) {
    return { hot: "Mais vendido", new: "Novo", launch: "Lancamento" }[value] || value;
  }

  function generateWhatsAppLink(product) {
    const text = encodeURIComponent(
      `Ola! Tenho interesse no *${product.name}* (${product.brand}).\n` +
      `Preco: ${money(product.price)}\n` +
      `Volume: ${product.volume_ml}ml\n` +
      `Perfil: ${genderLabel(product.gender)}\n` +
      `Notas: ${product.notes.top.slice(0, 3).join(", ")}\n\n` +
      "Esta disponivel? Qual o prazo de entrega?"
    );
    return `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${text}`;
  }

  function productCardMarkup(product) {
    const installments = product.installments && product.installments[2] ? product.installments[2] : null;
    return `
      <article class="product-card" data-product-id="${product.id}" style="animation-delay: ${Math.min((product.rank || 1) % 12, 8) * 35}ms">
        <a class="card-img-container" href="produto.html?id=${encodeURIComponent(product.id)}" aria-label="Ver ${product.brand} ${product.name}">
          <img class="card-img" src="${product.image}" alt="${product.brand} ${product.name}" loading="lazy" width="320" height="320">
          ${product.badge ? `<span class="badge badge-${product.badge}">${badgeLabel(product.badge)}</span>` : ""}
        </a>
        <div class="card-body">
          <p class="card-brand">${product.brand}</p>
          <h3 class="card-title"><a href="produto.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
          <div class="card-meta">
            <span class="meta-chip">${genderLabel(product.gender)}</span>
            <span class="meta-chip">${product.volume_ml}ml</span>
            <span class="meta-chip">${product.concentration}</span>
          </div>
          <p class="card-price">${money(product.price)}</p>
          <p class="card-installments">${installments ? `ou 3x de ${money(installments.value)}` : "Consulte parcelamento"}</p>
          <div class="card-notes">
            ${product.notes.top.slice(0, 3).map((note) => `<span class="note-chip">${note}</span>`).join("")}
          </div>
          <div class="card-actions">
            <a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${generateWhatsAppLink(product)}">Comprar no WhatsApp</a>
            <a class="btn btn-outline" href="produto.html?id=${encodeURIComponent(product.id)}">Ver ficha</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderProducts(container, products) {
    if (!container) return;
    container.innerHTML = products.length ? products.map(productCardMarkup).join("") : '<div class="no-results">Nenhum produto encontrado.</div>';
  }

  function initGlobalComponents() {
    const toggle = $(".mobile-menu-toggle");
    const panel = $(".mobile-panel");
    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        const isOpen = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    if (!$(".floating-whatsapp")) {
      const floating = document.createElement("a");
      floating.className = "floating-whatsapp";
      floating.href = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent("Ola! Vim pelo site e gostaria de ajuda para escolher um perfume.")}`;
      floating.target = "_blank";
      floating.rel = "noopener";
      floating.setAttribute("aria-label", "Falar no WhatsApp");
      floating.textContent = "W";
      document.body.appendChild(floating);
    }

    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href*="wa.me"]');
      if (link && typeof window.gtag === "function") {
        window.gtag("event", "whatsapp_click", { href: link.href });
      }
    });
  }

  function initHome() {
    const featured = $("#featured-grid");
    const showcase = $("#hero-showcase");
    const best = state.products.slice(0, 8);
    renderProducts(featured, best);
    if (showcase) {
      showcase.innerHTML = state.products.slice(0, 3).map((product) => `
        <a class="showcase-card" href="produto.html?id=${encodeURIComponent(product.id)}">
          <img src="${product.image}" alt="${product.brand} ${product.name}" loading="eager" width="360" height="520">
          <span>${product.brand} ${product.name}</span>
        </a>
      `).join("");
    }
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function setActiveButton(group, value) {
    $all(".filter-btn", group).forEach((btn) => {
      btn.classList.toggle("active", (btn.dataset.value || "") === String(value || ""));
    });
  }

  function setupDynamicChips() {
    const brandWrap = $("#filter-brands");
    const categoryWrap = $("#filter-categories");
    if (brandWrap) {
      const brands = uniqueSorted(state.products.map((p) => p.brand));
      brandWrap.innerHTML = `<button class="filter-btn active" data-value="">Todas as marcas</button>` +
        brands.map((brand) => `<button class="filter-btn" data-value="${brand}">${brand}</button>`).join("");
      brandWrap.addEventListener("click", (event) => {
        const btn = event.target.closest(".filter-btn");
        if (!btn) return;
        state.filters.brand = btn.dataset.value || null;
        setActiveButton(brandWrap, btn.dataset.value || "");
        applyFilters();
        renderCatalog();
      });
    }
    if (categoryWrap) {
      const categories = uniqueSorted(state.products.flatMap((p) => p.category || []));
      categoryWrap.innerHTML = `<button class="filter-btn active" data-value="">Todas as categorias</button>` +
        categories.map((cat) => `<button class="filter-btn" data-value="${cat}">${cat}</button>`).join("");
      categoryWrap.addEventListener("click", (event) => {
        const btn = event.target.closest(".filter-btn");
        if (!btn) return;
        state.filters.category = btn.dataset.value || null;
        setActiveButton(categoryWrap, btn.dataset.value || "");
        applyFilters();
        renderCatalog();
      });
    }
  }

  function setupFilters() {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("q") || "";
    const search = $("#filter-search");
    const sort = $("#filter-sort");
    const price = $("#price-slider");
    const priceMax = $("#price-max");

    state.filters.search = initialSearch;
    if (search) {
      search.value = initialSearch;
      search.addEventListener("input", () => {
        state.filters.search = search.value.trim();
        applyFilters();
        renderCatalog();
      });
    }

    if (sort) {
      sort.addEventListener("change", () => {
        state.sort = sort.value;
        applyFilters();
        renderCatalog();
      });
    }

    $all("#filter-gender .filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.filters.gender = btn.dataset.value || "all";
        setActiveButton($("#filter-gender"), state.filters.gender);
        applyFilters();
        renderCatalog();
      });
    });

    if (price) {
      price.max = CONFIG.MAX_PRICE;
      price.value = CONFIG.MAX_PRICE;
      if (priceMax) priceMax.textContent = CONFIG.MAX_PRICE;
      price.addEventListener("input", () => {
        state.filters.maxPrice = Number(price.value);
        if (priceMax) priceMax.textContent = price.value;
        applyFilters();
        renderCatalog();
      });
    }

    setupDynamicChips();
  }

  function applyFilters() {
    const term = state.filters.search.toLowerCase();
    state.filtered = state.products.filter((product) => {
      const haystack = `${product.name} ${product.brand} ${product.description} ${(product.tags || []).join(" ")} ${(product.category || []).join(" ")}`.toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (state.filters.brand && product.brand !== state.filters.brand) return false;
      if (state.filters.gender !== "all" && product.gender !== state.filters.gender) return false;
      if (state.filters.category && !(product.category || []).includes(state.filters.category)) return false;
      if (Number(product.price) > state.filters.maxPrice) return false;
      return true;
    });

    const sorted = state.filtered.slice();
    if (state.sort === "price-low") sorted.sort((a, b) => a.price - b.price);
    if (state.sort === "price-high") sorted.sort((a, b) => b.price - a.price);
    if (state.sort === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (state.sort === "name-desc") sorted.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
    if (state.sort === "default") sorted.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    state.filtered = sorted;
    state.visibleCount = CONFIG.INITIAL_VISIBLE;
  }

  function renderCatalog() {
    const grid = $("#catalog-grid");
    const count = $("#results-count");
    const loadMore = $("#load-more-btn");
    if (!grid) return;

    const visible = state.filtered.slice(0, state.visibleCount);
    renderProducts(grid, visible);

    if (count) {
      count.textContent = `Exibindo ${Math.min(state.visibleCount, state.filtered.length)} de ${state.filtered.length} produtos`;
    }
    if (loadMore) {
      loadMore.classList.toggle("d-none", state.visibleCount >= state.filtered.length);
    }
  }

  function initCatalog() {
    setupFilters();
    applyFilters();
    renderCatalog();
    const loadMore = $("#load-more-btn");
    if (loadMore) {
      loadMore.addEventListener("click", () => {
        state.visibleCount += CONFIG.LOAD_MORE_INCREMENT;
        renderCatalog();
      });
    }
  }

  function productJsonLd(product) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${product.brand} ${product.name}`,
      image: product.image,
      description: product.description,
      brand: { "@type": "Brand", name: product.brand },
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: String(product.price),
        availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Aura Exotica Perfumes & Cosmeticos" }
      }
    });
    document.head.appendChild(script);
  }

  function initProductDetail() {
    const wrap = $("#product-detail");
    const related = $("#related-grid");
    if (!wrap) return;

    const id = new URLSearchParams(window.location.search).get("id");
    const product = state.products.find((item) => item.id === id);
    if (!product) {
      wrap.innerHTML = '<div class="no-results">Produto nao encontrado. Volte ao catalogo para escolher outra fragrancia.</div>';
      return;
    }

    document.title = `${product.brand} ${product.name} | Aura Exotica`;
    const metaDescription = $('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", product.description);

    const images = uniqueSorted([product.image].concat(product.images || []));
    wrap.innerHTML = `
      <div class="product-gallery">
        <div class="main-image-wrap">
          <img id="main-image" class="main-image" src="${product.image}" alt="${product.brand} ${product.name}" width="680" height="680">
        </div>
        <div class="thumb-images">
          ${images.slice(0, 4).map((image) => `<button type="button" data-image="${image}"><img src="${image}" alt="${product.name}" loading="lazy"></button>`).join("")}
        </div>
      </div>
      <div class="product-info-panel">
        <p class="eyebrow">${product.brand}</p>
        <h1>${product.name}</h1>
        <p class="product-price">${money(product.price)}</p>
        <p class="card-installments">ou 3x de ${money(product.installments[2].value)}. Atendimento, pagamento e entrega combinados no WhatsApp.</p>
        <div class="product-meta">
          <span class="meta-chip">${genderLabel(product.gender)}</span>
          <span class="meta-chip">${product.volume_ml}ml</span>
          <span class="meta-chip">${product.concentration}</span>
          <span class="meta-chip">${product.origin}</span>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="notes-pyramid">
          <div class="note-layer"><h3>Notas de Topo</h3><p>${product.notes.top.join(", ")}</p></div>
          <div class="note-layer"><h3>Notas de Coracao</h3><p>${product.notes.heart.join(", ")}</p></div>
          <div class="note-layer"><h3>Notas de Fundo</h3><p>${product.notes.base.join(", ")}</p></div>
        </div>
        <a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${generateWhatsAppLink(product)}">Comprar no WhatsApp</a>
      </div>
    `;

    $all(".thumb-images button", wrap).forEach((button) => {
      button.addEventListener("click", () => {
        const main = $("#main-image", wrap);
        if (main) main.src = button.dataset.image;
      });
    });

    if (related) {
      const relatedItems = state.products
        .filter((item) => item.id !== product.id && (item.brand === product.brand || item.gender === product.gender))
        .slice(0, 4);
      renderProducts(related, relatedItems);
    }

    const fixed = $("#product-whatsapp-fixed");
    if (fixed) fixed.href = generateWhatsAppLink(product);
    productJsonLd(product);
  }

  function initContact() {
    const form = $("#contact-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const text = encodeURIComponent(
        `Ola! Meu nome e ${data.get("name") || ""}.\n` +
        `Email: ${data.get("email") || ""}\n` +
        `Mensagem: ${data.get("message") || ""}`
      );
      window.open(`https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${text}`, "_blank", "noopener");
    });
  }

  function initBlogPost() {
    const article = $("#blog-post");
    if (!article) return;
    const slug = new URLSearchParams(window.location.search).get("slug") || "guia-perfume-arabe-original";
    const posts = {
      "guia-perfume-arabe-original": {
        title: "Como identificar perfume arabe original",
        date: "2026-04-30",
        body: [
          ["h2", "Observe embalagem, lote e acabamento"],
          ["p", "Perfumes originais costumam ter caixa firme, impressao limpa, lacre consistente e codigo de lote coerente entre frasco e embalagem."],
          ["h2", "Compre com curadoria"],
          ["p", "A melhor protecao e comprar de uma loja que conhece marcas, linhas e fornecedores. Na Aura Exotica, a venda termina no WhatsApp para que voce tire duvidas antes de fechar."],
          ["h2", "Desconfie de promessas absolutas"],
          ["p", "Preco muito abaixo do mercado, fotos genericas e ausencia de informacao sao sinais de alerta. Prefira atendimento transparente e produtos bem identificados."]
        ]
      },
      "edp-edt-parfum": {
        title: "EDP, EDT e Parfum: qual escolher?",
        date: "2026-04-30",
        body: [
          ["p", "EDT tende a ser mais leve, EDP equilibra presenca e versatilidade, e Parfum costuma trazer maior concentracao e profundidade."],
          ["p", "Para clima quente, frescos e especiados moderados funcionam melhor. Para noite, ambarados, oud e madeiras criam uma assinatura mais intensa."]
        ]
      }
    };
    const post = posts[slug] || posts["guia-perfume-arabe-original"];
    article.innerHTML = `
      <p class="eyebrow">Guia Aura</p>
      <h1>${post.title}</h1>
      <time datetime="${post.date}">${new Date(`${post.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</time>
      ${post.body.map(([tag, content]) => `<${tag}>${content}</${tag}>`).join("")}
      <div class="section-actions"><a class="btn btn-gold" href="catalogo.html">Ver perfumes arabes</a><a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent("Ola! Quero ajuda para escolher um perfume original.")}">Falar com especialista</a></div>
    `;
  }

  function showError(message) {
    const target = $("#catalog-grid") || $("#featured-grid") || $("#product-detail");
    if (target) target.innerHTML = `<div class="no-results">${message}</div>`;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    initGlobalComponents();
    await loadProducts();
    const page = document.body.dataset.page;
    if (page === "home") initHome();
    if (page === "catalogo") initCatalog();
    if (page === "produto") initProductDetail();
    if (page === "contato") initContact();
    if (page === "blog-post") initBlogPost();
  });
})();

