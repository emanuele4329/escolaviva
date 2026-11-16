const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../database/banco");

function cadastrar(req, res) {
  const { nome, email, senha, tipo, turma } = req.body;
  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: "Preencha nome, e-mail, senha e tipo de cadastro." });
  }
  if (!["aluno", "professor"].includes(tipo)) {
    return res.status(400).json({ erro: "Tipo de cadastro inválido." });
  }
  if (String(nome).trim().length < 3 || String(nome).length > 100) {
    return res.status(400).json({ erro: "Informe um nome entre 3 e 100 caracteres." });
  }
  const emailNormalizado = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
    return res.status(400).json({ erro: "Informe um e-mail válido." });
  }
  if (String(senha).length < 8 || String(senha).length > 100) {
    return res.status(400).json({ erro: "A senha deve ter pelo menos 8 caracteres." });
  }
  try {
    const hash = bcrypt.hashSync(senha, 12);
    const info = db.prepare(
      "INSERT INTO usuarios (nome,email,senha,tipo,turma,aprovado) VALUES (?,?,?,?,?,?)"
    ).run(String(nome).trim(), emailNormalizado, hash, tipo,
      tipo === "aluno" ? String(turma || "").trim().slice(0,40) : null,
      tipo === "professor" ? 0 : 1);
    return res.status(201).json({ mensagem: "Cadastro realizado! Agora você pode entrar.", id: info.lastInsertRowid });
  } catch (err) {
    if (String(err.code).includes("SQLITE_CONSTRAINT_UNIQUE")) {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }
    throw err;
  }
}

function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: "Informe e-mail e senha." });

  const usuario = db.prepare("SELECT * FROM usuarios WHERE email = ? COLLATE NOCASE")
    .get(String(email).trim());
  if (!usuario || !bcrypt.compareSync(String(senha), usuario.senha)) {
    return res.status(401).json({ erro: "E-mail ou senha incorretos." });
  }
  if (usuario.tipo === "professor" && usuario.aprovado !== 1) {
    return res.status(403).json({ erro: "Seu cadastro de professor aguarda aprovação do administrador." });
  }

  const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ mensagem: "Login realizado.", token, usuario: payload });
}

module.exports = { cadastrar, login };
