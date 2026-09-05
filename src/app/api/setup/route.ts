import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const p = path.join(process.cwd(), 'src', 'lib', 'actions.ts');
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
      if (['historicoEleitor', 'disparoLog', 'eleitorEtiqueta', 'formularioEtiqueta', 'listaTransmissaoEtiqueta', 'listaTransmissaoEleitor'].includes(model)) return match;
      return `${match}\n        contaId: user.contaId,`;
    });

    // We do simple global replacement for where clauses avoiding nested deep complexities
    const entities = ['cidade', 'bairro', 'etiqueta', 'eleitor', 'disparo', 'formulario', 'listaTransmissao', 'correspondenciaTemplate'];

    entities.forEach(entity => {
      modified = modified.replace(new RegExp(`prisma\\.${entity}\\.findMany\\(\\{([\\s\\S]*?)\\}\\)`, 'g'), (match, body) => {
        if (!body.includes('where:')) return `prisma.${entity}.findMany({ where: { contaId: user.contaId }, ${body} })`;
        return match.replace(/where:\s*\{/g, 'where: { contaId: user.contaId, ');
      });
      modified = modified.replace(new RegExp(`prisma\\.${entity}\\.findUnique\\(\\{([\\s\\S]*?)\\}\\)`, 'g'), (match, body) => {
        return match.replace(/where:\s*\{/g, 'where: { contaId: user.contaId, ');
      });
      modified = modified.replace(new RegExp(`prisma\\.${entity}\\.findFirst\\(\\{([\\s\\S]*?)\\}\\)`, 'g'), (match, body) => {
        return match.replace(/where:\s*\{/g, 'where: { contaId: user.contaId, ');
      });
      modified = modified.replace(new RegExp(`prisma\\.${entity}\\.count\\(\\{([\\s\\S]*?)\\}\\)`, 'g'), (match, body) => {
        if (!body.includes('where:')) return `prisma.${entity}.count({ where: { contaId: user.contaId }, ${body} })`;
        return match.replace(/where:\s*\{/g, 'where: { contaId: user.contaId, ');
      });
      modified = modified.replace(new RegExp(`prisma\\.${entity}\\.update\\(\\{([\\s\\S]*?)\\}\\)`, 'g'), (match, body) => {
        return match.replace(/where:\s*\{/g, 'where: { contaId: user.contaId, ');
      });
      modified = modified.replace(new RegExp(`prisma\\.${entity}\\.delete\\(\\{([\\s\\S]*?)\\}\\)`, 'g'), (match, body) => {
        return match.replace(/where:\s*\{/g, 'where: { contaId: user.contaId, ');
      });
    });

    fs.writeFileSync(p, modified);

    return NextResponse.json({ success: true, message: "Ações refatoradas com sucesso." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}