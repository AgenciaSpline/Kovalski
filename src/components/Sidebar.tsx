'use client'

import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, Users, Tag, Award, Menu, X, MapPin, Send, ClipboardList, Mail, LogOut, ShieldAlert, ChevronUp, ChevronsLeft, ChevronsRight, UserCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { signOut, useSession } from 'next-auth/react'
import { updateFotoPerfil } from '@/lib/actions'

const PenguinIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Mask to hollow out the face/belly area so it's transparent */}
    <mask id="penguin-salute-mask">
      {/* Everything white is visible */}
      <rect x="0" y="0" width="24" height="24" fill="#FFFFFF" />
      {/* Everything black is cut out (made transparent) */}
      <path
        d="M12 4.5C9.5 4.5 8 6 8 8.5C8 10 9 11 10.5 11.5C9 12.5 8 14.5 8 17C8 19.5 9.8 20 12 20C14.2 20 16 19.5 16 17C16 14.5 15 12.5 13.5 11.5C15 11 16 10 16 8.5C16 6 14.5 4.5 12 4.5Z"
        fill="#000000"
      />
    </mask>

    {/* Main body group with the mask applied */}
    <g mask="url(#penguin-salute-mask)" fill="currentColor">
      {/* Head and torso */}
      <path d="M12 2.5C8 2.5 5 5.5 5 9.5C5 12 6 15 6.5 17.5C6.5 19 8 20.5 12 20.5C16 20.5 17.5 19 17.5 17.5C18 15 19 12 19 9.5C19 5.5 16 2.5 12 2.5Z" />
      {/* Resting left arm */}
      <path d="M5.5 11.5C4.2 12.5 3.5 14 3.5 15.5C3.5 16.5 4.5 17 5.5 16.5C6.5 15.8 7 14.2 7 11.5Z" />
      {/* Feet */}
      <path d="M9.5 20.5C9 21.5 9.5 22.5 10.5 22.5C11.5 22.5 11.5 21 11.5 20.5ZM14.5 20.5C14.5 21 14.5 22.5 15.5 22.5C16.5 22.5 17 21.5 16.5 20.5Z" />
    </g>

    {/* Saluting right arm (touches the head) */}
    <path
      d="M17.5 11.5C19 11.5 21 10 21 8.5C21 7.2 19.5 6 17 6C16.2 6 15 6.3 14.5 6.5C14.5 7 15 7.5 16 7.5C17.5 7.5 19 8.2 19 8.8C19 9.5 18 10 17 10Z"
      fill="currentColor"
    />

    {/* Eyes and Beak (drawn inside the cutout face area in currentColor) */}
    <circle cx="10" cy="8" r="0.9" fill="currentColor" />
    <circle cx="14" cy="8" r="0.9" fill="currentColor" />
    <path d="M12 9C12.5 9 12.8 9.8 12 10.5C11.2 9.8 11.5 9 12 9Z" fill="currentColor" />
  </svg>
)

interface SidebarProps {
  currentTab: 'dashboard' | 'eleitores' | 'etiquetas' | 'localidades' | 'listatransmissao' | 'formularios' | 'correspondencia' | 'usuarios'
  onChangeTab: (tab: 'dashboard' | 'eleitores' | 'etiquetas' | 'localidades' | 'listatransmissao' | 'formularios' | 'correspondencia' | 'usuarios') => void
  isMobileOpen: boolean
  onToggleMobile: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({
  currentTab,
  onChangeTab,
  isMobileOpen,
  onToggleMobile,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const { data: session, update: updateSession } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Profile picture upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'eleitores', label: 'Eleitores', icon: Users },
    { id: 'etiquetas', label: 'Etiquetas', icon: Tag },
    { id: 'listatransmissao', label: 'Lista de Transmissão', icon: Send },
    { id: 'formularios', label: 'Formulários', icon: ClipboardList },
    { id: 'correspondencia', label: 'Mala Direta', icon: Mail },
    { id: 'localidades', label: 'Localidades', icon: MapPin }
  ] as const

  const handleNav = (tab: any) => {
    onChangeTab(tab)
    if (isMobileOpen) {
      onToggleMobile()
    }
    setIsProfileMenuOpen(false)
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verifica tamanho da imagem (ex: max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.')
      return
    }

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        const userId = (session?.user as any)?.id
        if (!userId) {
          alert('Erro ao identificar o usuário.')
          setIsUploading(false)
          return
        }

        const result = await updateFotoPerfil(userId, base64String)
        if (result.success) {
          // Atualiza a sessão NextAuth para exibir a nova imagem imediatamente
          await updateSession({ fotoPerfil: base64String })
          setIsProfileMenuOpen(false)
        } else {
          alert(result.error || 'Erro ao salvar a foto.')
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error(error)
      alert('Erro ao processar a imagem.')
      setIsUploading(false)
    }
  }

  return (
    <>
      {/* Desktop Sidebar (Left-positioned) */}
      <aside className={`hidden md:flex flex-col h-screen sticky top-0 z-40 border-r border-slate-800 bg-slate-900 text-white transition-[width] duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-[4.5rem]' : 'w-64'}`}>
        {/* Sidebar Header / Brand */}
        <div className={`border-b border-slate-850 flex items-center ${isCollapsed ? 'justify-center px-0 py-5' : 'px-6 py-6 gap-3'}`}>
          <PenguinIcon className="w-8 h-8 flex-shrink-0" />
          <div className={`whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            <h1 className="font-extrabold text-base tracking-wide leading-none text-white">Kovalski</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">Gestão de Campanha</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 py-6 space-y-1.5 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          {menuItems.map(item => {
            const active = currentTab === item.id
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                onClick={() => handleNav(item.id)}
                variant="ghost"
                title={isCollapsed ? item.label : undefined}
                className={`w-full rounded-lg text-sm font-semibold transition-all h-auto ${
                  isCollapsed
                    ? 'justify-center px-0 py-3'
                    : 'justify-start gap-3 px-4 py-3'
                } ${
                  active
                    ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 bg-transparent'
                }`}
                leftIcon={<Icon className="w-4 h-4 flex-shrink-0" />}
              >
                <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
              </Button>
            )
          })}
        </nav>

        {/* Sidebar Footer (User info & Logout) */}
        <div className={`border-t border-slate-850 bg-slate-950/40 relative ${isCollapsed ? 'p-3' : 'p-4'}`} ref={profileMenuRef}>
          {isProfileMenuOpen && (
            <div className={`absolute bottom-full mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ${isCollapsed ? 'left-2 right-2' : 'left-4 right-4'}`}>
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                }}
                disabled={isUploading}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 text-left disabled:opacity-50 disabled:cursor-wait"
              >
                <UserCircle className="w-4 h-4" />
                <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  {isUploading ? 'Enviando...' : 'Meu Perfil (Foto)'}
                </span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureUpload}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />
              {isAdmin && (
                <button
                  onClick={() => handleNav('usuarios')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 text-left"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                    Acessos e Equipe
                  </span>
                </button>
              )}
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
                  signOut({ callbackUrl: url })
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  Sair do Sistema
                </span>
              </button>
            </div>
          )}

          <div
            className={`flex items-center cursor-pointer group hover:bg-slate-800/50 rounded-lg transition-colors ${isCollapsed ? 'justify-center p-2' : 'justify-between p-2 -mx-2'}`}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            title={isCollapsed ? (session?.user?.name || 'Carregando...') : undefined}
          >
            <div className="flex items-center gap-3">
              {(session?.user as any)?.fotoPerfil ? (
                <img
                  src={(session?.user as any).fotoPerfil}
                  alt="Foto de perfil"
                  className="w-9 h-9 rounded-full object-cover border-2 border-slate-700 group-hover:border-slate-600 transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-200 group-hover:bg-slate-600 transition-colors">
                  {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'CC'}
                </div>
              )}
              <div className={`whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                <div className="text-xs font-bold text-slate-300 max-w-[100px] truncate group-hover:text-white transition-colors">{session?.user?.name || 'Carregando...'}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase group-hover:text-slate-400 transition-colors">{isAdmin ? 'Administrador' : 'Assistente'}</div>
              </div>
            </div>
            {!isCollapsed && <ChevronUp className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />}
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-full py-3 border-t border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile Nav Topbar */}
      <header className="md:hidden bg-slate-900 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <PenguinIcon className="w-8 h-8 flex-shrink-0" />
          <span className="font-extrabold text-sm tracking-wider">KOVALSKI</span>
        </div>
        <Button
          onClick={onToggleMobile}
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Overlay Menu */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-950/60 transition-opacity" onClick={onToggleMobile}>
          <div
            className="w-64 bg-slate-900 h-full flex flex-col animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-850 flex items-center gap-2.5">
              <PenguinIcon className="w-8 h-8 flex-shrink-0" />
              <div>
                <h1 className="font-bold text-sm text-white">Kovalski</h1>
                <span className="text-[9px] text-slate-500 font-bold block uppercase">Gestão de Campanha</span>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {menuItems.map(item => {
                const active = currentTab === item.id
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    variant="ghost"
                    className={`w-full justify-start gap-3 px-4 py-3.5 rounded-lg text-sm font-bold transition-colors h-auto ${
                      active
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 bg-transparent'
                    }`}
                    leftIcon={<Icon className="w-4 h-4 flex-shrink-0" />}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </nav>
            <div className="p-4 border-t border-slate-850 relative">
              {isProfileMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click()
                    }}
                    disabled={isUploading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 text-left disabled:opacity-50 disabled:cursor-wait"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>{isUploading ? 'Enviando...' : 'Meu Perfil (Foto)'}</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleNav('usuarios')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 text-left"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Acessos e Equipe
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
                      signOut({ callbackUrl: url })
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair do Sistema
                  </button>
                </div>
              )}

              <div
                className="flex items-center justify-between cursor-pointer group hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="flex items-center gap-3">
                  {(session?.user as any)?.fotoPerfil ? (
                    <img
                      src={(session?.user as any).fotoPerfil}
                      alt="Foto de perfil"
                      className="w-9 h-9 rounded-full object-cover border-2 border-slate-700 group-hover:border-slate-600 transition-colors"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-200 group-hover:bg-slate-600 transition-colors">
                      {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'CC'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{session?.user?.name || 'Carregando...'}</div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase group-hover:text-slate-400 transition-colors">{isAdmin ? 'Administrador' : 'Assistente'}</div>
                  </div>
                </div>
                <ChevronUp className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
