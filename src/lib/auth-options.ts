import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        console.log("NextAuth: Tentando autorizar:", credentials?.email)
        if (!credentials?.email || !credentials?.senha) {
          console.log("NextAuth: Faltou credencial")
          throw new Error("Credenciais inválidas")
        }

        try {
          console.log("NextAuth: Buscando usuario no banco...")
          const usuario = await prisma.usuario.findUnique({
            where: { email: credentials.email },
            include: { conta: true }
          })

          if (!usuario) {
            console.log("NextAuth: Usuário não encontrado")
            throw new Error("Usuário não encontrado")
          }
          console.log("NextAuth: Usuario encontrado. ID:", usuario.id, "ContaId:", usuario.contaId)

          console.log("NextAuth: Verificando senha bcrypt...")
          const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha)
          console.log("NextAuth: Senha verificada:", senhaValida)

          if (!senhaValida) {
            console.log("NextAuth: Senha incorreta")
            throw new Error("Senha incorreta")
          }

          console.log("NextAuth: Autorização concluída com sucesso.")
          return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nome,
            role: usuario.role,
            contaId: usuario.contaId,
            // REMOVIDO: fotoPerfil estava explodindo o limite de 4KB do Cookie do Cloudflare
            // fotoPerfil: usuario.fotoPerfil
          }
        } catch (error) {
          console.error("NextAuth: Erro CRITICO dentro do authorize:", error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.contaId = user.contaId
      }
      return token
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.contaId = token.contaId as string | null
        // fotoPerfil removida da sessão para evitar erros 502 por tamanho de Cookie
        session.user.fotoPerfil = null
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  session: {
    strategy: "jwt" as any,
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET || "uma-chave-muito-segura-e-secreta-para-o-kovalski-crm-2026",
}
