import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
console.log("MIDDLEWARE => Acessando:", req.nextUrl.pathname);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "uma-chave-muito-segura-e-secreta-para-o-kovalski-crm-2026" })
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')
  const isFormPage = req.nextUrl.pathname.startsWith('/f/') // Formulários públicos
  const isPublicPage = req.nextUrl.pathname.startsWith('/cadastro') || isApiAuth || req.nextUrl.pathname.startsWith('/api/setup') || req.nextUrl.pathname.startsWith('/api/debug') || isFormPage || req.nextUrl.pathname.startsWith('/test-auth')

  if (isPublicPage) {
    return NextResponse.next()
  }

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token) {
    // Redirecionamento forçado para SuperAdmin
    if (token.role === 'SUPERADMIN' && !req.nextUrl.pathname.startsWith('/superadmin') && !isAuthPage) {
       return NextResponse.redirect(new URL('/superadmin', req.url))
    }
    // Redirecionamento de Tenant comum tentando acessar tela de SuperAdmin
    if (token.role !== 'SUPERADMIN' && req.nextUrl.pathname.startsWith('/superadmin')) {
       return NextResponse.redirect(new URL('/', req.url))
    }

    // Removido o redirecionamento forçado na página de login,
    // pois se o usuário recarregar a tela de login querendo ficar nela (ou para trocar de conta),
    // ele não deve ser forçado de volta ao dashboard automaticamente sem deslogar ou clicar no botão.
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}