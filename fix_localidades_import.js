const fs = require('fs');
const path = '/root/projeto/crm-eleitoral/src/components/LocalidadesView.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace('previewBairrosImport, confirmarImportBairros } from', 'previewBairrosImport, confirmarImportBairros, previewCidadesImport, confirmarImportCidades } from');
const cityImportState = `
  // Importação de Cidades
  const [isOpenImportCidadeForm, setIsOpenImportCidadeForm] = useState(false)
  const [importCidadeTexto, setImportCidadeTexto] = useState('')
  const [importCidadeStep, setImportCidadeStep] = useState<'input' | 'review'>('input')
  const [previewCidadeResult, setPreviewCidadeResult] = useState<{
    exatos: { nomeOriginal: string; nomeExistente: string; id: string }[]
    similares: { nomeOriginal: string; sugestao: { id: string; nome: string; distancia: number } }[]
    novos: string[]
  } | null>(null)
  const [reconciliacoesCidade, setReconciliacoesCidade] = useState<Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>>(new Map())
  const [cidadeImportError, setCidadeImportError] = useState('')
`;
code = code.replace("const [reconciliacoes, setReconciliacoes] = useState<Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>>(new Map())", "const [reconciliacoes, setReconciliacoes] = useState<Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>>(new Map())\n" + cityImportState);
const cityHandlers = `
  const handleAnalyzeCidades = () => {
    if (!importCidadeTexto.trim()) {
      setCidadeImportError('O campo de texto está vazio.')
      return
    }
    setCidadeImportError('')
    startTransition(async () => {
      const nomes = importCidadeTexto.split('\\n').map(l => l.trim()).filter(l => l.length > 0)
      const res = await previewCidadesImport(nomes)
      if (res.success && res.exatos && res.similares && res.novos) {
        setPreviewCidadeResult({ exatos: res.exatos, similares: res.similares, novos: res.novos })
        const init = new Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>()
        for (const s of res.similares) {
          init.set(s.nomeOriginal, { acao: 'usar_existente', mapearPara: s.sugestao.id })
        }
        for (const n of res.novos) {
          init.set(n, { acao: 'criar_novo' })
        }
        setReconciliacoesCidade(init)
        setImportCidadeStep('review')
      } else {
        setCidadeImportError(res.error || 'Erro ao analisar cidades.')
      }
    })
  }

  const handleConfirmImportCidades = () => {
    if (!previewCidadeResult) return
    startTransition(async () => {
      const paraConfirmar: { nome: string; mapearPara?: string }[] = []
      for (const novo of previewCidadeResult.novos) {
        const dec = reconciliacoesCidade.get(novo)
        if (dec?.acao === 'criar_novo') {
          paraConfirmar.push({ nome: novo })
        }
      }
      for (const sim of previewCidadeResult.similares) {
        const dec = reconciliacoesCidade.get(sim.nomeOriginal)
        if (dec?.acao === 'criar_novo') {
          paraConfirmar.push({ nome: sim.nomeOriginal })
        } else if (dec?.acao === 'usar_existente' && dec.mapearPara) {
          paraConfirmar.push({ nome: sim.nomeOriginal, mapearPara: dec.mapearPara })
        }
      }
      if (paraConfirmar.length === 0) {
        alert('Nenhuma cidade selecionada para importar.')
        resetImportCidadeModal()
        return
      }
      const res = await confirmarImportCidades(paraConfirmar)
      if (res.success) {
        alert(`Importação concluída!\\n\\n${res.inseridos} cidades novas cadastradas.\\n${res.mapeados} cidades mapeadas para existentes.\\n${previewCidadeResult.exatos.length} cidades já existiam (ignoradas).`)
        resetImportCidadeModal()
      } else {
        setCidadeImportError(res.error || 'Erro ao confirmar importação.')
      }
    })
  }
  const resetImportCidadeModal = () => {
    setIsOpenImportCidadeForm(false)
    setImportCidadeTexto('')
    setImportCidadeStep('input')
    setPreviewCidadeResult(null)
    setReconciliacoesCidade(new Map())
    setCidadeImportError('')
  }
`;
code = code.replace('  const resetImportModal = () => {', cityHandlers + '\n  const resetImportModal = () => {');
const importButtonCidade = `
              <Button onClick={() => setIsOpenImportCidadeForm(true)} variant="secondary" size="sm" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200">
                <FileSearch className="w-4 h-4 mr-2 text-slate-500" />
                Importar Lote
              </Button>`;
