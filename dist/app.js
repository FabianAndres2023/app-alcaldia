// Cambiar entre pantallas
window.goTo = function (id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Botones con data-target
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      window.goTo(target);
    });
  });
});

// Si se activa un SW nuevo, recarga para tomar la última versión
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!window.__reloadedBySW) {
      window.__reloadedBySW = true;
      window.location.reload();
    }
  });
}