  const fs = require('fs');
  let content = fs.readFileSync('/root/projeto/crm-eleitoral/src/lib/actions.ts', 'utf8');
  content = content.replace(/contaId:\s*user\.contaId,\s*contaId:\s*user\.contaId/g, 'contaId: user.contaId');
  content = content.replace(/contaId:\s*user\.contaId,\s*contaId,/g, 'contaId: user.contaId,');
  content = content.replace(/contaId:\s*user\.contaId,\s*contaId\b/g, 'contaId: user.contaId');
  content = content.replace(/where: { contaId: user\.contaId },\s*where,/g, 'where,');
  content = content.replace(/where: { contaId: user\.contaId,\s*id }/g, 'where: { id }');
  content = content.replace(/where: { contaId: user\.contaId,  id }/g, 'where: { id }');
  content = content.replace(/where: { contaId: user\.contaId,  id: formId }/g, 'where: { id: formId }');
  fs.writeFileSync('/root/projeto/crm-eleitoral/src/lib/actions.ts', content);
  console.log("Fixed!");
  EOF
  node /root/projeto/crm-eleitoral/fix.js
  cd /root/projeto/crm-eleitoral && npx tsc --noEmit && npm run build
