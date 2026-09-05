import React from 'react'
import { getContasMaster, getPlanos } from '@/lib/superadmin-actions'
import SuperAdminView from '@/components/SuperAdminView'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const [contas, planos] = await Promise.all([
    getContasMaster(),
    getPlanos()
  ])

  return (
    <SuperAdminView contas={contas} planos={planos} />
  )
}
