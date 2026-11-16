const API = "/api";
function showMessage(text, type = "error") {
  const box = document.getElementById("formMessage");
  if (!box) return;
  box.textContent = text;
  box.className = `message ${type}`;
}

async function readApiResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { erro: response.ok ? "Resposta inválida do servidor." : `O servidor respondeu com erro (${response.status}).` };
  }
}
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  const tipo = document.getElementById("tipo");
  const turmaWrap = document.getElementById("turmaWrap");
  tipo.addEventListener("change", () => turmaWrap.style.display = tipo.value === "aluno" ? "block" : "none");
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (registerForm.dataset.submitting === "true") return;
    registerForm.dataset.submitting = "true";
    const submitButton = registerForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    const data = Object.fromEntries(new FormData(registerForm).entries());
    try {
      const response = await fetch(`${API}/auth/cadastro`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.erro || "Não foi possível realizar o cadastro.");
      showMessage(result.mensagem, "success");
      registerForm.reset();
      turmaWrap.style.display = "block";
    } catch (error) {
      showMessage(error.message);
    } finally {
      delete registerForm.dataset.submitting;
      if (submitButton) submitButton.disabled = false;
    }
  });
}
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (loginForm.dataset.submitting === "true") return;
    loginForm.dataset.submitting = "true";
    const submitButton = loginForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    const data = Object.fromEntries(new FormData(loginForm).entries());
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.erro || "Falha ao entrar.");
      sessionStorage.setItem("escolaVivaToken", result.token);
      sessionStorage.setItem("escolaVivaUser", JSON.stringify(result.usuario));
      location.href = result.usuario.tipo === "aluno" ? "/atividades.html" : "/painel.html";
    } catch (error) {
      showMessage(error.message);
    } finally {
      delete loginForm.dataset.submitting;
      if (submitButton) submitButton.disabled = false;
    }
  });
}
