import { tableRepository } from "./table.repository.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export const tableService = {
  // Načtení všech tabulek pro úvodní zobrazení
  getAll: async () => {
    const tables = await tableRepository.findAll();
    return tables.map(t => ({
      id: t.id,
      name: t.name,
      columns: t.data?.columns || [],
      rows: t.data?.rows || []
    }));
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

  /**
   * Klíčová metoda pro synchronizaci.
   * Přijímá pole tabulek (včetně těch s originId pro klony).
   */
  sync: async (tables: any[]) => {
    // Repository se postará o logiku upsertu (buď podle id, nebo podle originId)
    const synced = await tableRepository.sync(tables);

    // Mapujeme výsledek z DB zpět na formát, kterému rozumí frontend editor
    return synced.map(t => ({
      id: t.id,
      name: t.name,
      columns: t.data?.columns || [],
      rows: t.data?.rows || []
    }));
  }
};