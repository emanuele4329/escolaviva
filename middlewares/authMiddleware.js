const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : null;
  if (!token) return res.status(401).json({ erro: "Faça login para continuar." });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: "Sessão inválida ou expirada. Entre novamente." });
  }
}

function permitir(...tipos) {
  return (req, res, next) => {
    if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: "Você não tem permissão para esta ação." });
    }
    next();
  };
}

module.exports = { autenticar, permitir };
