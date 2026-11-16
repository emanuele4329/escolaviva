const router = require("express").Router();
const c = require("../controllers/professorController");
const { autenticar, permitir } = require("../middlewares/authMiddleware");
router.get("/", autenticar, permitir("admin"), c.listar);
router.post("/:id/aprovar", autenticar, permitir("admin"), c.aprovar);
module.exports = router;
