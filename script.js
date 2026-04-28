// Nexus Imports - interactions for homepage MVP
(function () {
  "use strict";

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

    function prevSlide() {
      updateSlider(current - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    if (prevBtn) prevBtn.addEventListener("click", prevSlide);

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        updateSlider(i);
      });
    });

    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);

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

  function initWhatsAppTracking() {
    var waButtons = document.querySelectorAll('a[href*="wa.me"]');
    if (!waButtons.length) return;

    waButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var payload = {
          event: "whatsapp_click",
          source: btn.classList.contains("float-whatsapp")
            ? "floating_button"
            : "inline",
          href: btn.getAttribute("href") || "",
        };

        if (typeof window.gtag === "function") {
          window.gtag("event", "whatsapp_click", payload);
        } else {
          // Fallback during MVP when GA4 isn't configured yet.
          console.log("track", payload);
        }
      });
    });
  }

  function initCatalogWhatsAppButtons() {
    var phone = "5511999999999";
    var buttons = document.querySelectorAll(".btn-add-cart");
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.textContent = "COMPRAR NO WHATSAPP";

      btn.addEventListener("click", function () {
        var card = btn.closest(".product-card");
        var titleEl = card ? card.querySelector(".product-title a") : null;
        var priceEl = card ? card.querySelector(".product-price") : null;
        var typeEl = card ? card.querySelector(".product-type") : null;

        var productName = titleEl ? titleEl.textContent.trim() : "Perfume";
        var productType = typeEl ? typeEl.textContent.trim() : "Perfume Árabe";
        var productPrice = priceEl
          ? priceEl.textContent.replace("$", "R$ ").trim()
          : "Consultar";

        var message = encodeURIComponent(
          "Olá! Tenho interesse no *" +
            productName +
            "* (" +
            productType +
            ").\n" +
            "Preço no site: " +
            productPrice +
            "\n\nEstá disponível para entrega?"
        );

        window.open("https://wa.me/" + phone + "?text=" + message, "_blank");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeroSlider();
    initMobileMenu();
    initWhatsAppTracking();
    initCatalogWhatsAppButtons();
  });
})();
