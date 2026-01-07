import { AppError } from "../../shared/errors/AppError.js";

export const validateTableInput = (data: any) => {
  if (!data || typeof data !== "object") {
    throw new AppError("Invalid table data", 400);
  }
  if (typeof data.name !== "string") {
    throw new AppError("Table name is required", 400);
  }
};
