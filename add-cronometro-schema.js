const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'prisma', 'schema.prisma');

let code = fs.readFileSync(p, 'utf8');

if (!code.includes('dataProximoVencimento')) {
  // We'll add this to the Conta model to track exactly when it expires
  code = code.replace(
    /diaVencimento  Int      @default\(10\) @map\("dia_vencimento"\) \/\/ Dia do mês que vence/,
    'diaVencimento  Int      @default(10) @map("dia_vencimento") // Dia do mês que vence\n  dataProximoVencimento DateTime? @map("data_proximo_vencimento") // Controle do Cronômetro'
  );
  fs.writeFileSync(p, code);
  console.log('Schema updated successfully.');
} else {
  console.log('Schema already has dataProximoVencimento.');
}
