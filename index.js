require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { initDatabase } = require("./database/banco");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "30kb" }));
app.use(express.urlencoded({ extended: false, limit: "30kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ erro: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente." })
});
app.use("/api", apiLimiter);
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/status", (_req, res) => res.json({ status: "online", app: "Escola Viva" }));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

async function iniciar() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
    console.error("ERRO: configure JWT_SECRET com pelo menos 24 caracteres.");
    process.exit(1);
  }
  await initDatabase();
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/alunos", require("./routes/alunoRoutes"));
  app.use("/api/atividades", require("./routes/atividadeRoutes"));
  app.use("/api/inscricoes", require("./routes/inscricaoRoutes"));
  app.use("/api/professores", require("./routes/professorRoutes"));
  app.use("/api", (_req, res) => res.status(404).json({ erro: "Rota da API não encontrada." }));
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ erro: "Erro interno do servidor." });
  });
  app.listen(PORT, "0.0.0.0", () => console.log(`Escola Viva disponível na porta ${PORT}`));
}

iniciar().catch(error => {
  console.error("Falha ao iniciar o Escola Viva:", error);
  process.exit(1);
});
