const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Iniciando configuração do Multi-Tenant...");

    // 1. Criar a primeira conta (Campanha 2026)
    let conta = await prisma.conta.findUnique({
      where: { slug: 'campanha-2026' }
    });

    if (!conta) {
      conta = await prisma.conta.create({
        data: {
          nome: 'Campanha 2026',
          slug: 'campanha-2026',
          status: 'ATIVO'
        }
      });
      console.log("Conta 'Campanha 2026' criada com sucesso. ID:", conta.id);
    } else {
      console.log("Conta 'Campanha 2026' já existe. ID:", conta.id);
    }

    // 2. Vincular o usuário admin à conta
    const admin = await prisma.usuario.findUnique({
      where: { email: 'admin@kovalski.com' }
    });

    if (admin) {
      await prisma.usuario.update({
        where: { id: admin.id },
        data: { contaId: conta.id }
      });
      console.log("Usuário Admin vinculado à conta com sucesso.");
    } else {
      console.log("Usuário Admin não encontrado. Crie o usuário primeiro.");
    }

    // 3. Atualizar todos os registros existentes para pertencerem a esta conta
    console.log("Migrando dados existentes para a nova conta...");

    await prisma.cidade.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.bairro.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.etiqueta.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.eleitor.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.metaCampanha.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.disparo.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.formulario.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.listaTransmissao.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });
    await prisma.correspondenciaTemplate.updateMany({ where: { contaId: null }, data: { contaId: conta.id } });

    console.log("Migração de dados concluída com sucesso!");

  } catch (error) {
    console.error("Erro durante a configuração:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();