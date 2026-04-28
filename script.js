(function () {
  "use strict";

  var WHATSAPP_PHONE = "5511999999999";
  var PRODUCTS_SOURCE = "matches-100-images-urls.json";
  var productsCache = [];

  function slugify(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function parseProduct(raw) {
    var split = raw.full_name.split(" - ");
    var brand = split[0] || "";
    var name = split.slice(1).join(" - ") || raw.full_name;
    return {
      id: slugify(raw.full_name),
      rank: raw.rank,
      fullName: raw.full_name,
      brand: brand,
      name: name,
      image: raw.image_url,
      price: "Consultar",
      productUrl: raw.product_url,
    };
  }

  function fetchProducts() {
    if (productsCache.length) {
      return Promise.resolve(productsCache);
    }
    return fetch(PRODUCTS_SOURCE)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        productsCache = data.map(parseProduct);
        return productsCache;
      })
      .catch(function () {
        productsCache = [];
        return productsCache;
      });
  }

  function createWhatsAppUrl(product) {
    var text = encodeURIComponent(
      "Olá! Tenho interesse no *" +
        product.name +
        "* (" +
        product.brand +
        ").\nProduto: " +
        product.productUrl +
        "\nEstá disponível?"
    );
    return "https://wa.me/" + WHATSAPP_PHONE + "?text=" + text;
  }

  function productCardMarkup(product) {
    return (
      '<div class="product-card">' +
      '  <div class="product-image">' +
      '    <a href="produto.html?id=' + product.id + '">' +
      '      <img src="' + product.image + '" alt="' + product.name + '" loading="lazy">' +
      "    </a>" +
      "  </div>" +
      '  <div class="product-info">' +
      '    <p class="product-type">' + product.brand + "</p>" +
      '    <h3 class="product-title"><a href="produto.html?id=' + product.id + '">' + product.name + "</a></h3>" +
      '    <p class="product-price">' + product.price + "</p>" +
      '    <a class="btn-add-cart" target="_blank" href="' + createWhatsAppUrl(product) + '">Comprar no WhatsApp</a>' +
      "  </div>" +
      "</div>"
    );
  }

  function initHeroSlider() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) return;

    var slides = slider.querySelectorAll(".slide");
    var dots = slider.querySelectorAll(".dot");
    var prevBtn = slider.querySelector(".slider-prev");
    var nextBtn = slider.querySelector(".slider-next");
    var wrapper = slider.querySelector(".slider-wrapper");
    var current = 0;
    var timer = null;

    if (!slides.length || !wrapper) return;

    function updateSlider(index) {
      current = (index + slides.length) % slides.length;
      wrapper.style.transform = "translateX(-" + current * 100 + "%)";
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function nextSlide() {
      updateSlider(current + 1);
    }

    function startAutoplay() {
      if (timer) clearInterval(timer);
      timer = setInterval(nextSlide, 5000);
    }

    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    if (prevBtn) prevBtn.addEventListener("click", function () {
      updateSlider(current - 1);
    });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        updateSlider(i);
      });
    });

    updateSlider(0);
    startAutoplay();
  }

  function initMobileMenu() {
    var nav = document.querySelector(".main-nav");
    var toggle = document.querySelector(".mobile-menu-toggle");
    if (!nav || !toggle) return;
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function initHome(products) {
    var container = document.getElementById("homeProducts");
    if (!container) return;
    container.innerHTML = products.slice(0, 8).map(productCardMarkup).join("");

    var homeInput = document.getElementById("homeSearchInput");
    var homeButton = document.getElementById("homeSearchButton");
    function goSearch() {
      var query = homeInput ? homeInput.value.trim() : "";
      window.location.href = "catalogo.html?q=" + encodeURIComponent(query);
    }
    if (homeButton) homeButton.addEventListener("click", goSearch);
    if (homeInput) {
      homeInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          goSearch();
        }
      });
    }
  }

  function getQueryParam(param) {
    var url = new URL(window.location.href);
    return url.searchParams.get(param) || "";
  }

  function initCatalog(products) {
    var grid = document.getElementById("catalogProducts");
    var pagination = document.getElementById("catalogPagination");
    var chips = document.getElementById("catalogBrandChips");
    if (!grid || !pagination) return;

    var currentPage = 1;
    var pageSize = 12;
    var selectedBrand = "";
    var q = getQueryParam("q").toLowerCase();

    var brands = Array.from(new Set(products.map(function (p) { return p.brand; }))).sort();
    if (chips) {
      chips.innerHTML =
        '<button class="chip active" data-brand="">Todos</button>' +
        brands.map(function (b) {
          return '<button class="chip" data-brand="' + b + '">' + b + "</button>";
        }).join("");
      chips.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          chips.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          selectedBrand = chip.getAttribute("data-brand") || "";
          currentPage = 1;
          renderCatalog();
        });
      });
    }

    function filterProducts() {
      return products.filter(function (p) {
        var byBrand = !selectedBrand || p.brand === selectedBrand;
        var byQuery = !q || p.fullName.toLowerCase().indexOf(q) >= 0;
        return byBrand && byQuery;
      });
    }

    function renderCatalog() {
      var filtered = filterProducts();
      var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      var start = (currentPage - 1) * pageSize;
      var pageItems = filtered.slice(start, start + pageSize);
      grid.innerHTML = pageItems.map(productCardMarkup).join("");

      var pages = "";
      pages += '<button class="page-btn" data-page="' + Math.max(1, currentPage - 1) + '">Anterior</button>';
      for (var i = 1; i <= totalPages; i++) {
        pages += '<button class="page-btn ' + (i === currentPage ? "active" : "") + '" data-page="' + i + '">' + i + "</button>";
      }
      pages += '<button class="page-btn" data-page="' + Math.min(totalPages, currentPage + 1) + '">Próxima</button>';
      pagination.innerHTML = pages;

      pagination.querySelectorAll(".page-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          currentPage = Number(btn.getAttribute("data-page"));
          renderCatalog();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
    }

    var input = document.getElementById("catalogSearchInput");
    var button = document.getElementById("catalogSearchButton");
    if (input) {
      input.value = getQueryParam("q");
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          window.location.href = "catalogo.html?q=" + encodeURIComponent(input.value.trim());
        }
      });
    }
    if (button && input) {
      button.addEventListener("click", function () {
        window.location.href = "catalogo.html?q=" + encodeURIComponent(input.value.trim());
      });
    }

    renderCatalog();
  }

  function initProductDetail(products) {
    var wrap = document.getElementById("productDetail");
    var related = document.getElementById("relatedProducts");
    if (!wrap) return;

    var id = getQueryParam("id");
    var product = products.find(function (p) { return p.id === id; }) || products[0];
    if (!product) return;

    wrap.innerHTML =
      '<div class="product-detail-image"><img src="' + product.image + '" alt="' + product.name + '"></div>' +
      '<div class="product-detail-info">' +
      '<p class="product-type">' + product.brand + "</p>" +
      "<h1>" + product.name + "</h1>" +
      '<p class="product-price">Preço sob consulta</p>' +
      '<p>Produto selecionado com base nos mais vendidos. Atendimento e fechamento via WhatsApp.</p>' +
      '<a class="btn-story" target="_blank" href="' + createWhatsAppUrl(product) + '">Comprar no WhatsApp</a>' +
      "</div>";

    if (related) {
      related.innerHTML = products
        .filter(function (p) { return p.brand === product.brand && p.id !== product.id; })
        .slice(0, 4)
        .map(productCardMarkup)
        .join("");
    }
  }

  function initBlog() {
    var wrap = document.getElementById("blogPosts");
    if (!wrap) return;
    var posts = [
      { title: "Como identificar perfume árabe original", excerpt: "Checklist rápido para comprar com segurança.", date: "Abr 2026" },
      { title: "Lattafa: melhores perfumes para começar", excerpt: "Seleção prática para masculino, feminino e unissex.", date: "Abr 2026" },
      { title: "Perfume doce ou amadeirado? Guia rápido", excerpt: "Entenda perfis olfativos antes de comprar.", date: "Abr 2026" },
      { title: "Top fragrâncias árabes de alta fixação", excerpt: "Modelos que se destacam em performance.", date: "Abr 2026" },
      { title: "Diferença entre EDP, EDT e Extrait", excerpt: "Escolha certa para cada ocasião e clima.", date: "Abr 2026" }
    ];
    wrap.innerHTML = posts.map(function (post) {
      return (
        '<article class="blog-card">' +
        "<h3>" + post.title + "</h3>" +
        "<p>" + post.excerpt + "</p>" +
        '<span class="blog-date">' + post.date + "</span>" +
        "</article>"
      );
    }).join("");
  }

  function initTracking() {
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (typeof window.gtag === "function") {
          window.gtag("event", "whatsapp_click", { href: btn.getAttribute("href") || "" });
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeroSlider();
    initMobileMenu();
    initTracking();

    fetchProducts().then(function (products) {
      var page = document.body.getAttribute("data-page");
      if (page === "home") initHome(products);
      if (page === "catalogo") initCatalog(products);
      if (page === "produto") initProductDetail(products);
      if (page === "blog") initBlog();
    });
  });
})();
