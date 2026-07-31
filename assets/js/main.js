(function () {
  "use strict";

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
      });
    });
  }

  // Role tabs
  var tabs = document.querySelectorAll(".role-tab");
  var panels = document.querySelectorAll(".role-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var id = tab.getAttribute("data-role");
      tabs.forEach(function (t) {
        t.classList.toggle("active", t === tab);
      });
      panels.forEach(function (p) {
        p.classList.toggle("active", p.id === "role-" + id);
      });
    });
  });

  // Screenshot lightbox — prefer full-resolution asset
  var box = document.querySelector(".lightbox");
  var boxImg = box ? box.querySelector(".lightbox-stage img") : null;
  var boxRaw = document.getElementById("lightbox-open-raw");
  var boxLabel = document.getElementById("lightbox-label");

  function openLightbox(src, alt) {
    if (!box || !boxImg) return;
    var full = src;
    // Prefer /full/ path when available
    if (src.indexOf("/full/") === -1 && src.indexOf("assets/images/") !== -1) {
      full = src.replace("assets/images/", "assets/images/full/");
    }
    boxImg.src = full;
    boxImg.alt = alt || "";
    if (boxRaw) {
      boxRaw.href = full;
    }
    if (boxLabel) {
      boxLabel.textContent = alt || "Full resolution preview (scroll to pan)";
    }
    box.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!box) return;
    box.classList.remove("open");
    if (boxImg) boxImg.src = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".shot-frame, .hero-shot img").forEach(function (el) {
    el.addEventListener("click", function (e) {
      // Allow ctrl/cmd-click or middle-click to open raw in new tab
      if (e.metaKey || e.ctrlKey || e.button === 1) return;
      e.preventDefault();
      var img = el.tagName === "IMG" ? el : el.querySelector("img");
      if (!img) return;
      var full = el.getAttribute("data-full") || img.getAttribute("src");
      openLightbox(full, img.getAttribute("alt") || "");
    });
  });

  if (box) {
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lightbox-close")) {
        closeLightbox();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  // Year
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
