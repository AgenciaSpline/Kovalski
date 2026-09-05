const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'superadmin-actions.ts');

let code = fs.readFileSync(p, 'utf8');

const editAction = `
export async function editarClienteMaster(contaId: string, data: { nome: string, planoId: string, diaVencimento: number, dataProximoVencimento: Date | null }) {
  try {
    await checkSuperAdmin()

    await prisma.conta.update({
      where: { id: contaId },
      data: {
        nome: data.nome,
        planoId: data.planoId,
        diaVencimento: data.diaVencimento,
        dataProximoVencimento: data.dataProximoVencimento
      }
    })

    revalidatePath('/superadmin')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Falha ao editar cliente.' }
  }
}
`;

if (!code.includes('editarClienteMaster')) {
  code = code + editAction;
  fs.writeFileSync(p, code);
  console.log('Edit action added');
}
