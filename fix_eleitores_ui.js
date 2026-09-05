const fs = require('fs');
const path = '/root/projeto/crm-eleitoral/src/components/EleitoresView.tsx';
let code = fs.readFileSync(path, 'utf8');
const oldReconUI = `                <h3 className=\"font-bold text-slate-800 text-xl text-center mb-2\">Mapeamento de Bairros</h3>
                <p className=\"text-sm text-slate-600 mb-6 text-center\">
                  Identificamos alguns bairros na sua planilha que não existem exatamente com esse nome no sistema.
                  Para evitar duplicidade, mapeie-os para os bairros corretos ou confirme que são novos.
                </p>

                <div className=\"max-h-[50vh] overflow-y-auto border border-slate-200 rounded-lg\">
                  <table className=\"w-full text-left text-sm\">
                    <thead className=\"bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0\">
                      <tr>
                        <th className=\"px-4 py-3 font-semibold\">Bairro na Planilha</th>
                        <th className=\"px-4 py-3 font-semibold\">Mapear para Bairro no Sistema</th>
                      </tr>
                    </thead>
                    <tbody className=\"divide-y divide-slate-100\">
                      {importModal.unmappedBairros?.map(bairroPlanilha => (
                        <tr key={bairroPlanilha} className=\"hover:bg-slate-50/50\">
                          <td className=\"px-4 py-3 font-medium text-slate-800\">
                            {bairroPlanilha}
                          </td>
                          <td className=\"px-4 py-3\">
                            <select
                              value={bairroMapping[bairroPlanilha] || 'CREATE_NEW'}
                              onChange={(e) => setBairroMapping({ ...bairroMapping, [bairroPlanilha]: e.target.value })}
                              className=\"w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2\">
                              <option value=\"CREATE_NEW\" className=\"font-bold text-emerald-600\">✨ Cadastrar como NOVO Bairro</option>
                              <optgroup label=\"Bairros Existentes no Sistema\">
                                {bairros.map(b => (
                                  <option key={b.id} value={b.id}>{b.nome} {b.cidade ? \`(${b.cidade.nome})\` : ''}</option>
                                ))}
                              </optgroup>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>`;
const newReconUI = `                <h3 className=\"font-bold text-slate-800 text-xl text-center mb-2\">Mapeamento de Localidades</h3>
                <p className=\"text-sm text-slate-600 mb-6 text-center\">
                  {importModal.message}
                  Para evitar duplicidade, mapeie-os para os registros corretos ou confirme que são novos.
                </p>

                <div className=\"max-h-[50vh] overflow-y-auto space-y-6\">
                  {importModal.unmappedCidades && importModal.unmappedCidades.length > 0 && (
                    <div className=\"border border-slate-200 rounded-lg\">
                      <div className=\"bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700 sticky top-0\">
                        Cidades Desconhecidas
                      </div>
                      <table className=\"w-full text-left text-sm\">
                        <thead className=\"bg-white border-b border-slate-100 text-slate-500\">
                          <tr>
                            <th className=\"px-4 py-2 font-medium w-1/2\">Cidade na Planilha</th>
                            <th className=\"px-4 py-2 font-medium w-1/2\">Mapear para Sistema</th>
                          </tr>
                        </thead>
                        <tbody className=\"divide-y divide-slate-100 bg-white\">
                          {importModal.unmappedCidades.map(cidadePlanilha => (
                            <tr key={cidadePlanilha} className=\"hover:bg-slate-50/50\">
                              <td className=\"px-4 py-3 font-medium text-slate-800\">{cidadePlanilha}</td>
                              <td className=\"px-4 py-3\">
                                <select
                                  value={cidadeMapping[cidadePlanilha] || 'CREATE_NEW'}
                                  onChange={(e) => setCidadeMapping({ ...cidadeMapping, [cidadePlanilha]: e.target.value })}
                                  className=\"w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2\">
                                  <option value=\"CREATE_NEW\" className=\"font-bold text-emerald-600\">✨ Cadastrar como NOVA Cidade</option>
                                  <optgroup label=\"Cidades Existentes no Sistema\">
                                    {cidades.map(c => (
                                      <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {importModal.unmappedBairros && importModal.unmappedBairros.length > 0 && (
                    <div className=\"border border-slate-200 rounded-lg\">
                      <div className=\"bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700 sticky top-0\">
                        Bairros Desconhecidos
                      </div>
                      <table className=\"w-full text-left text-sm\">
                        <thead className=\"bg-white border-b border-slate-100 text-slate-500\">
                          <tr>
                            <th className=\"px-4 py-2 font-medium w-1/2\">Bairro na Planilha</th>
                            <th className=\"px-4 py-2 font-medium w-1/2\">Mapear para Sistema</th>
                          </tr>
                        </thead>
                        <tbody className=\"divide-y divide-slate-100 bg-white\">
                          {importModal.unmappedBairros.map(bairroPlanilha => (
                            <tr key={bairroPlanilha} className=\"hover:bg-slate-50/50\">
                              <td className=\"px-4 py-3 font-medium text-slate-800\">{bairroPlanilha}</td>
                              <td className=\"px-4 py-3\">
                                <select
                                  value={bairroMapping[bairroPlanilha] || 'CREATE_NEW'}
                                  onChange={(e) => setBairroMapping({ ...bairroMapping, [bairroPlanilha]: e.target.value })}
                                  className=\"w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2\">
                                  <option value=\"CREATE_NEW\" className=\"font-bold text-emerald-600\">✨ Cadastrar como NOVO Bairro</option>
                                  <optgroup label=\"Bairros Existentes no Sistema\">
                                    {bairros.map(b => (
                                      <option key={b.id} value={b.id}>{b.nome} {b.cidade ? \`(${b.cidade.nome})\` : ''}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>`;

code = code.replace(oldReconUI, newReconUI);

fs.writeFileSync(path, code);
