const { db } = require("../database/banco");

function listar(_req, res) {
  const atividades = db.prepare(`
    SELECT a.id,a.titulo,a.descricao,a.disciplinas,a.vagas,a.ativa,
      (SELECT COUNT(*) FROM inscricoes i WHERE i.atividade_id=a.id) AS inscritos
    FROM atividades a ORDER BY a.id
  `).all();
  res.json(atividades);
}

function criar(req, res) {
  const { titulo, descricao, disciplinas, vagas } = req.body;
  const nVagas = Number(vagas || 30);
  if (!titulo || !descricao || !Number.isInteger(nVagas) || nVagas < 1 || nVagas > 500) {
    return res.status(400).json({ erro: "Informe título, descrição e vagas entre 1 e 500." });
  }
  const result = db.prepare(
    "INSERT INTO atividades (titulo,descricao,disciplinas,vagas,criado_por) VALUES (?,?,?,?,?)"
  ).run(String(titulo).trim().slice(0,100), String(descricao).trim().slice(0,1000),
    String(disciplinas || "").trim().slice(0,200), nVagas, req.usuario.id);
  res.status(201).json({ mensagem: "Atividade criada.", id: result.lastInsertRowid });
}

function atualizar(req, res) {
  const id = Number(req.params.id);
  const { titulo, descricao, disciplinas, vagas, ativa } = req.body;
  const nVagas = Number(vagas);
  if (!Number.isInteger(id) || !titulo || !descricao ||
      !Number.isInteger(nVagas) || nVagas < 1 || nVagas > 500) {
    return res.status(400).json({ erro: "Dados inválidos para atualizar a atividade." });
  }
  const result = db.prepare(`
    UPDATE atividades SET titulo=?,descricao=?,disciplinas=?,vagas=?,ativa=? WHERE id=?
  `).run(String(titulo).trim().slice(0,100), String(descricao).trim().slice(0,1000),
    String(disciplinas || "").trim().slice(0,200), nVagas, ativa ? 1 : 0, id);
  if (!result.changes) return res.status(404).json({ erro: "Atividade não encontrada." });
  res.json({ mensagem: "Atividade atualizada." });
}

function remover(req, res) {
  const result = db.prepare("DELETE FROM atividades WHERE id=?").run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ erro: "Atividade não encontrada." });
  res.json({ mensagem: "Atividade removida." });
}

module.exports = { listar, criar, atualizar, remover };
