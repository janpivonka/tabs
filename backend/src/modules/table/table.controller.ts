import { Request, Response, NextFunction } from "express";
import { tableService } from "./table.service.js";
import { validateTableInput } from "./table.validator.js";

export const getAllTables = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json(await tableService.getAll());
  } catch (e) {
    next(e);
  }
};

export const createTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateTableInput(req.body);
    const table = await tableService.create(req.body);
    res.status(201).json(table);
  } catch (e) {
    next(e);
  }
};

export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateTableInput(req.body);
    const table = await tableService.update(req.params.id, req.body);
    res.json(table);
  } catch (e) {
    next(e);
  }
};

export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await tableService.delete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
