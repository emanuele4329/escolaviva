const router = require("express").Router();
const c = require("../controllers/alunoController");
const { autenticar, permitir } = require("../middlewares/authMiddleware");
router.get("/", autenticar, permitir("admin","professor"), c.listar);
router.delete("/:id", autenticar, permitir("admin"), c.remover);
module.exports = router;
