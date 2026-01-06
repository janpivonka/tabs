import expressPkg from "express";
const { Router } = expressPkg;
import * as tablesController from "../controllers/tablesController.ts";

const router = Router();

router.get("/", tablesController.getAllTables);
router.post("/", tablesController.createTable);
router.put("/:id", tablesController.updateTable);
router.delete("/:id", tablesController.deleteTable);

export default router;
