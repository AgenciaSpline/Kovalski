'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Button } from './ui/Button'

export interface SelectOption {
  id: string
  nome: string
  categoria: string
  cor: string
}

interface MultiSelectProps {
  options: SelectOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
}

export default function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "Selecione as etiquetas..."
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id))

  const filteredOptions = options.filter(opt =>
    opt.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter(selectedId => selectedId !== id))
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Etiquetas / Categorias
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white shadow-sm flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500"
      >
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 text-sm select-none">{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span
                key={opt.id}
                style={{ backgroundColor: opt.cor + '20', color: opt.cor, borderColor: opt.cor }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              >
                {opt.nome}
                <Button
                  type="button"
                  onClick={(e) => handleRemove(opt.id, e)}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-slate-200/50 rounded-full p-0.5 h-auto w-auto transition-colors cursor-pointer outline-none focus:outline-none ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </span>
            ))
          )}
        </div>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Buscar etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-slate-400 text-center">Nenhuma etiqueta encontrada.</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selectedIds.includes(opt.id)
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-50 cursor-pointer text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: opt.cor }}
                      />
                      <div>
                        <span className="font-medium text-slate-700">{opt.nome}</span>
                        <span className="text-xs text-slate-400 ml-2">({opt.categoria})</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
