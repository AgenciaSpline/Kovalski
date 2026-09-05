const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'SuperAdminView.tsx');

let code = fs.readFileSync(p, 'utf8');

if (!code.includes('EditarClienteModal')) {
  code = code.replace(
    /import RenovarPlanoModal from '.\/RenovarPlanoModal'/,
    "import RenovarPlanoModal from './RenovarPlanoModal'\nimport EditarClienteModal from './EditarClienteModal'"
  );

  code = code.replace(
    /const \[renovarContaId, setRenovarContaId\] = useState<string \| null>\(null\)/,
    "const [renovarContaId, setRenovarContaId] = useState<string | null>(null)\n  const [editarConta, setEditarConta] = useState<any | null>(null)"
  );

  code = code.replace(
    /<button onClick=\{.*?renovar.*?Renovar<\/button>\n                    <\/td>/,
    `<button onClick={() => setRenovarContaId(conta.id)} className="ml-2 text-sm px-3 py-1.5 rounded font-medium transition bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20">Renovar</button>
                      <button onClick={() => setEditarConta(conta)} className="ml-2 text-sm px-3 py-1.5 rounded font-medium transition bg-slate-500/10 text-slate-300 hover:bg-slate-500/20">Editar</button>
                    </td>`
  );

  code = code.replace(
    /\{renovarContaId && <RenovarPlanoModal.*?\/>\}/,
    "{renovarContaId && <RenovarPlanoModal contaId={renovarContaId} onClose={() => setRenovarContaId(null)} />}\n      {editarConta && <EditarClienteModal conta={editarConta} planos={planos} onClose={() => setEditarConta(null)} />}"
  );

  fs.writeFileSync(p, code);
  console.log('SuperAdminView updated to include the Edit button');
}
