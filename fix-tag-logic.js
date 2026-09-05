const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

const importAction = `export async function importEtiquetasEmMassa(categoria: string, etiquetasTexto: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return { success: false, error: 'Acesso negado. Usuário sem conta.' }

    // Divide por quebras de linha, remove espaços extras e ignora linhas vazias
    const nomes = etiquetasTexto
      .split('\\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0)

    if (nomes.length === 0) return { success: false, error: 'Nenhum nome válido encontrado.' }

    // Busca as etiquetas que já existem (independente de categoria para evitar ambiguidade de nomes iguais)
    const existentes = await prisma.etiqueta.findMany({
      where: { contaId: user.contaId }
    })
    const nomesExistentes = new Set(existentes.map(e => e.nome.toLowerCase()))

    const PALETA_CORES = [
      '#3b82f6', // Azul
      '#10b981', // Esmeralda
      '#8b5cf6', // Violeta
      '#f97316', // Laranja
      '#ef4444', // Vermelho
      '#ec4899', // Rosa
      '#06b6d4', // Ciano
      '#f59e0b', // Amber
      '#64748b'  // Slate
    ]

    let inseridos = 0
    let ignorados = 0

    // Insere os que não existem
    for (const nome of nomes) {
      if (nomesExistentes.has(nome.toLowerCase())) {
        ignorados++
      } else {
        // Selecionar cor sortida baseada em inseridos (garante distribuição)
        const cor = PALETA_CORES[inseridos % PALETA_CORES.length]

        await prisma.etiqueta.create({
          data: {
            contaId: user.contaId,
            nome,
            categoria,
            cor
          }
        })
        nomesExistentes.add(nome.toLowerCase())
        inseridos++
      }
    }

    revalidatePath('/')
    return { success: true, inseridos, ignorados }
  } catch (error) {
    console.error('Erro ao importar etiquetas:', error)
    return { success: false, error: 'Erro ao realizar a importação.' }
  }
}`;

code = code.replace(
  /export async function importEtiquetasEmMassa[\s\S]*?catch \(error\) \{\n    console\.error\('Erro ao importar etiquetas:', error\)\n    return \{ success: false, error: 'Erro ao realizar a importação\.' \}\n  \}\n\}/,
  importAction
);

fs.writeFileSync(p, code);
console.log('Backend tag logic updated');
