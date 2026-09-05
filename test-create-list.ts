import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  console.log('Testing raw prisma.listaTransmissao.create...')
  try {
    const res = await prisma.listaTransmissao.create({
      data: {
        nome: 'Lista Teste raw ' + Date.now(),
        tipo: 'FILTRO',
        bairroId: null,
        temperatura: null,
      }
    })
    console.log('Created List successfully:', res)
  } catch (err: any) {
    console.error('Test catch error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
