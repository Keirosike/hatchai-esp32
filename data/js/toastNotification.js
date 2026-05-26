window.HatchToast = {
  toast: null,
  timeoutId: null,
  initialized: false,

  init() {
    if (this.initialized) return true;

    this.toast =
      document.getElementById("hatchToast") ||
      document.querySelector(".toast");

    if (!this.toast) {
      this.toast = document.createElement("div");
      this.toast.id = "hatchToast";
      this.toast.className = "toast";
      this.toast.setAttribute("role", "status");
      this.toast.setAttribute("aria-live", "polite");
      document.body.appendChild(this.toast);
    }

    this.initialized = true;
    return true;
  },

  show(message, options = {}) {
    if (!this.toast) {
      this.init();
    }

    const {
      type = "info",
      duration = 2600
    } = options;

    window.clearTimeout(this.timeoutId);

    this.toast.className = "toast";
    this.toast.textContent = message;

    // Restart animation cleanly when another toast appears quickly
    this.toast.classList.remove("active");

    requestAnimationFrame(() => {
      this.toast.classList.add(type, "active");
    });

    this.timeoutId = window.setTimeout(() => {
      this.toast.classList.remove("active");
    }, duration);
  },

  success(message, duration = 2600) {
    this.show(message, {
      type: "success",
      duration
    });
  },

  danger(message, duration = 2600) {
    this.show(message, {
      type: "danger",
      duration
    });
  },

  warning(message, duration = 2600) {
    this.show(message, {
      type: "warning",
      duration
    });
  },

  info(message, duration = 2600) {
    this.show(message, {
      type: "info",
      duration
    });
  },

  hide() {
    if (!this.toast) return;

    window.clearTimeout(this.timeoutId);
    this.toast.classList.remove("active");
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.HatchToast.init();
  });
} else {
  window.HatchToast.init();
}