/**
 * AURA EXÓTICA — script.js v2.0
 * Compatível com products.json v2 (installments como array de objetos)
 * Módulos: Core, Home, Catalog, ProductDetail, Analytics
 */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const AE = {
  PHONE:       '5511999999999',    // ← Substituir pelo número real
  WA_DEFAULT:  'Olá! Vim pelo site da Aura Exótica e quero conhecer os perfumes.',
  DATA_URL:    '/data/products.json',
  PAGE_SIZE:   12,
  BRANDS: [
    'Armaf','Lattafa','Al Wataniah','Rasasi','Afnan','Mawwal',
    'French Avenue','Stella Dustin','Aurora Scents','Maison Alhambra',
    'Orientica','Paris Corner','Anfar','Rayhaan','Khadlaj','Zimaya',
    'Rue Broca','Riiffs','Maison Asrar','Maryaj','Al Haramain',
    'Al Ambra','Afnan'
  ],
};

/* ============================================================
   STATE
   ============================================================ */
const State = {
  products: [],       // all loaded products
  filtered: [],       // after filters applied
  page: 1,
  loading: false,
  filters: {
    search:  '',
    brand:   '',
    gender:  '',
    category: '',
    sort:    'rank',
    priceMax: Infinity,
  },
};

/* ============================================================
   1. DATA LAYER
   ============================================================ */
async function loadProducts() {
  if (State.products.length) return State.products;
  try {
    const res = await fetch(AE.DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    State.products = await res.json();
    return State.products;
  } catch (err) {
    console.error('[AE] Falha ao carregar products.json:', err);
    return [];
  }
}

/* ============================================================
   2. HELPERS
   ============================================================ */
function formatPrice(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function getInstallmentLabel(installments, qty = 3) {
  if (!Array.isArray(installments)) {
    // fallback: scalar
    const v = installments;
    return `${qty}x de R$ ${formatPrice(v / qty)}`;
  }
  const match = installments.find(i => i.qty === qty)
             || installments[installments.length - 1];
  if (!match) return '';
  return `${match.qty}x de R$ ${formatPrice(match.value)}`;
}

function getBestInstallment(installments) {
  if (!Array.isArray(installments)) return null;
  return installments[installments.length - 1] || null;
}

function generateWALink(product, source = 'catalog') {
  const gMap = { M: 'Masculino', F: 'Feminino', U: 'Unissex' };
  const gender = gMap[product.gender] || product.gender;
  const best = getBestInstallment(product.installments);
  const installInfo = best
    ? `ou ${best.qty}x de R$ ${formatPrice(best.value)}`
    : '';

  const topNotes = (product.notes?.top || []).slice(0, 3).join(', ');
  const text = encodeURIComponent(
    `Olá! Tenho interesse no *${product.name}* (${product.brand})\n` +
    `💰 R$ ${formatPrice(product.price)} ${installInfo}\n` +
    `📦 ${product.volume_ml}ml · ${product.concentration}\n` +
    `👤 ${gender}\n` +
    `✨ Notas: ${topNotes}\n\n` +
    `Está disponível? Qual o prazo de entrega?`
  );
  return `https://wa.me/${AE.PHONE}?text=${text}`;
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getProductById(id) {
  return State.products.find(p => p.id === id) || null;
}

function getProductFromURL() {
  const params = new URLSearchParams(location.search);
  return params.get('id') || null;
}

/* ============================================================
   3. CARD RENDERER
   ============================================================ */
function renderCard(product, index = 0) {
  const badge = product.badge;
  const badgeHTML = badge ? (() => {
    const cls = badge === 'hot'    ? 'product-badge--hot'
              : badge === 'new'    ? 'product-badge--new'
              : badge === 'launch' ? 'product-badge--launch' : '';
    const label = badge === 'hot'    ? '🔥 Mais Vendido'
                : badge === 'new'    ? 'Novo'
                : badge === 'launch' ? 'Lançamento' : badge;
    return `<span class="product-badge ${cls}">${label}</span>`;
  })() : '';

  const gLabel = { M: 'M', F: 'F', U: 'U' }[product.gender] || '';
  const notes = (product.notes?.top || []).slice(0, 3);
  const notesHTML = notes.map(n => `<span class="note-chip">${n}</span>`).join('');
  const best = getBestInstallment(product.installments);
  const installHTML = best
    ? `<span class="product-card__installments">${best.qty}x de<br>R$ ${formatPrice(best.value)}</span>`
    : '';

  const delay = (index % 4) * 0.07;

  return `
    <div
      class="product-card"
      data-id="${product.id}"
      style="transition-delay:${delay}s"
    >
      <div class="product-card__image-wrap">
        <img
          class="product-card__img"
          src="${product.image}"
          alt="${product.name} - ${product.brand}"
          loading="${index < 8 ? 'eager' : 'lazy'}"
          decoding="async"
          onerror="this.style.opacity='0'"
        />
        ${badgeHTML}
        ${gLabel ? `<div class="product-gender">${gLabel}</div>` : ''}
      </div>

      <div class="product-card__info">
        <div class="product-card__brand">${product.brand}</div>
        <h3 class="product-card__name">${product.name}</h3>
        <div class="product-card__notes">${notesHTML}</div>
        <div class="product-card__price-row">
          <span class="product-card__price">R$ ${formatPrice(product.price)}</span>
          ${installHTML}
        </div>
      </div>

      <a
        href="${generateWALink(product, 'card')}"
        class="product-card__wa"
        target="_blank"
        rel="noopener noreferrer"
        data-wa-product="${product.id}"
        onclick="AE.trackWA('${product.id}', 'card')"
      >
        ${WA_SVG}
        Comprar no WhatsApp
      </a>
    </div>
  `;
}

const WA_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

/* ============================================================
   4. SCROLL REVEAL (IntersectionObserver)
   ============================================================ */
let _revealObserver = null;

function initReveal() {
  if (_revealObserver) _revealObserver.disconnect();

  _revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        _revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal, .product-card').forEach(el => {
    _revealObserver.observe(el);
  });
}

/* ============================================================
   5. HEADER
   ============================================================ */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let ticking = false;
  const threshold = 60;

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > threshold);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link, .mobile-menu__link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Hamburger / mobile menu
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ============================================================
   6. HOME PAGE
   ============================================================ */
async function initHome() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  await loadProducts();

  // Show top 12 by rank
  const featured = [...State.products]
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .slice(0, 12);

  grid.innerHTML = featured.map((p, i) => renderCard(p, i)).join('');

  requestAnimationFrame(() => initReveal());
}

/* ============================================================
   7. CATALOG PAGE
   ============================================================ */
async function initCatalog() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  await loadProducts();
  State.filtered = [...State.products];

  // Populate brand dropdown
  const brandSel = document.getElementById('filterBrand');
  if (brandSel) {
    const brands = [...new Set(State.products.map(p => p.brand))].sort();
    brands.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b; opt.textContent = b;
      brandSel.appendChild(opt);
    });
  }

  // Bind filters
  _bindFilterEvents();

  // First render
  _applyFilters();
}

function _bindFilterEvents() {
  const ids = ['filterBrand', 'filterGender', 'filterCategory', 'filterSort', 'filterSearch'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      State.filters.brand    = document.getElementById('filterBrand')?.value    || '';
      State.filters.gender   = document.getElementById('filterGender')?.value   || '';
      State.filters.category = document.getElementById('filterCategory')?.value || '';
      State.filters.sort     = document.getElementById('filterSort')?.value     || 'rank';
      State.filters.search   = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
      State.page = 1;
      _applyFilters();
    });
  });

  // Gender chips
  document.querySelectorAll('.filter-chip[data-gender]').forEach(chip => {
    chip.addEventListener('click', () => {
      const active = chip.classList.contains('active');
      document.querySelectorAll('.filter-chip[data-gender]').forEach(c => c.classList.remove('active'));
      if (!active) chip.classList.add('active');
      State.filters.gender = active ? '' : chip.dataset.gender;
      State.page = 1;
      _applyFilters();
    });
  });

  // Load more
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      State.page++;
      _renderPage(false);
    });
  }
}

