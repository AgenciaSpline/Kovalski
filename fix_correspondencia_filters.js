const fs = require('fs');
const path = '/root/projeto/crm-eleitoral/src/components/CorrespondenciaView.tsx';
let code = fs.readFileSync(path, 'utf8');
const oldFilterUI = code.substring(
  code.indexOf('{/* Filtros de Destinatários */}'),
  code.indexOf('                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">')
);

const newFilterUI = `{/* Filtros de Destinatários */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Bairro
                      </label>
                      <select
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterBairro}
                        onChange={(e) => setFilterBairro(e.target.value)}
                      >
                        <option value="todos">Todos os Bairros</option>
                        {bairros.map(b => (
                          <option key={b.id} value={b.id}>{b.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Temperatura
                      </label>
                      <select
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterTemp}
                        onChange={(e) => setFilterTemp(Number(e.target.value))}
                      >
                        <option value="0">Todas</option>
                        <option value="1">1 - Frio (0%)</option>
                        <option value="2">2 - Morno (30%)</option>
                        <option value="3">3 - Quente (60%)</option>
                        <option value="4">4 - Super Quente (90%)</option>
                        <option value="5">5 - Convertido (100%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Endereço (Rua/Av)
                      </label>
                      <select
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterRua}
                        onChange={(e) => setFilterRua(e.target.value as any)}
                      >
                        <option value="todos">Qualquer (Com ou Sem)</option>
                        <option value="com_rua">Somente COM rua</option>
                        <option value="sem_rua">Somente SEM rua</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Endereço (Número)
                      </label>
                      <select
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterNumero}
                        onChange={(e) => setFilterNumero(e.target.value as any)}
                      >
                        <option value="todos">Qualquer (Com ou Sem)</option>
                        <option value="com_numero">Somente COM número</option>
                        <option value="sem_numero">Somente SEM número</option>
                      </select>
