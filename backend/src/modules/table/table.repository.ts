import { prisma } from "../../shared/prisma/client.js";
import { v4 as uuid } from "uuid";

export const tableRepository = {
  findAll: () => prisma.tableEntity.findMany(),
  findById: (id: string) => prisma.tableEntity.findUnique({ where: { id } }),
  create: (data: { name: string; data: any }) => prisma.tableEntity.create({ data }),
  update: (id: string, data: { name: string; data: any }) => prisma.tableEntity.update({ where: { id }, data }),
  delete: (id: string) => prisma.tableEntity.delete({ where: { id } }),

  sync: async (tables: any[]) => {
    return prisma.$transaction(
      tables.map((t) => {
        const isNew = String(t.id).startsWith("tmp_");
        const targetId = isNew ? uuid() : t.id;

        // fallback pro name
        const name = t.name && t.name.trim() ? t.name : "Unnamed Table";

        return prisma.tableEntity.upsert({
          where: { id: targetId },
          update: { name, data: { columns: t.columns || [], rows: t.rows || [] } },
          create: { id: targetId, name, data: { columns: t.columns || [], rows: t.rows || [] } },
        });
      })
    );
  }
};
