const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'SuperAdminView.tsx');

let code = fs.readFileSync(p, 'utf8');

if (!code.includes('RenovarPlanoModal')) {
  code = code.replace(
    /import \{ createCliente, alternarStatusConta \} from '@\/lib\/superadmin-actions'/,
    "import { createCliente, alternarStatusConta } from '@/lib/superadmin-actions'\nimport RenovarPlanoModal from './RenovarPlanoModal'"
  );

  code = code.replace(
    /const \[modalAberto, setModalAberto\] = useState\(false\)/,
    "const [modalAberto, setModalAberto] = useState(false)\n  const [renovarContaId, setRenovarContaId] = useState<string | null>(null)"
  );

  code = code.replace(
    /\{conta\.status === 'ATIVO' \? 'Bloquear' : 'Desbloquear'\}\n                      <\/button>\n                    <\/td>/,
    "{conta.status === 'ATIVO' ? 'Bloquear' : 'Desbloquear'}\n                      </button>\n                      <button onClick={() => setRenovarContaId(conta.id)} className=\"ml-2 text-sm px-3 py-1.5 rounded font-medium transition bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20\">Renovar</button>\n                    </td>"
  );

  code = code.replace(
    /<\/div>\n  \)\n\}/,
    "      {renovarContaId && <RenovarPlanoModal contaId={renovarContaId} onClose={() => setRenovarContaId(null)} />}\n\n    </div>\n  )\n}"
  );

  fs.writeFileSync(p, code);
  console.log('SuperAdminView updated to include the renew button');
}
