// Exponer goTo en el scope global para que funcione el onclick del HTML
window.goTo = function (id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Si se activa un SW nuevo, recarga para tomar la última versión de index.html
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Evita bucles de recarga
    if (!window.__reloadedBySW) {
      window.__reloadedBySW = true;
      window.location.reload();
    }
  });
}
