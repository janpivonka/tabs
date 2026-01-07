import { prisma } from "../../shared/prisma/client.js";

export const tableRepository = {
  findAll: () => {
    return prisma.tableEntity.findMany();
  },

  findById: (id: string) => {
    return prisma.tableEntity.findUnique({ where: { id } });
  },

  create: (data: { name: string; data: any }) => {
    return prisma.tableEntity.create({ data });
  },

  update: (id: string, data: { name: string; data: any }) => {
    return prisma.tableEntity.update({
      where: { id },
      data,
    });
  },

  delete: (id: string) => {
    return prisma.tableEntity.delete({ where: { id } });
  },
};
