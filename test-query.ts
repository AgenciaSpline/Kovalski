import prisma from './src/lib/prisma'

async function run() {
  console.log('Testing query on prisma using src/lib/prisma...')
  try {
    const lists = await prisma.listaTransmissao.findMany()
    console.log('Successfully retrieved lists:', lists)
  } catch (err: any) {
    console.error('Query error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
