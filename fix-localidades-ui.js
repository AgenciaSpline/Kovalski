const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'LocalidadesView.tsx');

let code = fs.readFileSync(p, 'utf8');

if (!code.includes('importBairrosEmMassa')) {
  // Replace the import to include the new backend action
  code = code.replace(
    /import \{ createCidade, updateCidade, deleteCidade, createBairro, updateBairro, deleteBairro \} from '@\/lib\/actions'/,
    "import { createCidade, updateCidade, deleteCidade, createBairro, updateBairro, deleteBairro, importBairrosEmMassa } from '@/lib/actions'"
  );

  // Add the state variables for the modal
  code = code.replace(
    /const \[bairroError, setBairroError\] = useState\(''\)/,
    "const [bairroError, setBairroError] = useState('')\n  const [isOpenImportForm, setIsOpenImportForm] = useState(false)\n  const [importTexto, setImportTexto] = useState('')\n  const [importCidadeId, setImportCidadeId] = useState('')"
  );

  // Add the import handler
  const handlerStr = `
  const handleImportBairros = () => {
    if (!importCidadeId) {
      setBairroError('Selecione uma cidade para importar.')
      return
    }
    if (!importTexto.trim()) {
      setBairroError('O campo de texto está vazio.')
      return
    }
    setBairroError('')
    startTransition(async () => {
      const res = await importBairrosEmMassa(importCidadeId, importTexto)
      if (res.success) {
        alert(\`Importação concluída!\\n\\n\${res.inseridos} bairros novos cadastrados.\\n\${res.ignorados} bairros ignorados (já existiam).\`)
        setIsOpenImportForm(false)
        setImportTexto('')
        setImportCidadeId('')
        onRefresh()
      } else {
        setBairroError(res.error || 'Erro ao importar.')
      }
    })
  }
  `;
  code = code.replace(/const handleSaveBairro = \(\) => \{/, handlerStr + '\n  const handleSaveBairro = () => {');

  // Add the Import Button to the UI
  code = code.replace(
    /<Button\n              onClick=\{handleOpenCreateBairro\}\n              disabled=\{cidades\.length === 0\}\n              variant="primary"\n              size="sm"\n              leftIcon=\{<Plus className="w-3\.5 h-3\.5" \/>\}\n            >\n              Novo Bairro\n            <\/Button>/,
    `<div className="flex gap-2">
            <Button
              onClick={() => {
                setBairroError('')
                setImportTexto('')
                setImportCidadeId(cidades.length > 0 ? cidades[0].id : '')
                setIsOpenImportForm(true)
              }}
              variant="outline"
              size="sm"
            >
              Importar em Massa
            </Button>
            <Button
              onClick={handleOpenCreateBairro}
              disabled={cidades.length === 0}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Novo Bairro
            </Button>
            </div>`
  );

  // Add the Import Modal Component HTML
  const modalStr = `
      {/* Modal de Importação em Massa */}
      {isOpenImportForm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Importar Bairros em Massa</h3>
              <button onClick={() => setIsOpenImportForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bairroError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 leading-tight">{bairroError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Selecione a Cidade *</label>
                <select
                  value={importCidadeId}
                  onChange={e => setImportCidadeId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow disabled:bg-slate-50"
                  disabled={isPending}
                >
                  <option value="">Selecione...</option>
                  {cidades.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Cole a lista de Bairros (1 por linha) *</label>
                <textarea
                  value={importTexto}
                  onChange={(e) => setImportTexto(e.target.value)}
                  placeholder="Centro\\nJardim América\\nZona Sul"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow disabled:bg-slate-50 min-h-[160px]"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button onClick={() => setIsOpenImportForm(false)} variant="outline" disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleImportBairros} variant="primary" disabled={isPending || !importCidadeId || !importTexto}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Importar'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
  `;

  code = code.replace(/\{isOpenCidadeForm && createPortal\(/, modalStr + '\n      {isOpenCidadeForm && createPortal(');

  fs.writeFileSync(p, code);
  console.log('UI for Bulk Import added to LocalidadesView');
}