function _applyFilters() {
  const { search, brand, gender, category, sort } = State.filters;

  State.filtered = State.products.filter(p => {
    if (brand    && p.brand !== brand)                              return false;
    if (gender   && p.gender !== gender)                           return false;
    if (category && !(p.category || []).includes(category))        return false;
    if (search) {
      const hay = `${p.name} ${p.brand} ${(p.notes?.top||[]).join(' ')} ${(p.category||[]).join(' ')}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  // Sort
  State.filtered.sort((a, b) => {
    switch (sort) {
      case 'price_asc':  return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'name':       return a.name.localeCompare(b.name, 'pt-BR');
      case 'rank':
      default:           return (a.rank || 999) - (b.rank || 999);
    }
  });

  State.page = 1;
  _renderPage(true);
  _updateResultsCount();
}

function _renderPage(reset = true) {
  const grid = document.getElementById('catalogGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!grid) return;

  const start = 0;
  const end   = State.page * AE.PAGE_SIZE;
  const slice = State.filtered.slice(start, end);

  if (reset) {
    if (slice.length === 0) {
      grid.innerHTML = `
        <div class="products-empty">
          <div class="products-empty__icon">🔍</div>
          <p class="products-empty__title">Nenhum perfume encontrado</p>
          <p>Tente ajustar os filtros ou <a href="#" onclick="clearFilters()" style="color:var(--gold)">limpar a busca</a>.</p>
        </div>`;
    } else {
      grid.innerHTML = slice.map((p, i) => renderCard(p, i)).join('');
    }
  } else {
    // append new cards
    const existing = grid.querySelectorAll('.product-card').length;
    const newSlice = State.filtered.slice(existing, end);
    grid.insertAdjacentHTML('beforeend', newSlice.map((p, i) => renderCard(p, existing + i)).join(''));
  }

  // Load more visibility
  if (loadMoreBtn) {
    const hasMore = end < State.filtered.length;
    loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
    const remaining = State.filtered.length - end;
    loadMoreBtn.textContent = hasMore
      ? `Carregar mais (${remaining} restantes)`
      : '';
  }

  requestAnimationFrame(() => initReveal());
}

function _updateResultsCount() {
  const el = document.getElementById('resultsCount');
  if (el) {
    el.innerHTML = `<strong>${State.filtered.length}</strong> perfumes encontrados`;
  }
}

window.clearFilters = function () {
  ['filterBrand','filterGender','filterCategory','filterSort','filterSearch'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'filterSort' ? 'rank' : '';
  });
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  State.filters = { search:'', brand:'', gender:'', category:'', sort:'rank', priceMax: Infinity };
  State.page = 1;
  _applyFilters();
};

/* ============================================================
   8. PRODUCT DETAIL PAGE
   ============================================================ */
async function initProductDetail() {
  const container = document.getElementById('productDetail');
  if (!container) return;

  await loadProducts();

  const id = getProductFromURL();
  const product = id ? getProductById(id) : null;

  if (!product) {
    container.innerHTML = `
      <div class="products-empty" style="padding:80px 24px">
        <div class="products-empty__icon">😔</div>
        <p class="products-empty__title">Produto não encontrado</p>
        <a href="catalogo.html" class="btn btn--primary" style="margin-top:24px;display:inline-flex">Ver Catálogo</a>
      </div>`;
    return;
  }

  // SEO
  document.title = `${product.name} - ${product.brand} | Aura Exótica`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', product.description);

  // Render
  const gMap = { M: 'Masculino', F: 'Feminino', U: 'Unissex' };
  const gender = gMap[product.gender] || '';
  const best = getBestInstallment(product.installments);

  const topN    = (product.notes?.top    || []).map(n => `<span class="pyramid__note">${n}</span>`).join('');
  const heartN  = (product.notes?.heart  || []).map(n => `<span class="pyramid__note">${n}</span>`).join('');
  const baseN   = (product.notes?.base   || []).map(n => `<span class="pyramid__note">${n}</span>`).join('');

  const categories = (product.category || []).map(c =>
    `<span class="meta-chip">${c}</span>`
  ).join('');

  const badgeHTML = product.badge ? (() => {
    const label = product.badge === 'hot' ? '🔥 Mais Vendido'
                : product.badge === 'new' ? 'Novo'
                : 'Lançamento';
    return `<span class="product-badge product-badge--${product.badge}">${label}</span>`;
  })() : '';

  container.innerHTML = `
    <div class="product-detail__breadcrumb">
      <a href="index.html">Home</a>
      <span>›</span>
      <a href="catalogo.html">Catálogo</a>
      <span>›</span>
      <span>${product.brand}</span>
      <span>›</span>
      <span>${product.name}</span>
    </div>

    <div class="product-detail__grid">
      <!-- Gallery -->
      <div>
        <div class="product-gallery__main">
          <img
            src="${product.image}"
            alt="${product.name} - ${product.brand}"
            loading="eager"
            decoding="async"
          />
        </div>
        ${badgeHTML}
      </div>

      <!-- Info -->
      <div>
        <p class="product-info__brand">${product.brand}</p>
        <h1 class="product-info__name">${product.name}</h1>

        <div class="product-info__meta">
          ${categories}
          <span class="meta-chip">${product.volume_ml}ml</span>
          <span class="meta-chip">${product.concentration}</span>
          <span class="meta-chip">${gender}</span>
          <span class="meta-chip">${product.origin || 'Oriente Médio'}</span>
        </div>

        <div class="product-info__price-block">
          <div class="product-info__price">R$ ${formatPrice(product.price)}</div>
          ${best ? `<div class="product-info__installments">ou <strong>${best.qty}x de R$ ${formatPrice(best.value)}</strong> sem juros</div>` : ''}
        </div>

        <div class="pyramid">
          <div class="pyramid__title">Pirâmide Olfativa</div>
          <div class="pyramid__grid">
            <div>
              <div class="pyramid__column-label">🎵 Topo</div>
              <div class="pyramid__notes">${topN}</div>
            </div>
            <div>
              <div class="pyramid__column-label">💫 Coração</div>
              <div class="pyramid__notes">${heartN}</div>
            </div>
            <div>
              <div class="pyramid__column-label">🌑 Base</div>
              <div class="pyramid__notes">${baseN}</div>
            </div>
          </div>
        </div>

        <p class="product-info__description">${product.description}</p>

        <a
          href="${generateWALink(product, 'detail')}"
          class="btn btn--wa btn--lg btn--full"
          target="_blank"
          rel="noopener noreferrer"
          onclick="AE.trackWA('${product.id}', 'detail')"
        >
          ${WA_SVG}
          Comprar no WhatsApp
        </a>
      </div>
    </div>

    <!-- Related -->
    <div style="margin-top:80px">
      <div class="section-header">
        <div class="section-header__left">
          <span class="label label--left">Descubra mais</span>
          <h2 class="section-title">Você também pode <em>gostar</em></h2>
        </div>
      </div>
      <div class="products-grid" id="relatedGrid"></div>
    </div>
  `;

  // Related: same brand or category, exclude current
  const related = State.products
    .filter(p => p.id !== product.id && (
      p.brand === product.brand ||
      (p.category || []).some(c => (product.category || []).includes(c))
    ))
    .slice(0, 8);

  const relatedGrid = document.getElementById('relatedGrid');
  if (relatedGrid && related.length) {
    relatedGrid.innerHTML = related.map((p, i) => renderCard(p, i)).join('');
  }

  // Fixed bottom CTA (mobile)
  const fixedCTA = document.getElementById('productCtaFixed');
  if (fixedCTA) {
    fixedCTA.innerHTML = `
      <a href="${generateWALink(product, 'fixed_cta')}"
         class="btn btn--wa btn--full"
         target="_blank" rel="noopener"
         onclick="AE.trackWA('${product.id}', 'fixed_cta')">
        ${WA_SVG} Comprar — R$ ${formatPrice(product.price)}
      </a>`;
  }

  requestAnimationFrame(() => initReveal());

  // JSON-LD
  _injectProductSchema(product);
}

function _injectProductSchema(p) {
  const best = getBestInstallment(p.installments);
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": p.name,
    "image": p.image,
    "description": p.description,
    "brand": { "@type": "Brand", "name": p.brand },
    "offers": {
      "@type": "Offer",
      "url": location.href,
      "priceCurrency": "BRL",
      "price": p.price.toFixed(2),
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Aura Exótica Perfumes & Cosméticos"
      }
    }
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

/* ============================================================
   9. ANALYTICS (GA4)
   ============================================================ */
AE.trackWA = function (productId, source) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'whatsapp_click', {
      event_category: 'conversion',
      event_label: productId,
      source,
      product_id: productId,
    });
  }
};

AE.trackFilter = function (type, value) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'apply_filter', { filter_type: type, filter_value: value });
  }
};

AE.trackPageView = function (page) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', { page_title: document.title, page_path: page });
  }
};

/* ============================================================
   10. ROUTER — auto-detect page and init
   ============================================================ */
function detectPage() {
  const path = location.pathname.split('/').pop() || 'index.html';
  if (path === '' || path === 'index.html')   return 'home';
  if (path === 'catalogo.html')               return 'catalog';
  if (path === 'produto.html')                return 'detail';
  if (path === 'blog.html')                   return 'blog';
  if (path === 'sobre.html')                  return 'about';
  if (path === 'contato.html')                return 'contact';
  return 'unknown';
}

document.addEventListener('DOMContentLoaded', async () => {
  // Always init header
  initHeader();

  // Always init reveal observer for static elements
  requestAnimationFrame(() => initReveal());

  // Page-specific
  const page = detectPage();
  switch (page) {
    case 'home':    await initHome();          break;
    case 'catalog': await initCatalog();       break;
    case 'detail':  await initProductDetail(); break;
  }

  AE.trackPageView(location.pathname);
});

/* ============================================================
   11. PRODUCT CARD CLICK → DETAIL PAGE
   ============================================================ */
document.addEventListener('click', e => {
  const card = e.target.closest('.product-card');
  if (!card) return;
  if (e.target.closest('.product-card__wa')) return; // WA link handles itself

  const id = card.dataset.id;
  if (id) {
    location.href = `produto.html?id=${id}`;
  }
});
