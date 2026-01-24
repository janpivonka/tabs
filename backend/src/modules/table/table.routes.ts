import { Router } from "express";
import * as controller from "./table.controller.js";

const router = Router();

router.get("/", controller.getAllTables);
router.post("/", controller.createTable);
// NOVINKA: Hromadná synchronizace
router.post("/sync", controller.syncTables);

router.put("/:id", controller.updateTable);
router.delete("/:id", controller.deleteTable);

export default router;