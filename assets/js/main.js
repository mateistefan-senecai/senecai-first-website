// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");
if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Services tabs
document.querySelectorAll("[data-tabs]").forEach((tabsRoot) => {
  const buttons = tabsRoot.querySelectorAll(".tab-btn");
  const panels = tabsRoot.querySelectorAll(".tab-panel");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      buttons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      panels.forEach((panel) => {
        if (panel.id === targetId) {
          panel.hidden = false;
          panel.classList.add("is-active");
        } else {
          panel.hidden = true;
          panel.classList.remove("is-active");
        }
      });
    });
  });
});

// FAQ accordion
document.querySelectorAll("[data-accordion] .accordion-item").forEach((item) => {
  const trigger = item.querySelector(".accordion-trigger");
  trigger.addEventListener("click", () => {
    const isActive = item.classList.contains("is-active");
    item.classList.toggle("is-active", !isActive);
    trigger.setAttribute("aria-expanded", String(!isActive));
  });
});

// Language toggle (visual only — RO copy not yet implemented)
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".lang-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    if (btn.textContent.trim() === "RO") {
      alert("Romanian translation isn't wired up yet — this toggle is a visual placeholder for now.");
    }
  });
});
