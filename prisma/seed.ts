import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando limpeza do banco de dados...')
  // Deletar usuário (para testes limpos) se quiser
  // await prisma.usuario.deleteMany()

  console.log('Verificando Usuário Administrador...')
  const emailAdmin = "admin@kovalski.com"
  const adminExists = await prisma.usuario.findUnique({
    where: { email: emailAdmin }
  })

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.usuario.create({
      data: {
        nome: "Administrador",
        email: emailAdmin,
        senha: hashedPassword,
        role: "ADMIN"
      }
    })
    console.log(`✅ Usuário administrador criado: ${emailAdmin} / admin123`)
  } else {
    console.log(`⚠️ Usuário admin já existe.`)
  }
  await prisma.eleitorEtiqueta.deleteMany()
  await prisma.eleitor.deleteMany()
  await prisma.bairro.deleteMany()
  await prisma.cidade.deleteMany()
  await prisma.etiqueta.deleteMany()
  await prisma.metaCampanha.deleteMany()

  console.log('Criando metas de campanha...')
  const meta = await prisma.metaCampanha.create({
    data: {
      cargoRegiao: 'Vereador - Zona Sul & Centro',
      metaVotos: 2500,
    },
  })
  console.log(`Meta de campanha criada: ${meta.cargoRegiao} - Alvo: ${meta.metaVotos} votos`)

  console.log('Criando etiquetas...')
  const etiquetasData = [
    // Categoria: Evento
    { nome: 'Reunião Centro', categoria: 'Evento', cor: '#3b82f6' }, // Blue
    { nome: 'Caminhada Zona Sul', categoria: 'Evento', cor: '#10b981' }, // Emerald
    { nome: 'Comício Jd. América', categoria: 'Evento', cor: '#8b5cf6' }, // Violet
    // Categoria: Liderança
    { nome: 'Líder de Bairro', categoria: 'Liderança', cor: '#f59e0b' }, // Amber
    { nome: 'Liderança Esportiva', categoria: 'Liderança', cor: '#ec4899' }, // Pink
    { nome: 'Líder Religioso', categoria: 'Liderança', cor: '#ef4444' }, // Red
    // Categoria: Interesse
    { nome: 'Apoio Saúde', categoria: 'Interesse', cor: '#06b6d4' }, // Cyan
    { nome: 'Apoio Educação', categoria: 'Interesse', cor: '#14b8a6' }, // Teal
    { nome: 'Foco Segurança', categoria: 'Interesse', cor: '#64748b' }, // Slate
  ]

  const etiquetas = []
  for (const item of etiquetasData) {
    const et = await prisma.etiqueta.create({ data: item })
    etiquetas.push(et)
  }
  console.log(`${etiquetas.length} etiquetas criadas.`)

  console.log('Criando cidade São Paulo...')
  const cidadeSp = await prisma.cidade.create({
    data: { nome: 'São Paulo' }
  })

  console.log('Criando bairros...')
  const bairrosNomes = ['Centro', 'Jardim América', 'Vila Nova', 'Parque das Flores', 'Ipanema', 'Santa Rita']
  const bairrosCriados = []
  for (const nomeBairro of bairrosNomes) {
    const b = await prisma.bairro.create({
      data: {
        nome: nomeBairro,
        cidadeId: cidadeSp.id
      }
    })
    bairrosCriados.push(b)
  }

  console.log('Criando eleitores (leads)...')
  const nomes = [
    'Ana Souza', 'Bruno Lima', 'Carlos Rocha', 'Diana Costa', 'Eduardo Santos',
    'Fernanda Oliveira', 'Gabriel Silva', 'Helena Rodrigues', 'Igor Martins', 'Julia Alencar',
    'Kleber Machado', 'Larissa Mendes', 'Maurício Ferreira', 'Natália Gomes', 'Otávio Barbosa',
    'Patrícia Cardoso', 'Quirino Neto', 'Renata Nogueira', 'Samuel Teixeira', 'Tatiana Vieira',
    'Ulysses Guimarães', 'Valéria Antunes', 'Wagner Fonseca', 'Yasmin Paiva', 'Zeca Camargo'
  ]

  const eleitores = []
  for (let i = 0; i < nomes.length; i++) {
    // Gerar um telefone de teste único
    const fone = `551199${String(i).padStart(2, '0')}${String(i * 3).padStart(3, '0')}`

    // Gerar temperatura de 1 a 5 de forma pseudo-aleatória equilibrada
    // i % 5 + 1 dará uma distribuição uniforme de temperaturas de 1 a 5
    const temperatura = (i % 5) + 1
    const bairroCriado = bairrosCriados[i % bairrosCriados.length]

    // Simular idade entre 20 e 60 anos
    const anoNascimento = 1966 + ((i * 2) % 40)
    const mesNascimento = i % 12
    const diaNascimento = (i % 28) + 1
    const dataNascimento = new Date(anoNascimento, mesNascimento, diaNascimento)

    const isLider = i % 5 === 0
    let currentLiderId: string | null = null
    if (!isLider && eleitores.length > 0) {
      const lastLider = [...eleitores].reverse().find(el => el.isLider) as { id: string } | undefined
      if (lastLider) {
        currentLiderId = lastLider.id
      }
    }

    const eleitor = await prisma.eleitor.create({
      data: {
        nomeCompleto: nomes[i],
        telefone: fone,
        logradouro: 'Rua das Flores',
        numero: String(10 + i * 7),
        bairroId: bairroCriado.id,
        cidadeId: cidadeSp.id,
        dataNascimento: dataNascimento,
        temperatura: temperatura,
        isLider: isLider,
        liderId: currentLiderId,
      }
    })
    eleitores.push(eleitor)
  }
  console.log(`${eleitores.length} eleitores criados.`)

  console.log('Associando etiquetas aos eleitores...')
  for (let i = 0; i < eleitores.length; i++) {
    const eleitor = eleitores[i]

    // Cada eleitor terá entre 1 e 3 etiquetas associadas
    const qtdEtiquetas = (i % 3) + 1
    const indicesUtilizados = new Set<number>()

    for (let j = 0; j < qtdEtiquetas; j++) {
      let idxEtiqueta = (i + j * 2) % etiquetas.length

      // Evitar duplicados no mesmo eleitor
      while (indicesUtilizados.has(idxEtiqueta)) {
        idxEtiqueta = (idxEtiqueta + 1) % etiquetas.length
      }
      indicesUtilizados.add(idxEtiqueta)

      const etiqueta = etiquetas[idxEtiqueta]

      await prisma.eleitorEtiqueta.create({
        data: {
          eleitorId: eleitor.id,
          etiquetaId: etiqueta.id,
        }
      })
    }
  }
  console.log('Associações de etiquetas concluídas.')
  console.log('Banco de dados populado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
