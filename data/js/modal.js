window.HatchModal = {
  modal: null,
  title: null,
  message: null,
  confirmBtn: null,
  cancelBtn: null,
  onConfirm: null,
  initialized: false,

  init() {
    if (this.initialized) return true;

    this.modal = document.getElementById("confirmModal");
    this.title = document.getElementById("modalTitle");
    this.message = document.getElementById("modalMessage");
    this.confirmBtn = document.getElementById("modalConfirmBtn");
    this.cancelBtn = document.getElementById("modalCancelBtn");

    if (!this.modal || !this.title || !this.message || !this.confirmBtn || !this.cancelBtn) {
      console.error("Modal elements are missing.");
      return false;
    }

    this.confirmBtn.addEventListener("click", () => {
      if (typeof this.onConfirm === "function") {
        this.onConfirm();
      }

      this.close();
    });

    this.cancelBtn.addEventListener("click", () => {
      this.close();
    });

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.modal.classList.contains("active")) {
        this.close();
      }
    });

    this.initialized = true;
    return true;
  },

  open(options = {}) {
    if (!this.modal) {
      this.init();
    }

    if (!this.modal) {
      console.error("Modal is not initialized.");
      return false;
    }

    const {
      title = "Are you sure?",
      message = "This action cannot be undone.",
      confirmText = "Confirm",
      cancelText = "Cancel",
      confirmClass = "modal-btn-danger",
      onConfirm = null
    } = options;

    this.title.textContent = title;
    this.message.textContent = message;
    this.confirmBtn.textContent = confirmText;
    this.cancelBtn.textContent = cancelText;
    this.confirmBtn.className = "modal-btn " + confirmClass;
    this.onConfirm = onConfirm;

    this.modal.classList.add("active");
    this.modal.setAttribute("aria-hidden", "false");

    this.confirmBtn.focus();

    return true;
  },

  close() {
    if (!this.modal) return;

    this.modal.classList.remove("active");
    this.modal.setAttribute("aria-hidden", "true");
    this.onConfirm = null;
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.HatchModal.init();
  });
} else {
  window.HatchModal.init();
}
