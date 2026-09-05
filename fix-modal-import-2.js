const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'LocalidadesView.tsx');

let code = fs.readFileSync(p, 'utf8');

const modalStr = `
      {/* Modal de Importação em Massa */}
      {isMounted && isOpenImportForm && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-lg w-full relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Importar Bairros em Lote</h3>
              <Button onClick={() => setIsOpenImportForm(false)} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {bairroError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium leading-tight">{bairroError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Selecione a Cidade *</label>
                <select
                  value={importCidadeId}
                  onChange={e => setImportCidadeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isPending}
                >
                  <option value="">Selecione...</option>
                  {cidades.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Lista de Bairros (1 por linha) *</label>
                <textarea
                  value={importTexto}
                  onChange={(e) => setImportTexto(e.target.value)}
                  placeholder="Centro\\nJardim América\\nZona Sul"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[160px] font-mono"
                  disabled={isPending}
                />
                <p className="text-[11px] text-slate-400">Copie do Excel e cole acima. Bairros repetidos serão ignorados automaticamente.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button onClick={() => setIsOpenImportForm(false)} variant="secondary" size="sm" disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleImportBairros} variant="primary" size="sm" disabled={isPending || !importCidadeId || !importTexto}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isPending ? 'Importando...' : 'Iniciar Importação'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
`;

code = code.replace(/\{\/\* Modal Cidade \*\/\}/, modalStr + '\n      {/* Modal Cidade */}');

fs.writeFileSync(p, code);
