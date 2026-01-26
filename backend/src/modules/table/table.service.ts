import { tableRepository } from "./table.repository.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export const tableService = {
  getAll: async () => {
    const tables = await tableRepository.findAll();
    return tables.map(t => ({
      id: t.id,
      name: t.name || "Unnamed Table",
      columns: t.data?.columns || [],
      rows: t.data?.rows || []
    }));
  },

  create: async (data: { name: string; data: any }) => {
    return tableRepository.create({
      name: data.name && data.name.trim() ? data.name : "Unnamed Table",
      data: { columns: data.data?.columns || [], rows: data.data?.rows || [] }
    });
  },

  update: async (id: string, data: { name: string; data: any }) => {
    const existing = await tableRepository.findById(id);
    if (!existing) throw new NotFoundError("Table not found");

    return tableRepository.update(id, {
      name: data.name && data.name.trim() ? data.name : "Unnamed Table",
      data: { columns: data.data?.columns || [], rows: data.data?.rows || [] }
    });
  },

  delete: async (id: string) => {
    const existing = await tableRepository.findById(id);
    if (!existing) throw new NotFoundError("Table not found");
    await tableRepository.delete(id);
  },

  sync: async (tables: any[]) => {
    // fallback pro name a columns/rows před uložením
    const sanitizedTables = tables.map(t => ({
      ...t,
      name: t.name && t.name.trim() ? t.name : "Unnamed Table",
      columns: Array.isArray(t.columns) ? t.columns : [],
      rows: Array.isArray(t.rows) ? t.rows : []
    }));

    const synced = await tableRepository.sync(sanitizedTables);

    return synced.map(t => ({
      id: t.id,
      name: t.name || "Unnamed Table",
      columns: t.data?.columns || [],
      rows: t.data?.rows || []
    }));
  }
};
