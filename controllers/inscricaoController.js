const { db } = require("../database/banco");

function criar(req, res) {
  if (req.usuario.tipo !== "aluno") {
    return res.status(403).json({ erro: "Somente alunos podem se inscrever nas atividades." });
  }
  const atividadeId = Number(req.body.atividade_id);
  if (!Number.isInteger(atividadeId)) return res.status(400).json({ erro: "Atividade inválida." });

  const atividade = db.prepare("SELECT * FROM atividades WHERE id=? AND ativa=1").get(atividadeId);
  if (!atividade) return res.status(404).json({ erro: "Atividade não encontrada ou indisponível." });

  const quantidade = db.prepare("SELECT COUNT(*) AS total FROM inscricoes WHERE atividade_id=?").get(atividadeId).total;
  if (quantidade >= atividade.vagas) return res.status(409).json({ erro: "Não há vagas disponíveis nesta atividade." });

  try {
    db.prepare("INSERT INTO inscricoes (aluno_id,atividade_id) VALUES (?,?)")
      .run(req.usuario.id, atividadeId);
    res.status(201).json({ mensagem: "Inscrição realizada com sucesso!" });
  } catch (err) {
    if (String(err.code).includes("SQLITE_CONSTRAINT_UNIQUE")) {
      return res.status(409).json({ erro: "Você já está inscrito nesta atividade." });
    }
    throw err;
  }
}

function minhas(req, res) {
  const dados = db.prepare(`
    SELECT i.id,i.criado_em,a.id AS atividade_id,a.titulo,a.descricao
    FROM inscricoes i JOIN atividades a ON a.id=i.atividade_id
    WHERE i.aluno_id=? ORDER BY i.criado_em DESC
  `).all(req.usuario.id);
  res.json(dados);
}

function listarTodas(_req, res) {
  const dados = db.prepare(`
    SELECT i.id,i.criado_em,u.nome AS aluno,u.email,u.turma,a.titulo AS atividade
    FROM inscricoes i
    JOIN usuarios u ON u.id=i.aluno_id
    JOIN atividades a ON a.id=i.atividade_id
    ORDER BY a.titulo,u.nome
  `).all();
  res.json(dados);
}

function cancelar(req, res) {
  const result = db.prepare("DELETE FROM inscricoes WHERE id=? AND aluno_id=?")
    .run(Number(req.params.id), req.usuario.id);
  if (!result.changes) return res.status(404).json({ erro: "Inscrição não encontrada." });
  res.json({ mensagem: "Inscrição cancelada." });
}

module.exports = { criar, minhas, listarTodas, cancelar };
