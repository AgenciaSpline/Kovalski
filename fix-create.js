const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

// 1. Em createEleitor
code = code.replace(/const eleitor = await prisma\.eleitor\.create\(\{\s*data:\s*\{\s*nomeCompleto:\s*data\.nomeCompleto,/g, 'const eleitor = await prisma.eleitor.create({ data: { contaId: user.contaId, nomeCompleto: data.nomeCompleto,');

// 2. Em importEleitores (newEleitor)
code = code.replace(/const newEleitor = await prisma\.eleitor\.create\(\{\s*data:\s*\{\s*nomeCompleto:\s*row\.nome,/g, 'const newEleitor = await prisma.eleitor.create({ data: { contaId: user.contaId, nomeCompleto: row.nome,');

// 3. Em createEleitorPublicComForm (precisa usar form.contaId em vez de user.contaId)
// A função tem:
// const eleitor = await prisma.eleitor.create({ data: { contaId: user.contaId, nomeCompleto: data.nomeCompleto,
// Wait, the previous replace might have matched createEleitorPublicComForm as well because it uses `const eleitor = await prisma.eleitor.create({ data: { nomeCompleto: data.nomeCompleto,`
// Let's replace the one specifically inside createEleitorPublicComForm.

code = code.replace(/export async function createEleitorPublicComForm[\s\S]*?const eleitor = await prisma\.eleitor\.create\(\{\s*data:\s*\{\s*contaId:\s*user\.contaId,/g, (match) => {
  return match.replace('contaId: user.contaId,', 'contaId: form.contaId,');
});

fs.writeFileSync(p, code);
console.log("Bug de salvamento de eleitores resolvido com sucesso!");