code = code.replace('<Plus className="w-4 h-4 mr-2" />\n                Nova Cidade\n              </Button>', '<Plus className="w-4 h-4 mr-2" />\n                Nova Cidade\n              </Button>' + importButtonCidade);
const importModalCidadeUI = `
      {/* Modal de Importação em Massa de Cidades */}
      {isMounted && isOpenImportCidadeForm && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className={\`bg-white border border-slate-200 rounded-xl p-6 shadow-xl relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8 ${importCidadeStep === 'review' ? 'max-w-2xl w-full' : 'max-w-lg w-full'}\`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {importCidadeStep === 'review' && (
                  <button
                    onClick={() => { setImportCidadeStep('input'); setPreviewCidadeResult(null); setReconciliacoesCidade(new Map()); setCidadeImportError(''); }}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Voltar"
                  >
                    <ArrowRight className="w-4 h-4 text-slate-500 rotate-180" />
                  </button>
                )}
                <h3 className="font-bold text-slate-800 text-lg">
                  {importCidadeStep === 'input' ? 'Importar Cidades em Lote' : 'Revisar Cidades'}
                </h3>
              </div>
              <Button onClick={resetImportCidadeModal} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Etapa 1: Inserir texto */}
            {importCidadeStep === 'input' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Lista de Cidades (1 por linha) *</label>
                  <textarea
                    value={importCidadeTexto}
                    onChange={(e) => setImportCidadeTexto(e.target.value)}
                    placeholder={"São Paulo\\nRio de Janeiro\\nCampinas"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[160px] font-mono"
                    disabled={isPending}
                  />
                  <p className="text-[11px] text-slate-400">Copie do Excel e cole acima. O sistema vai analisar antes de importar.</p>
                </div>
              </div>
            )}

            {/* Etapa 2: Conciliação */}
            {importCidadeStep === 'review' && previewCidadeResult && (
              <div className="space-y-4">
                {cidadeImportError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 font-medium leading-tight">{cidadeImportError}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-4 text-sm mb-4">
                  <div className="flex flex-col">
                    <span className="text-blue-900 font-semibold">{previewCidadeResult.exatos.length}</span>
                    <span className="text-blue-700 text-xs">Exatos (Ignorados)</span>
                  </div>
                  <div className="w-px bg-blue-200"></div>
                  <div className="flex flex-col">
                    <span className="text-amber-700 font-semibold">{previewCidadeResult.similares.length}</span>
                    <span className="text-amber-600 text-xs">Similares (Revisão)</span>
                  </div>
                  <div className="w-px bg-blue-200"></div>
                  <div className="flex flex-col">
                    <span className="text-green-700 font-semibold">{previewCidadeResult.novos.length}</span>
                    <span className="text-green-600 text-xs">Novos (Criar)</span>
                  </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-6">
                  {/* NOVOS */}
                  {previewCidadeResult.novos.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Novas Cidades ({previewCidadeResult.novos.length})
                      </h4>
                      {previewCidadeResult.novos.map((novo, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                          <span className="font-medium text-slate-700">{novo}</span>
                          <select 
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary-500"
                            value={reconciliacoesCidade.get(novo)?.acao || 'criar_novo'}
                            onChange={e => {
                              const val = e.target.value as any
                              const newMap = new Map(reconciliacoesCidade)
                              if (val === 'ignorar') newMap.set(novo, { acao: 'ignorar' })
                              else newMap.set(novo, { acao: 'criar_novo' })
                              setReconciliacoesCidade(newMap)
                            }}
                          >
                            <option value="criar_novo">Criar Novo</option>
                            <option value="ignorar">Ignorar (Não importar)</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SIMILARES */}
                  {previewCidadeResult.similares.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Cidades Similares Encontradas ({previewCidadeResult.similares.length})
                      </h4>
                      {previewCidadeResult.similares.map((sim, i) => {
                        const decisao = reconciliacoesCidade.get(sim.nomeOriginal)
                        return (
                          <div key={i} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-800">{sim.nomeOriginal}</span>
                              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                Sugestão: {sim.sugestao.nome}
                              </span>
                            </div>
                            <select 
                              className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-amber-500"
                              value={decisao?.acao === 'usar_existente' ? decisao.mapearPara : decisao?.acao}
                              onChange={e => {
                                const val = e.target.value
                                const newMap = new Map(reconciliacoesCidade)
                                if (val === 'criar_novo') newMap.set(sim.nomeOriginal, { acao: 'criar_novo' })
                                else if (val === 'ignorar') newMap.set(sim.nomeOriginal, { acao: 'ignorar' })
                                else newMap.set(sim.nomeOriginal, { acao: 'usar_existente', mapearPara: val })
                                setReconciliacoesCidade(newMap)
                              }}
                            >
                              <option value={sim.sugestao.id}>✓ Mapear para: {sim.sugestao.nome}</option>
                              {cidades.filter(c => c.id !== sim.sugestao.id).map(c => (
                                <option key={c.id} value={c.id}>Mapear para: {c.nome}</option>
                              ))}
                              <option value="criar_novo">+ Criar como nova cidade</option>
                              <option value="ignorar">✕ Ignorar (Não importar)</option>
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="pt-2 flex justify-end gap-3">
              <Button onClick={resetImportCidadeModal} variant="secondary" size="sm" disabled={isPending}>
                Cancelar
              </Button>
              {importCidadeStep === 'input' ? (
                <Button onClick={handleAnalyzeCidades} variant="primary" size="sm" disabled={isPending || !importCidadeTexto}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSearch className="w-4 h-4 mr-2" />}
                  {isPending ? 'Analisando...' : 'Analisar'}
                </Button>
              ) : (
                <Button onClick={handleConfirmImportCidades} variant="primary" size="sm" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {isPending ? 'Importando...' : 'Confirmar Importação'}
                </Button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
`;
code = code.replace('{/* Modal de Importação em Massa */}', importModalCidadeUI + '\n      {/* Modal de Importação em Massa */}');
fs.writeFileSync(path, code);
console.log('LocalidadesView updated with Cidades import feature!');
