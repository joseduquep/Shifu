// File: `lib/services/sync/sync-orchestrator.ts`
/**
 * Sync Orchestrator
 * Manages the full and incremental sync process with audit logging
 */

import { supabaseAdmin } from '@/lib/supabase/admin-client';
import type { MappedProfessor } from './data-mapper';

export type SyncType = 'full' | 'incremental' | 'manual';
export type SyncStatus = 'started' | 'completed' | 'failed' | 'partial';

export interface SyncOptions {
    syncType: SyncType;
    dryRun?: boolean;
    forceUpdate?: boolean; // Ignore last_synced_at checks
    userId?: string; // User who triggered the sync
}

export interface SyncResult {
    auditLogId: string;
    status: SyncStatus;
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsSkipped: number;
    recordsFailed: number;
    errors: Array<{ externalId: string; error: string }>;
    details: Record<string, unknown>;
}

export interface ProcessRecordResult {
    action: 'created' | 'updated' | 'skipped' | 'failed';
    profesorId?: string;
    reason?: string;
    diff?: Record<string, { old: unknown; new: unknown }>;
    error?: string;
}

/**
 * Orchestrates data synchronization with the database
 */
import type { PostgrestError } from '@supabase/supabase-js'

export class SyncOrchestrator {
    private supabase = supabaseAdmin;
    private configurationId?: string;

    constructor(configurationId?: string) {
        this.configurationId = configurationId;
    }

    /**
     * Start a sync operation
     */
    async sync(
        professors: MappedProfessor[],
        options: SyncOptions,
    ): Promise<SyncResult> {
        const startTime = new Date();

        // Create audit log entry
        const auditLogId = await this.createAuditLog(options, startTime);

        const result: SyncResult = {
            auditLogId,
            status: 'started',
            recordsProcessed: 0,
            recordsCreated: 0,
            recordsUpdated: 0,
            recordsSkipped: 0,
            recordsFailed: 0,
            errors: [],
            details: {
                startTime: startTime.toISOString(),
                dryRun: options.dryRun || false,
            },
        };

        try {
            // Process each professor
            for (const professor of professors) {
                const processResult = await this.processRecord(professor, options);

                if (processResult.action === 'failed') {
                    console.error('[SYNC][FAILED]', {
                        external_id: professor.external_id,
                        nombre: professor.nombre_completo,
                        reason: processResult.reason,
                        error: processResult.error,
                    });
                } else {
                    console.log('[SYNC]', processResult.action.toUpperCase(), {
                        external_id: professor.external_id,
                        nombre: professor.nombre_completo,
                        reason: processResult.reason,
                    });
                }

                result.recordsProcessed++;

                switch (processResult.action) {
                    case 'created':
                        result.recordsCreated++;
                        break;
                    case 'updated':
                        result.recordsUpdated++;
                        break;
                    case 'skipped':
                        result.recordsSkipped++;
                        break;
                    case 'failed':
                        result.recordsFailed++;
                        result.errors.push({
                            externalId: professor.external_id,
                            error: processResult.error || 'Unknown error',
                        });
                        break;
                }

                // Log individual record
                await this.logRecord(auditLogId, professor, processResult);
            }

            // Determine final status
            result.status =
                result.recordsFailed > 0
                    ? result.recordsFailed === result.recordsProcessed
                        ? 'failed'
                        : 'partial'
                    : 'completed';

            // Update audit log with final results
            await this.updateAuditLog(auditLogId, result, new Date());

            // Update configuration's last sync time
            if (this.configurationId && !options.dryRun) {
                await this.updateConfigurationSyncTime(options.syncType);
            }
        } catch (error) {
            result.status = 'failed';
            result.details.error = error instanceof Error ? error.message : 'Unknown error';

            await this.updateAuditLog(auditLogId, result, new Date());
            throw error;
        }

        return result;
    }

