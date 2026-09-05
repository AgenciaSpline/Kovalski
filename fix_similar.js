const fs = require('fs');
const path = '/root/projeto/crm-eleitoral/src/lib/actions.ts';
let code = fs.readFileSync(path, 'utf8');
const oldFindSimilar = `      let melhorSimilaridade = 0\n      let melhorMatch = null\n      for (const c of existentes) {\n        const sim = similaridadeTexto(normalizado, normalizeText(c.nome))\n        if (sim > melhorSimilaridade) {\n          melhorSimilaridade = sim\n          melhorMatch = c\n        }\n      }\n      if (melhorSimilaridade >= 0.7 && melhorMatch) {\n        similares.push({ nomeOriginal: nome, sugestao: { id: melhorMatch.id, nome: melhorMatch.nome, distancia: melhorSimilaridade } })\n      } else {\n        novos.push(nome)\n      }`;
const newFindSimilar = `      const matchSimilar = findClosestMatch(nome, existentes, 3)\n      if (matchSimilar) {\n        similares.push({\n          nomeOriginal: nome,\n          sugestao: {\n            id: matchSimilar.item.id,\n            nome: matchSimilar.item.nome,\n            distancia: matchSimilar.distance\n          }\n        })\n      } else {\n        novos.push(nome)\n      }`;
code = code.replace(oldFindSimilar, newFindSimilar);
fs.writeFileSync(path, code);
