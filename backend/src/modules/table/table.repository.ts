import { prisma } from "../../shared/prisma/client.js";

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
        const targetId = isNew ? "00000000-0000-0000-0000-000000000000" : t.id;

        return prisma.tableEntity.upsert({
          where: { id: targetId },
          update: { name: t.name, data: { columns: t.columns, rows: t.rows } },
          create: { name: t.name, data: { columns: t.columns, rows: t.rows } },
        });
      })
    );
  }
};