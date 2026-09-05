const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'EtiquetasView.tsx');

let code = fs.readFileSync(p, 'utf8');

if (!code.includes('importEtiquetasEmMassa')) {
  // Fix Import
  code = code.replace(
    /import \{ createEtiqueta, updateEtiqueta, deleteEtiqueta \} from '@\/lib\/actions'/,
    "import { createEtiqueta, updateEtiqueta, deleteEtiqueta, importEtiquetasEmMassa } from '@/lib/actions'"
  );

  // Add State
  code = code.replace(
    /const \[isOpenForm, setIsOpenForm\] = useState\(false\)/,
    "const [isOpenForm, setIsOpenForm] = useState(false)\n  const [isOpenImportForm, setIsOpenImportForm] = useState(false)\n  const [importTexto, setImportTexto] = useState('')\n  const [importCategoria, setImportCategoria] = useState('Evento')\n  const [importCor, setImportCor] = useState(PALETA_CORES[0].hex)"
  );

  // Add handler
  const handlerStr = `
  const handleImportEtiquetas = () => {
    if (!importTexto.trim()) {
      setErrorMsg('O campo de texto está vazio.')
      return
    }
    setErrorMsg('')
    startTransition(async () => {
      const res = await importEtiquetasEmMassa(importCategoria, importCor, importTexto)
      if (res.success) {
        alert(\`Importação concluída!\\n\\n\${res.inseridos} etiquetas novas cadastradas.\\n\${res.ignorados} ignoradas (já existiam).\`)
        setIsOpenImportForm(false)
        setImportTexto('')
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao importar.')
      }
    })
  }
  `;
  code = code.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{/, handlerStr + '\n  const handleSubmit = async (e: React.FormEvent) => {');

  // Add button to header
  code = code.replace(
    /<Button\n            onClick=\{handleOpenCreate\}\n            variant="primary"\n            leftIcon=\{<Plus className="w-4 h-4" \/>\}\n          >\n            Nova Etiqueta\n          <\/Button>/,
    `<div className="flex gap-2">
            <Button onClick={() => { setErrorMsg(''); setImportTexto(''); setIsOpenImportForm(true); }} variant="outline" className="bg-slate-700 hover:bg-slate-800 text-white border-0">
              Importar em Massa
            </Button>
            <Button onClick={handleOpenCreate} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Nova Etiqueta
            </Button>
          </div>`
  );

  // Add Modal HTML
  const modalStr = `
      {/* Modal de Importação em Massa */}
      {isOpenImportForm && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-lg w-full relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Importar Etiquetas em Lote</h3>
              <button onClick={() => setIsOpenImportForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium leading-tight">{errorMsg}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Categoria Comum *</label>
                  <select
                    value={importCategoria}
                    onChange={e => setImportCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isPending}
                  >
                    <option value="Bairro">Bairro</option>
                    <option value="Evento">Evento</option>
                    <option value="Profissão">Profissão</option>
                    <option value="Interesse">Interesse</option>
                    <option value="Origem">Origem</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Cor Comum *</label>
                  <select
                    value={importCor}
                    onChange={e => setImportCor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    disabled={isPending}
                    style={{ color: importCor }}
                  >
                    {PALETA_CORES.map(c => (
                      <option key={c.hex} value={c.hex} style={{ color: c.hex }}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Lista de Nomes (1 por linha) *</label>
                <textarea
                  value={importTexto}
                  onChange={(e) => setImportTexto(e.target.value)}
                  placeholder="Encontro no Centro\\nReunião com Professores\\nPalestra Jovem"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[160px] font-mono"
                  disabled={isPending}
                />
                <p className="text-[11px] text-slate-400">Copie do Excel e cole acima. Nomes já cadastrados no sistema serão ignorados.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button onClick={() => setIsOpenImportForm(false)} variant="secondary" size="sm" disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleImportEtiquetas} variant="primary" size="sm" disabled={isPending || !importTexto}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isPending ? 'Importando...' : 'Iniciar Importação'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
  `;

  code = code.replace(/\{\/\* Modal de Cadastro\/Edição \*\/\}/, modalStr + '\n      {/* Modal de Cadastro/Edição */}');

  fs.writeFileSync(p, code);
  console.log('UI for Tags bulk import added');
}
