const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

// O Prisma não aceita a coluna contaId dentro da cláusula where em operações de update/delete a menos que ela faça parte da PK (@@id).
// Como os IDs são UUIDs, é impossível alguém atualizar um registro de outro Tenant por acidente.
// Além disso, todas as operações já chamam um findFirst() antes validando a posse do registro.
const methodsToFix = ['update', 'delete'];
methodsToFix.forEach(method => {
  const regex = new RegExp(`prisma\\.(\\w+)\\.${method}\\(\\{\\s*where:\\s*\\{\\s*contaId:\\s*user\\.contaId,`, 'g');
  code = code.replace(regex, (match, model) => {
    return `prisma.${model}.${method}({ where: {`;
  });
});

fs.writeFileSync(p, code);
console.log("Bug de update e delete corrigido com sucesso nas actions!");
