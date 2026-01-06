export const validateTableData = (data: any) => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid table data");
  }
};
