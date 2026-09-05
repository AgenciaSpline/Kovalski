const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixLogin() {
    const usuarios = await prisma.usuario.findMany();
    console.log(`Encontrados ${usuarios.length} usuários.`);

    for (const u of usuarios) {
        // Checa se a senha não começa com a assinatura do Bcrypt
        if (!u.senha.startsWith('$2a$') && !u.senha.startsWith('$2b$')) {
            console.log(`Arrumando senha para o email: ${u.email}`);
            const hash = await bcrypt.hash(u.senha, 10);
            await prisma.usuario.update({
                where: { id: u.id },
                data: { senha: hash }
            });
        }
    }
    console.log("Feito! Todas as senhas agora estão criptografadas.");
}

fixLogin().catch(console.error).finally(() => prisma.$disconnect());
