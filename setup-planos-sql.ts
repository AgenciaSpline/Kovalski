import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Inserindo planos via SQL bruto (garantia)...");

    await prisma.$executeRawUnsafe(`DELETE FROM planos`);

    await prisma.$executeRawUnsafe(`
      INSERT INTO planos (id, nome, valor, limite_eleitores, limite_usuarios) VALUES
      (gen_random_uuid(), 'Mensal (1 Mês)', 97.00, 5000, 2),
      (gen_random_uuid(), 'Trimestral (3 Meses)', 250.00, 15000, 5),
      (gen_random_uuid(), 'Semestral (6 Meses)', 450.00, 30000, 10),
      (gen_random_uuid(), 'Anual (12 Meses)', 800.00, 100000, 20)
    `);

    console.log("Novos planos inseridos com sucesso!");
  } catch (err) {
    console.log("Erro:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();