const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

const importAction = `
export async function importBairrosEmMassa(cidadeId: string, bairrosTexto: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return { success: false, error: 'Acesso negado. Usuário sem conta.' }

    // Divide por quebras de linha, remove espaços extras e ignora linhas vazias
    const nomes = bairrosTexto
      .split('\\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0)

    if (nomes.length === 0) return { success: false, error: 'Nenhum nome válido encontrado.' }

    // Busca os bairros que já existem para essa cidade, nesta conta
    const existentes = await prisma.bairro.findMany({
      where: { contaId: user.contaId, cidadeId }
    })
    const nomesExistentes = new Set(existentes.map(b => b.nome.toLowerCase()))

    let inseridos = 0
    let ignorados = 0

    // Insere os que não existem
    for (const nome of nomes) {
      if (nomesExistentes.has(nome.toLowerCase())) {
        ignorados++
      } else {
        await prisma.bairro.create({
          data: {
            contaId: user.contaId,
            cidadeId,
            nome
          }
        })
        nomesExistentes.add(nome.toLowerCase()) // Para evitar duplicação na mesma lista
        inseridos++
      }
    }

    revalidatePath('/')
    return { success: true, inseridos, ignorados }
  } catch (error) {
    console.error('Erro ao importar bairros:', error)
    return { success: false, error: 'Erro ao realizar a importação.' }
  }
}
`;

if (!code.includes('importBairrosEmMassa')) {
  code = code + importAction;
  fs.writeFileSync(p, code);
  console.log('importBairrosEmMassa added');
}
