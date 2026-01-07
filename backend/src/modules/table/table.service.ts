import { tableRepository } from "./table.repository.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export const tableService = {
  getAll: async () => {
    const tables = await tableRepository.findAll();
    return tables.map(t => ({ id: t.id, data: t.data }));
  },

  create: async (data: { name: string; data: any }) => {
    return tableRepository.create(data);
  },

  update: async (id: string, data: { name: string; data: any }) => {
    const existing = await tableRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Table not found");
    }
    return tableRepository.update(id, data);
  },

  delete: async (id: string) => {
    const existing = await tableRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Table not found");
    }
    await tableRepository.delete(id);
  },
};
