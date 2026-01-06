import expressPkg from "express";
const { Request, Response, NextFunction } = expressPkg;
import * as tablesService from "../services/tablesService.ts";
import { validateTableData } from "../utils/validate.ts";

export const getAllTables = async (_req: typeof Request, res: typeof Response, next: typeof NextFunction) => {
  try {
    const tables = await tablesService.getAllTables();
    res.json(tables);
  } catch (err) {
    next(err);
  }
};

export const createTable = async (req: typeof Request, res: typeof Response, next: typeof NextFunction) => {
  try {
    validateTableData(req.body);
    const table = await tablesService.createNewTable(req.body);
    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
};

export const updateTable = async (req: typeof Request, res: typeof Response, next: typeof NextFunction) => {
  try {
    const { id } = req.params;
    validateTableData(req.body);
    const table = await tablesService.updateExistingTable(id, req.body);
    res.json(table);
  } catch (err) {
    next(err);
  }
};

export const deleteTable = async (req: typeof Request, res: typeof Response, next: typeof NextFunction) => {
  try {
    const { id } = req.params;
    await tablesService.deleteTableById(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
