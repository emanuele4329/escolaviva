const tokenAtv = sessionStorage.getItem("escolaVivaToken");
const userAtv = JSON.parse(sessionStorage.getItem("escolaVivaUser") || "null");
if (!tokenAtv || !userAtv || userAtv.tipo !== "aluno") location.href = "/login.html";
const headersAtv = { "Content-Type": "application/json", Authorization: `Bearer ${tokenAtv}` };
const list = document.getElementById("activityList");
const message = document.getElementById("activityMessage");
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("escolaVivaToken"); sessionStorage.removeItem("escolaVivaUser"); location.href = "/";
});
async function request(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...headersAtv, ...(options.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || "Não foi possível concluir.");
  return data;
}
async function carregarAtividades() {
  try {
    const [atividades, minhas] = await Promise.all([request("/api/atividades"), request("/api/inscricoes/minhas")]);
    list.replaceChildren();
    atividades.filter(a => a.ativa).forEach(a => {
      const card = document.createElement("article"); card.className = "experience-card";
      const emoji = document.createElement("div"); emoji.className = "card-emoji green"; emoji.textContent = "🌱";
      const title = document.createElement("h3"); title.textContent = a.titulo;
      const desc = document.createElement("p"); desc.textContent = a.descricao;
      const details = document.createElement("span"); details.className = "tag"; details.textContent = `${a.inscritos} de ${a.vagas} vagas • ${a.disciplinas}`;
      const btn = document.createElement("button"); btn.className = "btn"; btn.textContent = minhas.some(m => m.atividade_id === a.id) ? "Inscrito ✓" : "Inscrever-se";
      btn.disabled = minhas.some(m => m.atividade_id === a.id) || a.inscritos >= a.vagas;
      if (btn.disabled) btn.style.opacity = ".55";
      btn.addEventListener("click", async () => {
        try { await request("/api/inscricoes", { method: "POST", body: JSON.stringify({ atividade_id: a.id }) }); message.textContent = "Inscrição realizada!"; message.className = "message success"; carregarAtividades(); }
        catch (e) { message.textContent = e.message; message.className = "message error"; }
      });
      card.append(emoji, title, desc, details, btn); list.append(card);
    });
    const enroll = document.getElementById("myEnrollments"); enroll.replaceChildren();
    if (!minhas.length) enroll.textContent = "Você ainda não está inscrito em nenhuma atividade.";
    minhas.forEach(m => {
      const item = document.createElement("div"); item.className = "enrollment-item";
      const title = document.createElement("b"); title.textContent = m.titulo;
      const desc = document.createElement("span"); desc.textContent = m.descricao;
      item.append(title, desc); enroll.append(item);
    });
  } catch (error) { message.textContent = error.message; message.className = "message error"; }
}
carregarAtividades();
