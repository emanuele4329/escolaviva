const router = require("express").Router();
const c = require("../controllers/atividadeController");
const { autenticar, permitir } = require("../middlewares/authMiddleware");
router.get("/", c.listar);
router.post("/", autenticar, permitir("admin","professor"), c.criar);
router.put("/:id", autenticar, permitir("admin","professor"), c.atualizar);
router.delete("/:id", autenticar, permitir("admin"), c.remover);
module.exports = router;
