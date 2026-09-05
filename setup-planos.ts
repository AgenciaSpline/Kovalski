import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Apagar os planos criados anteriormente
    await prisma.plano.deleteMany({});

    // Injetar novos planos com a nomenclatura correta
    await prisma.plano.createMany({
      data: [
        { nome: 'Mensal (1 Mês)', valor: 97.00, limiteEleitores: 5000, limiteUsuarios: 2 },
        { nome: 'Trimestral (3 Meses)', valor: 250.00, limiteEleitores: 15000, limiteUsuarios: 5 },
        { nome: 'Semestral (6 Meses)', valor: 450.00, limiteEleitores: 30000, limiteUsuarios: 10 },
        { nome: 'Anual (12 Meses)', valor: 800.00, limiteEleitores: 100000, limiteUsuarios: 20 }
      ]
    });
    console.log("Novos planos de 1, 3, 6 e 12 meses criados com sucesso!");
  } catch (err) {
    console.log("Erro:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();