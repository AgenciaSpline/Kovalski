import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Iniciando configuração do Multi-Tenant (Via SQL bruto com UUID Cast)...");

    let contaId = '';
    const contasResult = await prisma.$queryRaw`SELECT id FROM contas WHERE slug = 'campanha-2026' LIMIT 1`;

    if (Array.isArray(contasResult) && contasResult.length > 0) {
      contaId = (contasResult as any)[0].id;
      console.log("Conta 'Campanha 2026' já existe. ID:", contaId);
    } else {
      const newConta = await prisma.$queryRaw`INSERT INTO contas (id, nome, slug, status, criado_em, atualizado_em) VALUES (gen_random_uuid(), 'Campanha 2026', 'campanha-2026', 'ATIVO', NOW(), NOW()) RETURNING id`;
      contaId = (newConta as any)[0].id;
      console.log("Conta 'Campanha 2026' criada com sucesso. ID:", contaId);
    }

    const updateAdmin = await prisma.$executeRawUnsafe(`UPDATE usuarios SET conta_id = $1::uuid WHERE email = 'admin@kovalski.com'`, contaId);
    if (updateAdmin > 0) {
      console.log("Usuário Admin vinculado à conta com sucesso.");
    } else {
      console.log("Usuário Admin não encontrado.");
    }

    console.log("Migrando dados existentes para a nova conta...");
    await prisma.$executeRawUnsafe(`UPDATE cidades SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE bairros SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE etiquetas SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE eleitores SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE metas_campanha SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE disparos SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE formularios SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE listas_transmissao SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);
    await prisma.$executeRawUnsafe(`UPDATE correspondencia_templates SET conta_id = $1::uuid WHERE conta_id IS NULL`, contaId);

    console.log("Migração de dados concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a configuração:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();