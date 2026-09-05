const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'LocalidadesView.tsx');

let code = fs.readFileSync(p, 'utf8');

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
