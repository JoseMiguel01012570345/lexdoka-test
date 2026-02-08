/**
 * Displays a temporary success toast notification at bottom-right of screen.
 * Animates in with slide-up + fade, stays for 1.8s, then animates out.
 * Uses fixed positioning to overlay page content.
 * Automatically removes DOM element after animation completes.
 * 
 * Animation sequence:
 * 1. Create element with opacity:0, translateY(8px)
 * 2. Append to DOM and force layout (offsetHeight read triggers reflow)
 * 3. Transition to opacity:1, translateY(0) - browser animates this
 * 4. After 1800ms, transition back to hidden state
 * 5. Remove element from DOM after animation completes
 * 
 * @param message Text to display in toast (default: "Guardado correctamente")
 */
export function _showSaveSuccess(message = "Guardado correctamente") {
    const id = `save-toast-${Date.now()}`;
    const toast = document.createElement("div");
    toast.id = id;
    toast.className = "lexdoka-save-toast";
    toast.textContent = message;
    
    // Apply styles for fixed position, animation, and blue color
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
    
    // Force browser reflow by reading offsetHeight, then CSS transition will animate
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    toast.offsetHeight;
    
    // Trigger animation by updating to final state
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    
    // After 1.8 seconds, start fade-out animation
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      // Remove from DOM after animation (240ms) completes + buffer
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }