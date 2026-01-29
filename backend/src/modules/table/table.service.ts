import { tableRepository } from "./table.repository.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

// Definujeme si rozhraní pro strukturu dat v JSONu
interface TableJsonData {
  columns?: any[];
  rows?: any[];
}

export const tableService = {
  getAll: async () => {
    const tables = await tableRepository.findAll();
    return tables.map(t => {
      // Přetypujeme t.data na naše rozhraní
      const tableData = t.data as unknown as TableJsonData;
      return {
        id: t.id,
        name: t.name || "Unnamed Table",
        columns: tableData?.columns || [],
        rows: tableData?.rows || []
      };
    });
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
    const sanitizedTables = tables.map(t => ({
      ...t,
      name: t.name && t.name.trim() ? t.name : "Unnamed Table",
      columns: Array.isArray(t.columns) ? t.columns : [],
      rows: Array.isArray(t.rows) ? t.rows : []
    }));

    const synced = await tableRepository.sync(sanitizedTables);

    return synced.map(t => {
      // Opět přetypujeme t.data pro návratovou hodnotu
      const tableData = t.data as unknown as TableJsonData;
      return {
        id: t.id,
        name: t.name || "Unnamed Table",
        columns: tableData?.columns || [],
        rows: tableData?.rows || []
      };
    });
  }
};