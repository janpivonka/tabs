import expressPkg from "express";
const { Request, Response, NextFunction } = expressPkg;

export const errorHandler = (
  err: any,
  _req: typeof Request,
  res: typeof Response,
  _next: typeof NextFunction
) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
};
