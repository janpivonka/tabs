import { AppError } from "../../shared/errors/AppError.js";

export const validateTableInput = (data: any) => {
  if (!data || typeof data !== "object") {
    throw new AppError("Invalid table data", 400);
  }
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    throw new AppError("Table name is required", 400);
  }
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
    throw new AppError("Table columns and rows must be arrays", 400);
  }
};

export const validateSyncInput = (data: any) => {
  if (!data || !Array.isArray(data.tables)) {
    throw new AppError("Invalid sync data: 'tables' array is required", 400);
  }
  data.tables.forEach((t: any) => validateTableInput(t));
};
