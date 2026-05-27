document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const statusMessage = document.getElementById("status");

  const DEFAULT_USERNAME = "admin";
  const DEFAULT_PASSWORD = "1234";

  if (!loginForm || !usernameInput || !passwordInput || !statusMessage) {
    return;
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = "status " + type;
  }

  function clearStatus() {
    statusMessage.textContent = "";
    statusMessage.className = "status";
  }

  function validateLogin(username, password) {
    const savedAccount = window.HatchStorage?.get("hatchaiAccount", null);
    const savedPassword = window.HatchStorage?.get("hatchaiPassword", null);
    const validUsername = savedAccount?.username || DEFAULT_USERNAME;
    const validPassword = savedPassword || DEFAULT_PASSWORD;

    return username === validUsername && password === validPassword;
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    clearStatus();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showStatus("Please fill all fields.", "error");
      return;
    }

    if (!validateLogin(username, password)) {
      showStatus("Invalid username or password.", "error");
      return;
    }

    const session = await window.HatchAuthSession.start(username);

    if (!session.ok) {
      showStatus(session.message, "error");
      return;
    }

    showStatus("Login successful. Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  });
});
