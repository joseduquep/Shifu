"use client"

import { useState } from 'react'

export default function SyncQuickAction() {
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    async function runSync() {
        try {
            setLoading(true)
            setMsg(null)
            // 1) Obtener configuraciones
            let res = await fetch('/api/admin/sync/configurations', { cache: 'no-store' })
            let configs = [] as any[]
            if (res.ok) configs = await res.json()

            // 2) Crear por defecto si no existe
            let configId = configs[0]?.id as string | undefined
            if (!configId) {
                const createRes = await fetch('/api/admin/sync/configurations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'EAFIT Professors',
                        source_url: 'https://www.eafit.edu.co/nuestros-profesores',
                        enabled: true,
                        schedule_cron: '0 2 * * *',
                        field_mappings: {},
                    }),
                })
                if (!createRes.ok) throw new Error('No se pudo crear la configuración de sync')
                const created = await createRes.json()
                configId = created.id
            }

            // 3) Ejecutar sync completo
            const syncRes = await fetch('/api/admin/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configurationId: configId, syncType: 'full', dryRun: false }),
            })
            if (!syncRes.ok) throw new Error('La sincronización falló')
            const result = await syncRes.json()
            setMsg(`Sync ${result.status}. Creados: ${result.recordsCreated}, Actualizados: ${result.recordsUpdated}, Omitidos: ${result.recordsSkipped}, Fallidos: ${result.recordsFailed}`)
        } catch (e) {
            setMsg(e instanceof Error ? e.message : 'Error al sincronizar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button onClick={runSync} disabled={loading} className="px-3 py-1.5 rounded-md border border-white/15 text-white/80 hover:text-white hover:border-white/30 text-xs disabled:opacity-60">
                {loading ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
            {msg && <div className="text-xs text-white/60">{msg}</div>}
        </div>
    )
}


