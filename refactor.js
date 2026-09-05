const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'lib', 'actions.ts');

let code = fs.readFileSync(p, 'utf8');

if (!code.includes("import { getCurrentUser }")) {
  code = code.replace("import * as bcrypt from 'bcryptjs'", "import * as bcrypt from 'bcryptjs'\nimport { getCurrentUser } from './auth'");
}

const lines = code.split('\n');
const result = [];

const PUBLIC_FUNCTIONS = ['createEleitorPublic', 'createEleitorPublicComForm', 'getFormulario'];
let currentFunc = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('export async function')) {
    const nameMatch = line.match(/export async function (\w+)/);
    if (nameMatch) currentFunc = nameMatch[1];
  }

  result.push(line);

  if (line.trim() === 'try {' && currentFunc && !PUBLIC_FUNCTIONS.includes(currentFunc)) {
    const isArrayReturn = ['getUsuarios', 'getEtiquetas', 'getCidades', 'getBairros', 'getEleitores', 'getLideres', 'getDisparos', 'getFormularios', 'getListasTransmissao', 'getCorrespondenciaTemplates'].includes(currentFunc);

    const returnVal = isArrayReturn ? 'return []' : "return { success: false, error: 'Acesso negado. Usuário sem conta.' }";

    result.push(`    const user = await getCurrentUser()`);
    result.push(`    if (!user || !user.contaId) ${returnVal}`);
  }
}

let modified = result.join('\n');

// Inject contaId on Creates
modified = modified.replace(/prisma\.(\w+)\.create\(\{\s*data:\s*\{/g, (match, model) => {
  if (model === 'historicoEleitor' || model === 'disparoLog' || model === 'eleitorEtiqueta' || model === 'formularioEtiqueta' || model === 'listaTransmissaoEtiqueta' || model === 'listaTransmissaoEleitor') return match;
  return `${match}\n        contaId: user.contaId,`;
});

// Inject contaId on where clauses for findMany, findFirst, findUnique, update, delete, count, groupBy
const methodsToFilter = ['findMany', 'findFirst', 'findUnique', 'update', 'delete', 'count', 'groupBy'];
methodsToFilter.forEach(method => {
  const regex = new RegExp(`prisma\\.(\\w+)\\.${method}\\(\\{([^{]*?)(where:\\s*\\{)([^}]*?)\\}`, 'g');
  modified = modified.replace(regex, (match, model, pre, whereClause, whereBody) => {
    if (model === 'historicoEleitor' || model === 'disparoLog' || model === 'eleitorEtiqueta' || model === 'formularioEtiqueta' || model === 'listaTransmissaoEtiqueta' || model === 'listaTransmissaoEleitor' || model === 'usuario') {
        // Para usuario o filtro já deve ser tratado por auth ou podemos não injetar globalmente cega.
        return match;
    }
    // Inject contaId inside the where block
    const trimmedWhere = whereBody.trim();
    if (trimmedWhere.length > 0 && !trimmedWhere.includes('contaId')) {
      return `prisma.${model}.${method}({${pre}where: { contaId: user.contaId, ${trimmedWhere} }`;
    }
    return match;
  });

  // Find cases with NO where clause
  const noWhereRegex = new RegExp(`prisma\\.(\\w+)\\.${method}\\(\\{([\\s\\S]*?)\\}\\)`, 'g');
  modified = modified.replace(noWhereRegex, (match, model, body) => {
    if (model === 'historicoEleitor' || model === 'disparoLog' || model === 'eleitorEtiqueta' || model === 'formularioEtiqueta' || model === 'listaTransmissaoEtiqueta' || model === 'listaTransmissaoEleitor' || model === 'usuario' || PUBLIC_FUNCTIONS.includes(currentFunc)) return match;

    if (!body.includes('where:')) {
        return `prisma.${model}.${method}({ where: { contaId: user.contaId }, ${body} })`;
    }
    return match;
  });
});

// Fix Public Form Create (revert contaId if added accidentally)
modified = modified.replace(/contaId:\s*user\.contaId,\s*nomeCompleto/g, 'nomeCompleto');

fs.writeFileSync(p, modified);
console.log("As ações foram refatoradas com sucesso!");
