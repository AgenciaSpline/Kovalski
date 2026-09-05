const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'EtiquetasView.tsx');

let code = fs.readFileSync(p, 'utf8');

const regexImport = /const res = await importEtiquetasEmMassa\(importCategoria, importCor, importTexto\)/;

if (regexImport.test(code)) {
  code = code.replace(
    regexImport,
    "const res = await importEtiquetasEmMassa(importCategoria, importTexto)"
  );

  // Remove the dropdown for Cor from the modal UI
  const colorDropdownRegex = /<div className="space-y-1\.5">\s*<label className="text-xs font-semibold text-slate-500 uppercase">Cor \*<\/label>[\s\S]*?<\/select>\s*<\/div>/;
  code = code.replace(colorDropdownRegex, "");

  // Change grid-cols-2 to grid-cols-1 since we removed one field
  code = code.replace(
    /<div className="grid grid-cols-2 gap-4">/,
    '<div className="grid grid-cols-1 gap-4">'
  );

  fs.writeFileSync(p, code);
  console.log('UI for tags bulk import updated');
}
