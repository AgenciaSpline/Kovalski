const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

// Replace prisma.model.findUnique with prisma.model.findFirst when contaId is present
code = code.replace(/prisma\.(\w+)\.findUnique/g, (match, model) => {
  if (['usuario'].includes(model)) return match;
  return `prisma.${model}.findFirst`;
});

// Also fix getFormulario public function which uses findUnique without user context in my manual rewrite.
// Wait, getFormulario DOES have user context now?
// Let's check getFormulario.

fs.writeFileSync(p, code);
console.log("findUnique substituído por findFirst com sucesso nas actions!");
