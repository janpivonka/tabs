import { prisma } from "../prisma/client.ts";

export const getAllTables = async () => {
  const allTables = await prisma.tableEntity.findMany();
  return allTables.map(t => ({ id: t.id, data: t.data }));
};

export const createNewTable = async ({ name, data }: { name: string; data: any }) => {
  return prisma.tableEntity.create({ data: { name, data } });
};

export const updateExistingTable = async (
  id: string,
  { name, data }: { name: string; data: any }
) => {
  const existing = await prisma.tableEntity.findUnique({ where: { id } });
  if (existing) {
    return prisma.tableEntity.update({ where: { id }, data: { name, data } });
  } else {
    return prisma.tableEntity.create({ data: { name, data } });
  }
};

export const deleteTableById = async (id: string) => {
  const existing = await prisma.tableEntity.findUnique({ where: { id } });
  if (!existing) throw new Error("Záznam neexistuje");
  await prisma.tableEntity.delete({ where: { id } });
  return true;
};
