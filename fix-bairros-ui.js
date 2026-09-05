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
    /const \[modalBairroAberto, setModalBairroAberto\] = useState\(false\)/,
    "const [modalBairroAberto, setModalBairroAberto] = useState(false)\n  const [modalImportAberto, setModalImportAberto] = useState(false)\n  const [importTexto, setImportTexto] = useState('')\n  const [importCidadeId, setImportCidadeId] = useState('')"
  );

  // Add the import handler
  const handlerStr = `
  const handleImport = () => {
    if (!importCidadeId) {
      alert("Selecione a cidade primeiro!")
      return
    }
    if (!importTexto.trim()) {
      alert("Cole a lista de bairros (um por linha)!")
      return
    }

    startTransition(async () => {
      const res = await importBairrosEmMassa(importCidadeId, importTexto)
      if (res.success) {
        alert(\`Importação concluída!\\n\\n\${res.inseridos} bairros novos cadastrados.\\n\${res.ignorados} bairros ignorados (já existiam).\`)
        setModalImportAberto(false)
        setImportTexto('')
        setImportCidadeId('')
      } else {
        alert(res.error)
      }
    })
  }
  `;
  code = code.replace(/const handleSaveBairro = \(\) => \{/, handlerStr + '\n  const handleSaveBairro = () => {');

  // Add the Import Button to the UI
  code = code.replace(
    /<Button\n              onClick=\{.*?setModalBairroAberto\(true\).*?\n              className="bg-indigo-600 hover:bg-indigo-700 text-white"\n            >\n              <Plus className="w-4 h-4 mr-2" \/>\n              Novo Bairro\n            <\/Button>/,
    `<Button onClick={() => setModalImportAberto(true)} className="bg-slate-700 hover:bg-slate-800 text-white mr-2">
              Importar em Massa
            </Button>
            <Button
              onClick={() => { setEditBairroId(null); setNomeBairro(''); setCidadeSelecionadaId(''); setModalBairroAberto(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Bairro
            </Button>`
  );

  // Add the Import Modal Component HTML
  const modalStr = `
      {/* Modal Importação em Massa */}
      {modalImportAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Importar Bairros em Massa</h2>
              <button onClick={() => setModalImportAberto(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade Destino *</label>
                <select
                  value={importCidadeId}
                  onChange={e => setImportCidadeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">Selecione a cidade...</option>
                  {cidades.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lista de Bairros (Um por linha)</label>
                <p className="text-xs text-slate-500 mb-2">Copie e cole do Excel. Nós vamos ignorar os que já existirem no banco.</p>
                <textarea
                  value={importTexto}
                  onChange={e => setImportTexto(e.target.value)}
                  rows={10}
                  placeholder="Centro\\nZona Sul\\nJardim América\\n..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <Button onClick={() => setModalImportAberto(false)} variant="outline">Cancelar</Button>
              <Button onClick={handleImport} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isPending ? 'Importando...' : 'Iniciar Importação'}
              </Button>
            </div>
          </div>
        </div>
      )}
  `;

  code = code.replace(/\{modalBairroAberto && \(/, modalStr + '\n      {modalBairroAberto && (');

  fs.writeFileSync(p, code);
  console.log('UI for Bulk Import added');
}
