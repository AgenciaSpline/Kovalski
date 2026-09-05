const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'superadmin-finance-actions.ts');

let code = fs.readFileSync(p, 'utf8');

// Replace the block to also update the PagamentoMensalidade table to 'PAGO'
const updateStr = `    await prisma.conta.update({
      where: { id: contaId },
      data: {
        dataProximoVencimento: baseDate,
        status: 'ATIVO' // Se estava bloqueado por falta de pagamento, libera o acesso
      }
    })

    // Update existing pending payments to PAGO
    await prisma.pagamentoMensalidade.updateMany({
      where: { contaId, status: 'PENDENTE' },
      data: {
        status: 'PAGO',
        dataPagamento: new Date()
      }
    })`;

code = code.replace(/    await prisma\.conta\.update\(\{\s*where: \{ id: contaId \},\s*data: \{\s*dataProximoVencimento: baseDate,\s*status: 'ATIVO' \/\/ Se estava bloqueado por falta de pagamento, libera o acesso\s*\}\s*\}\)/, updateStr);

fs.writeFileSync(p, code);
console.log('Finance action updated');
