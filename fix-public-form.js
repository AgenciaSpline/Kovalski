const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

// The public form endpoint gets hit without a logged-in user context.
// Currently getFormulario has this:
// `where: { contaId: user.contaId, id },`
// But in a public page, `user` is not defined (it throws an error or fails).
// And for `createEleitorPublicComForm`, we have:
// `where: { contaId: form.contaId, id: formId },` which is invalid syntax since form is not defined yet.

code = code.replace(
  /export async function getFormulario\(id: string\) \{\s*try \{\s*const f = await prisma\.formulario\.findFirst\(\{\s*where: \{ id \},/g,
  `export async function getFormulario(id: string) {\n  try {\n    const f = await prisma.formulario.findFirst({\n      where: { id },`
);

code = code.replace(
  /const form = await prisma\.formulario\.findFirst\(\{\s*where: \{ contaId: form\.contaId, id: formId \},/g,
  `const form = await prisma.formulario.findFirst({\n      where: { id: formId },`
);

fs.writeFileSync(p, code);
console.log('Fixed public form auth errors!');