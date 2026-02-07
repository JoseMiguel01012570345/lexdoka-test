export function _showSaveSuccess(message = "Guardado correctamente") {
    const id = `save-toast-${Date.now()}`;
    const toast = document.createElement("div");
    toast.id = id;
    toast.className = "lexdoka-save-toast";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      right: "1rem",
      bottom: "1rem",
      background: "rgba(13,110,253,0.95)",
      color: "#fff",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: "2000",
      opacity: "0",
      transition: "opacity 240ms ease-in-out, transform 240ms ease-in-out",
      transform: "translateY(8px)",
      fontSize: "0.9rem",
    });
    document.body.appendChild(toast);
    // force layout then show
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    toast.offsetHeight;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }