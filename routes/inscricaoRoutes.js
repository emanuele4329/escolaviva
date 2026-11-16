const router = require("express").Router();
const c = require("../controllers/inscricaoController");
const { autenticar, permitir } = require("../middlewares/authMiddleware");
router.post("/", autenticar, permitir("aluno"), c.criar);
router.get("/minhas", autenticar, permitir("aluno"), c.minhas);
router.get("/", autenticar, permitir("admin","professor"), c.listarTodas);
router.delete("/:id", autenticar, permitir("aluno"), c.cancelar);
module.exports = router;