    /**
     * Process a single professor record
     */
    private async processRecord(
        professor: MappedProfessor,
        options: SyncOptions,
    ): Promise<ProcessRecordResult> {
        try {
            // 1) Buscar existente por external_id
            const { data: existing, error: fetchError } = await this.supabase
                .from('profesores')
                .select('*')
                .eq('external_id', professor.external_id)
                .maybeSingle();

            if (fetchError) {
                return {
                    action: 'failed',
                    error: `Database error: ${fetchError.message}`,
                };
            }

            // 2) Opt-out
            if (existing && !existing.sync_enabled) {
                return {
                    action: 'skipped',
                    profesorId: existing.id,
                    reason: 'opt_out',
                };
            }

            // 3) No existe -> crear
            if (!existing) {
                return await this.createProfessor(professor, options);
            }

            // 4) Existe -> actualizar
            return await this.updateProfessor(existing, professor, options);
        } catch (error) {
            return {
                action: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Create a new professor record
     */
    private async createProfessor(
        professor: MappedProfessor,
        options: SyncOptions,
    ): Promise<ProcessRecordResult> {
        if (options.dryRun) {
            return { action: 'created', reason: 'dry_run' };
        }

        // Resolver departamento
        const departamentoId = await this.findOrCreateDepartment(
            professor.departamento_nombre || 'General',
            professor.universidad_nombre || 'Universidad EAFIT',
        );

        if (!departamentoId) {
            return { action: 'failed', error: 'Could not find or create department' };
        }

        const { data, error } = await this.supabase
            .from('profesores')
            .insert({
                nombre_completo: professor.nombre_completo,
                email: professor.email,
                bio: professor.bio,
                departamento_id: departamentoId,
                external_id: professor.external_id,
                external_source: professor.external_source,
                raw_scraped_data: professor.raw_scraped_data,
                last_synced_at: new Date().toISOString(),
                sync_enabled: true,
                manual_override_fields: [],
                fotografia: professor.fotografia ?? null, // NUEVO
            })
            .select()
            .single();

        if (error) {
            // Duplicado por external_id -> actualizar
            if ((error as PostgrestError).code === '23505') {
                const { data: existing } = await this.supabase
                    .from('profesores')
                    .select('id, fotografia')
                    .eq('external_id', professor.external_id)
                    .maybeSingle();

                if (existing?.id) {
                    const { error: updErr } = await this.supabase
                        .from('profesores')
                        .update({
                            nombre_completo: professor.nombre_completo,
                            email: professor.email,
                            bio: professor.bio,
                            departamento_id: departamentoId,
                            raw_scraped_data: professor.raw_scraped_data,
                            last_synced_at: new Date().toISOString(),
                            fotografia: professor.fotografia ?? (existing as { fotografia?: string | null }).fotografia ?? null, // NUEVO
                        })
                        .eq('id', existing.id);

                    if (updErr) {
                        console.error('[SYNC][UPSERT->UPDATE][ERROR]', updErr);
                        return { action: 'failed', error: `Upsert update error: ${updErr.message}` };
                    }

                    return { action: 'updated', profesorId: existing.id };
                }
            }

            const pgErr = error as PostgrestError
            console.error('[SYNC][INSERT][ERROR]', {
                external_id: professor.external_id,
                message: error.message,
                details: pgErr.details,
                hint: pgErr.hint,
                code: pgErr.code,
            });

            return {
                action: 'failed',
                error: `Insert error: ${error.message} ${pgErr.details || ''}`.trim(),
            };
        }

        const created = data as { id: string }
        return { action: 'created', profesorId: created.id };
    }

    /**
     * Update an existing professor record
     */
    private async updateProfessor(
        existing: {
            id: string
            departamento_id?: string | null
            sync_enabled?: boolean
            manual_override_fields?: string[]
            [key: string]: unknown
        },
        professor: MappedProfessor,
        options: SyncOptions,
    ): Promise<ProcessRecordResult> {
        const manualOverrideFields = (existing.manual_override_fields as string[]) || [];

        // Base de actualizaciones
        const updates: Record<string, unknown> = {
            last_synced_at: new Date().toISOString(),
            raw_scraped_data: professor.raw_scraped_data,
        };

        const diff: Record<string, { old: unknown; new: unknown }> = {};
        let hasChanges = false;

        // Intentar resolver el nuevo departamento (si viene nombre)
        let desiredDepartamentoId: string | null = null;
        if (professor.departamento_nombre || professor.universidad_nombre) {
            desiredDepartamentoId = await this.findOrCreateDepartment(
                professor.departamento_nombre || 'General',
                professor.universidad_nombre || 'Universidad EAFIT',
            );
        }

        // Campos a sincronizar (respetando overrides)
        const fieldsToSync: Array<{ field: string; value: unknown }> = [
            { field: 'nombre_completo', value: professor.nombre_completo },
            { field: 'email', value: professor.email },
            { field: 'bio', value: professor.bio },
            { field: 'fotografia', value: professor.fotografia }, // NUEVO
        ];

        // Incluir cambio de departamento si aplica
        if (desiredDepartamentoId && desiredDepartamentoId !== existing.departamento_id) {
            fieldsToSync.push({ field: 'departamento_id', value: desiredDepartamentoId });
        }

        for (const { field, value } of fieldsToSync) {
            // Si está overrideado manualmente, saltar
            if (manualOverrideFields.includes(field) || (field === 'departamento_id' && manualOverrideFields.includes('departamento'))) {
                continue;
            }

            if (existing[field] !== value && value !== undefined) {
                diff[field] = { old: existing[field], new: value };
                updates[field] = value;
                hasChanges = true;
            }
        }

        // Nada por cambiar
        if (!hasChanges) {
            if (!options.dryRun) {
                await this.supabase.from('profesores').update({ last_synced_at: updates.last_synced_at }).eq('id', existing.id);
            }
            return { action: 'skipped', profesorId: existing.id, reason: 'no_changes' };
        }

        // Dry run
        if (options.dryRun) {
            return { action: 'updated', profesorId: existing.id, reason: 'dry_run', diff };
        }

        // Actualizar
        const { error } = await this.supabase.from('profesores').update(updates).eq('id', existing.id);

        if (error) {
            const pgErr = error as PostgrestError
            console.error('[SYNC][UPDATE][ERROR]', {
                id: existing.id,
                external_id: (existing as { external_id?: string }).external_id,
                message: error.message,
                details: pgErr.details,
                hint: pgErr.hint,
                code: pgErr.code,
            });
            return {
                action: 'failed',
                profesorId: existing.id,
                error: `Update error: ${error.message} ${pgErr.details || ''}`.trim(),
            };
        }

        return { action: 'updated', profesorId: existing.id, diff };
    }

    /**
     * Find or create a department
     */
    private async findOrCreateDepartment(
        departmentName: string,
        universidadNombre: string,
    ): Promise<string | null> {
        // 1) Universidad
        const uniRes = await this.supabase
            .from('universidades')
            .select('id')
            .ilike('nombre', universidadNombre)
            .maybeSingle();
        let universidad = uniRes.data;
        const uniError = uniRes.error;

        if (uniError && (uniError as PostgrestError).code !== 'PGRST116') {
            console.error('Error finding universidad:', uniError);
            return null;
        }

        if (!universidad) {
            const { data: newUni, error: createUniError } = await this.supabase
                .from('universidades')
                .insert({ nombre: universidadNombre })
                .select()
                .single();

            if (createUniError) {
                console.error('Error creating universidad:', createUniError);
                return null;
            }
            universidad = newUni;
        }

        // 2) Departamento
        const deptRes = await this.supabase
            .from('departamentos')
            .select('id')
            .eq('universidad_id', universidad!.id)
            .ilike('nombre', departmentName)
            .maybeSingle();
        let departamento = deptRes.data;
        const deptError = deptRes.error;

        if (deptError && (deptError as PostgrestError).code !== 'PGRST116') {
            console.error('Error finding departamento:', deptError);
            return null;
        }

        if (!departamento) {
            const { data: newDept, error: createDeptError } = await this.supabase
                .from('departamentos')
                .insert({
                    nombre: departmentName,
                    universidad_id: universidad!.id,
                })
                .select()
                .single();

            if (createDeptError) {
                console.error('Error creating departamento:', createDeptError);
                return null;
            }

            departamento = newDept;
        }

        return departamento!.id;
    }

    /**
     * Create an audit log entry
     */
    private async createAuditLog(
        options: SyncOptions,
        startTime: Date,
    ): Promise<string> {
        const { data, error } = await this.supabase
            .from('sync_audit_logs')
            .insert({
                configuration_id: this.configurationId || null,
                sync_type: options.syncType,
                status: 'started',
                started_at: startTime.toISOString(),
                created_by: options.userId || null,
                details: {
                    dryRun: options.dryRun || false,
                    forceUpdate: options.forceUpdate || false,
                },
            })
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Failed to create audit log: ${error?.message}`);
        }

        return (data as { id: string }).id;
    }

    /**
     * Update audit log with final results
     */
    private async updateAuditLog(
        auditLogId: string,
        result: SyncResult,
        completedAt: Date,
    ): Promise<void> {
        await this.supabase
            .from('sync_audit_logs')
            .update({
                status: result.status,
                completed_at: completedAt.toISOString(),
                records_processed: result.recordsProcessed,
                records_created: result.recordsCreated,
                records_updated: result.recordsUpdated,
                records_skipped: result.recordsSkipped,
                records_failed: result.recordsFailed,
                error_message:
                    result.errors.length > 0 ? result.errors.map((e) => e.error).join('; ') : null,
                details: result.details,
            })
            .eq('id', auditLogId);
    }

    /**
     * Log individual record processing
     */
    private async logRecord(
        auditLogId: string,
        professor: MappedProfessor,
        result: ProcessRecordResult,
    ): Promise<void> {
        await this.supabase.from('sync_record_logs').insert({
            audit_log_id: auditLogId,
            external_id: professor.external_id,
            profesor_id: result.profesorId || null,
            action: result.action,
            reason: result.reason || null,
            diff: result.diff || null,
            error_message: result.error || null,
        });
    }

    /**
     * Update configuration's last sync time
     */
    private async updateConfigurationSyncTime(syncType: SyncType): Promise<void> {
        if (!this.configurationId) return;

        const field = syncType === 'full' ? 'last_full_sync_at' : 'last_incremental_sync_at';

        await this.supabase
            .from('sync_configurations')
            .update({ [field]: new Date().toISOString() })
            .eq('id', this.configurationId);
    }
}
