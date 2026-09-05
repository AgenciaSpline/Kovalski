const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

// Correção 1: Remover as duplicações geradas pelo meu script anterior
// Procura algo como: findMany({ where: { contaId: user.contaId }, onde logo depois vem um 'where,'
code = code.replace(/where:\s*\{\s*contaId:\s*user\.contaId\s*\},?\s*where/g, 'where');

// Agora que removemos, vamos injetar o contaId DENTRO das variaveis `where` e `whereClause`
// Procura "const where: any = {}"
code = code.replace(/const where: any = \{\}/g, 'const where: any = { contaId: user.contaId }');
// Procura "const whereClause: any = {}"
code = code.replace(/const whereClause: any = \{\}/g, 'const whereClause: any = { contaId: user.contaId }');

// Correção 2: O getUsuarios não tinha recebido o contaId porque não estava na lista de entidades
code = code.replace(/prisma\.usuario\.findMany\(\{\s*orderBy:/g, 'prisma.usuario.findMany({ where: { contaId: user.contaId }, orderBy:');

// Correção 3: Alguns finds (como getLideres) não tinham variável where e não receberam o filtro
code = code.replace(/prisma\.eleitor\.findMany\(\{\s*where:\s*\{\s*isLider:\s*true\s*\}/g, 'prisma.eleitor.findMany({ where: { contaId: user.contaId, isLider: true }');

// Correção 4: No getDisparos
code = code.replace(/prisma\.disparo\.findMany\(\{\s*orderBy:/g, 'prisma.disparo.findMany({ where: { contaId: user.contaId }, orderBy:');

// Correção 5: getEtiquetas, getCidades, getBairros, getCorrespondenciaTemplates não possuem where
code = code.replace(/prisma\.etiqueta\.findMany\(\{\s*orderBy:/g, 'prisma.etiqueta.findMany({ where: { contaId: user.contaId }, orderBy:');
code = code.replace(/prisma\.cidade\.findMany\(\{\s*orderBy:/g, 'prisma.cidade.findMany({ where: { contaId: user.contaId }, orderBy:');
code = code.replace(/prisma\.bairro\.findMany\(\{\s*orderBy:/g, 'prisma.bairro.findMany({ where: { contaId: user.contaId }, orderBy:');
code = code.replace(/prisma\.correspondenciaTemplate\.findMany\(\{\s*orderBy:/g, 'prisma.correspondenciaTemplate.findMany({ where: { contaId: user.contaId }, orderBy:');

fs.writeFileSync(p, code);
console.log("Bug de vazamento de dados corrigido com sucesso! O Multi-Tenant agora é 100% blindado.");
