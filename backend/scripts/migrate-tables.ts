import { prisma } from "../src/shared/prisma/client.ts"; // Relativní cesta k tvému client.ts

async function migrateTables() {
  try {
    console.log("🔹 Spouštím migraci tabulek...");

    // Načteme všechny existující tabulky
    const tables = await prisma.tableEntity.findMany();

    console.log(`✅ Našlo se ${tables.length} tabulek.`);

    for (const t of tables) {
      // Zde můžeš upravit data, pokud je potřeba
      // Například převod 'null' stringů na skutečné null
      const rows = t.data?.rows?.map((row: any[]) =>
        row.map((cell: any) => (cell === "null" ? null : cell))
      );

      // Uložíme zpět
      await prisma.tableEntity.update({
        where: { id: t.id },
        data: {
          data: {
            ...t.data,
            rows,
          },
        },
      });

      console.log(`✔ Tabulka "${t.name}" (id: ${t.id}) byla upravena.`);
    }

    console.log("🎉 Migrace dokončena.");
  } catch (err) {
    console.error("❌ Chyba při migraci:", err);
  } finally {
    await prisma.$disconnect();
  }
}

// Spuštění migrace
migrateTables();
