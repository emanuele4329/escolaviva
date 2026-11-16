const token = sessionStorage.getItem("escolaVivaToken");
const user = JSON.parse(sessionStorage.getItem("escolaVivaUser") || "null");
if (!token || !user || !["admin","professor"].includes(user.tipo)) location.href = "/login.html";

const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
const $ = (id) => document.getElementById(id);
$("userName").textContent = user.nome;
$("welcomeName").textContent = user.nome.split(" ")[0];
$("userRole").textContent = user.tipo === "admin" ? "Administrador" : "Professor(a)";
$("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("escolaVivaToken"); sessionStorage.removeItem("escolaVivaUser"); location.href = "/";
});

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "Erro ao carregar dados.");
  return data;
}
function cell(value) { const td = document.createElement("td"); td.textContent = value ?? "—"; return td; }
function emptyRow(tbody, cols, text) { const tr = document.createElement("tr"); const td = cell(text); td.colSpan = cols; tr.append(td); tbody.replaceChildren(tr); }

async function carregar() {
  try {
    const [atividades, inscricoes, alunos] = await Promise.all([
      api("/api/atividades"), api("/api/inscricoes"), api("/api/alunos")
    ]);
    $("metricAlunos").textContent = alunos.length;
    $("metricAtividades").textContent = atividades.length;
    $("metricInscricoes").textContent = inscricoes.length;
    $("activityRows").replaceChildren();
    atividades.forEach(a => {
      const tr = document.createElement("tr");
      tr.append(cell(a.titulo), cell(`${a.inscritos} / ${a.vagas}`), cell(a.ativa ? "Ativa" : "Inativa"));
      $("activityRows").append(tr);
    });
    if (!atividades.length) emptyRow($("activityRows"), 3, "Nenhuma atividade cadastrada.");
    $("enrollmentRows").replaceChildren();
    inscricoes.slice(0, 30).forEach(i => {
      const tr = document.createElement("tr");
      tr.append(cell(i.aluno), cell(i.atividade), cell(i.turma || "—"));
      $("enrollmentRows").append(tr);
    });
    if (!inscricoes.length) emptyRow($("enrollmentRows"), 3, "Ainda não há inscrições.");
    $("studentRows").replaceChildren();
    alunos.forEach(a => {
      const tr = document.createElement("tr");
      tr.append(cell(a.nome), cell(a.email), cell(a.turma || "—"));
      const action = document.createElement("td");
      if (user.tipo === "admin") {
        const btn = document.createElement("button"); btn.className = "table-action"; btn.textContent = "Excluir";
        btn.addEventListener("click", () => excluirAluno(a.id)); action.append(btn);
      }
      tr.append(action); $("studentRows").append(tr);
    });
    if (!alunos.length) emptyRow($("studentRows"), 4, "Nenhum aluno cadastrado.");
    if (user.tipo === "admin") {
      const professores = await api("/api/professores");
      $("metricProfessores").textContent = professores.length;
      $("teacherRows").replaceChildren();
      professores.forEach(p => {
        const tr = document.createElement("tr");
        tr.append(cell(p.nome), cell(p.email));
        const action = document.createElement("td");
        if (p.aprovado) {
          action.textContent = "Aprovado";
        } else {
          const btn = document.createElement("button");
          btn.className = "table-action";
          btn.textContent = "Aprovar";
          btn.addEventListener("click", () => aprovarProfessor(p.id));
          action.append(btn);
        }
        tr.append(action); $("teacherRows").append(tr);
      });
      if (!professores.length) emptyRow($("teacherRows"), 3, "Nenhum professor cadastrado.");
    } else {
      $("metricProfessores").textContent = "—";
      $("teachersPanel").style.display = "none";
    }
  } catch (error) {
    if (error.message.includes("Sessão")) location.href = "/login.html";
    alert(error.message);
  }
}
async function aprovarProfessor(id) {
  try { await api(`/api/professores/${id}/aprovar`, { method: "POST" }); carregar(); }
  catch (error) { alert(error.message); }
}
async function excluirAluno(id) {
  if (!confirm("Tem certeza de que deseja excluir este cadastro? As inscrições do aluno também serão removidas.")) return;
  try { await api(`/api/alunos/${id}`, { method: "DELETE" }); carregar(); }
  catch (error) { alert(error.message); }
}
$("activityForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  data.vagas = Number(data.vagas);
  try {
    await api("/api/atividades", { method: "POST", body: JSON.stringify(data) });
    $("activityMessage").textContent = "Atividade adicionada com sucesso.";
    $("activityMessage").className = "message success";
    event.currentTarget.reset(); event.currentTarget.elements.vagas.value = 30; carregar();
  } catch (error) {
    $("activityMessage").textContent = error.message;
    $("activityMessage").className = "message error";
  }
});
carregar();
