const { db } = require("../database/banco");

function listar(_req, res) {
  res.json(db.prepare(
    "SELECT id,nome,email,aprovado,criado_em FROM usuarios WHERE tipo='professor' ORDER BY aprovado,nome"
  ).all());
}

function aprovar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ erro: "ID inválido." });
  const result = db.prepare(
    "UPDATE usuarios SET aprovado=1 WHERE id=? AND tipo='professor'"
  ).run(id);
  if (!result.changes) return res.status(404).json({ erro: "Professor não encontrado." });
  res.json({ mensagem: "Cadastro de professor aprovado." });
}

module.exports = { listar, aprovar };
