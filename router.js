const { Router, Response } = require("pepesan");
const BotController = require("./controller/BotController");
const f = require("./utils/Formatter");

const router = new Router();

router.menu(f("menu.tentangKantor"), [BotController, "tentangKantor"]);
router.menu(f("menu.daftarRekening"), [BotController, "daftarRekening"]);
router.menu(f("menu.slipGaji"), [BotController, "slipGaji"]);
router.keyword("*", [BotController, "introduction"]);

module.exports = router;
