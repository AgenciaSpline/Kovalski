const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'superadmin-actions.ts');

let code = fs.readFileSync(p, 'utf8');

code = code.replace(
  /const proximoMes = new Date\(\)\s*proximoMes\.setMonth\(proximoMes\.getMonth\(\) \+ 1\)\s*proximoMes\.setDate\(data\.diaVencimento\)/,
  "const dataVencimentoReal = new Date()\n    dataVencimentoReal.setMonth(dataVencimentoReal.getMonth() + 1)"
);

code = code.replace(
  /dataVencimento: proximoMes,/,
  "dataVencimento: dataVencimentoReal,"
);

fs.writeFileSync(p, code);
console.log('Fixed superadmin actions pending payment');
