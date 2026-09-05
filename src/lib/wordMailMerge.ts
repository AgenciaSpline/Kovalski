import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Função para formatar data
function formatDateBR(dateString?: Date | string | null): string {
  if (!dateString) return ''
  try {
    const data = new Date(dateString)
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  } catch (e) {
    return ''
  }
}

// Mapeia o eleitor para as chaves exatas esperadas pelos marcadores
function mapEleitorToTags(eleitor: any) {
  const primeiroNome = eleitor.nomeCompleto ? eleitor.nomeCompleto.split(' ')[0] : ''
  return {
    primeiro_nome: primeiroNome,
    nome: eleitor.nomeCompleto || '',
    telefone: eleitor.telefone || '',
    endereco: `${eleitor.logradouro || ''} ${eleitor.numero || ''}`.trim(),
    rua: eleitor.logradouro || 'Sem rua',
    numero: eleitor.numero || 'S/N',
    bairro: eleitor.bairro?.nome || eleitor.bairro || '',
    cidade: eleitor.cidade?.nome || eleitor.cidade || '',
    data_nascimento: formatDateBR(eleitor.dataNascimento),
    data_hoje: new Date().toLocaleDateString('pt-BR')
  }
}

/**
 * Processa a mala direta. Pode receber um objeto File ou uma string base64.
 * mode: 'zip' (arquivos separados) ou 'single' (um único docx com quebras de página)
 */
export async function generateWordMailMerge(
  source: File | { base64: string; fileName: string },
  eleitores: any[],
  mode: 'zip' | 'single' = 'zip'
) {
  if (!source) throw new Error("Fonte não fornecida")
  if (!eleitores || eleitores.length === 0) throw new Error("Nenhum eleitor para gerar")

  let fileContent: string | ArrayBuffer
  let nomeBaseDoc: string

  if (source instanceof File) {
    nomeBaseDoc = source.name.replace('.docx', '')
    fileContent = await new Promise<string | ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = (e) => resolve(e.target?.result as string | ArrayBuffer)
      reader.readAsBinaryString(source)
    })
  } else {
    // É uma string Base64 vinda do banco de dados (provavelmente com Data URI)
    nomeBaseDoc = source.fileName.replace('.docx', '')

    let base64String = source.base64
    // Se o banco salvou com cabeçalho "data:application/vnd...;base64,", usamos fetch para converter nativamente
    if (base64String.startsWith('data:')) {
      const res = await fetch(base64String)
      const blob = await res.blob()

      fileContent = await new Promise<string | ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = reject
        reader.onload = (e) => resolve(e.target?.result as string | ArrayBuffer)
        reader.readAsBinaryString(blob)
      })
    } else {
      // Se por algum motivo é puro base64 sem cabeçalho:
      fileContent = atob(base64String)
    }
  }

  if (mode === 'single') {
    // ==========================================
    // MODO: ARQUIVO ÚNICO COM QUEBRA DE PÁGINA
    // ==========================================
    let zip
    try {
      zip = new PizZip(fileContent)
    } catch (e) {
      throw new Error("Arquivo não parece ser um documento Word .docx válido.")
    }

    // "Hack" avançado: Vamos injetar um loop do docxtemplater e quebras de página diretamente no XML interno do Word
    let contentXml = zip.file("word/document.xml")?.asText()
    if (!contentXml) throw new Error("Arquivo docx malformado.")

    // Adiciona o início do loop logo após a tag <w:body>
    contentXml = contentXml.replace(/(<w:body[^>]*>)/, '$1<w:p><w:r><w:t>{#eleitores_loop}</w:t></w:r></w:p>')

    // Reinicia a numeração da página em cada nova seção (page break)
    // Para quebrar a página E reiniciar a numeração, precisamos inserir uma Seção (sectPr) em vez de um simples <w:br>
    const sectPrIndex = contentXml.lastIndexOf('<w:sectPr')

    // O template de quebra de seção que reinicia a numeração para a página 1:
    // <w:pgNumType w:start="1"/>
    const insertEndString = `
      <w:p><w:r><w:t>{#page_break}</w:t></w:r></w:p>
      <w:p>
        <w:pPr>
          <w:sectPr>
            <w:type w:val="nextPage" />
            <w:pgNumType w:start="1" />
          </w:sectPr>
        </w:pPr>
      </w:p>
      <w:p><w:r><w:t>{/page_break}</w:t></w:r></w:p>
      <w:p><w:r><w:t>{/eleitores_loop}</w:t></w:r></w:p>
    `.replace(/\n\s+/g, '') // Minifica o XML

    if (sectPrIndex !== -1) {
      contentXml = contentXml.substring(0, sectPrIndex) + insertEndString + contentXml.substring(sectPrIndex)
    } else {
      const bodyEndIndex = contentXml.lastIndexOf('</w:body>')
      contentXml = contentXml.substring(0, bodyEndIndex) + insertEndString + contentXml.substring(bodyEndIndex)
    }

    zip.file("word/document.xml", contentXml)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    })

    // Monta os dados para o loop
    const eleitoresData = eleitores.map((el, index) => ({
      ...mapEleitorToTags(el),
      page_break: index < eleitores.length - 1 // Não insere quebra de página no último eleitor
    }))

    doc.render({ eleitores_loop: eleitoresData })

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    saveAs(out, `${nomeBaseDoc}_Mala_Direta_Unificada_${new Date().getTime()}.docx`)

  } else {
    // ==========================================
    // MODO: ARQUIVOS SEPARADOS NO FORMATO .ZIP
    // ==========================================
    const zipResult = new JSZip()

    for (let i = 0; i < eleitores.length; i++) {
      const eleitor = eleitores[i]

      let zip
      try {
        zip = new PizZip(fileContent)
      } catch (e) {
        throw new Error("Arquivo não parece ser um documento Word .docx válido.")
      }

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' }
      })

      const dataObj = mapEleitorToTags(eleitor)
      doc.render(dataObj)

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      const safeName = dataObj.nome.replace(/[^a-zA-Z0-9]/g, '_') || 'Sem_Nome'
      const nomeArquivo = `${nomeBaseDoc}_${safeName}_${i}.docx`
      zipResult.file(nomeArquivo, out)
    }

    const content = await zipResult.generateAsync({ type: 'blob' })
    saveAs(content, `Mala_Direta_${new Date().getTime()}.zip`)
  }
}
