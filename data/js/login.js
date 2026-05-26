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
    return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
  }

  loginForm.addEventListener("submit", event => {
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

    showStatus("Login successful. Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  });
});