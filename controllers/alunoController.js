const { db } = require("../database/banco");

function listar(_req, res) {
  const alunos = db.prepare(
    "SELECT id,nome,email,turma,criado_em FROM usuarios WHERE tipo='aluno' ORDER BY nome"
  ).all();
  res.json(alunos);
}

function remover(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ erro: "ID inválido." });
  const resultado = db.prepare("DELETE FROM usuarios WHERE id=? AND tipo='aluno'").run(id);
  if (!resultado.changes) return res.status(404).json({ erro: "Aluno não encontrado." });
  res.json({ mensagem: "Cadastro do aluno removido." });
}

module.exports = { listar, remover };
