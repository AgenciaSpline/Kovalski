const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'EtiquetasView.tsx');

let code = fs.readFileSync(p, 'utf8');

// Remove color state
code = code.replace(/const \[importCor, setImportCor\] = useState\(PALETA_CORES\[0\]\.hex\)\n/, '');

// Fix Modal UI to just show Categoria
code = code.replace(
  /<div className="grid grid-cols-1 gap-4">[\s\S]*?<\/div>\n              <\/div>/,
  `<div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Categoria *</label>
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
              </div>`
);

fs.writeFileSync(p, code);
