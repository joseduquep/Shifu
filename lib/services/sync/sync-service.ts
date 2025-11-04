/**
 * Sync Service
 * Main service for orchestrating web scraping and data synchronization
 */

import { EAFITScraper } from '../scrapers/eafit-scraper';
import { DataMapper } from './data-mapper';
import { SyncOrchestrator, type SyncResult } from './sync-orchestrator';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

export interface SyncConfiguration {
	id: string;
	name: string;
	source_url: string;
	enabled: boolean;
	schedule_cron?: string;
	field_mappings: Record<string, unknown>;
}

/**
 * Main sync service that coordinates scraping, mapping, and database sync
 */
export class SyncService {
	private supabase = supabaseAdmin;
	private scraper = new EAFITScraper();
	private mapper = new DataMapper();

	/**
	 * Run a full sync of all professors
	 */
	async runFullSync(
		configurationId: string,
		options?: { dryRun?: boolean; userId?: string },
	): Promise<SyncResult> {
		console.log(`Starting full sync for configuration: ${configurationId}`);

		// Get configuration
		const config = await this.getConfiguration(configurationId);
		if (!config) {
			throw new Error(`Configuration not found: ${configurationId}`);
		}

		if (!config.enabled) {
			throw new Error(`Configuration is disabled: ${config.name}`);
		}

		// Step 1: Scrape all professors
		console.log('Step 1: Scraping professor data from EAFIT...');
		const scrapeResult = await this.scraper.scrapeAll({
			maxPages: 50, // Limit to prevent infinite loops
		});

		console.log(
			`Scraped ${scrapeResult.totalCount} professors with ${scrapeResult.errors.length} errors`,
		);

		// Step 2: Map scraped data to internal schema
		console.log('Step 2: Mapping scraped data to internal schema...');
		const mappedProfessors = this.mapper.mapProfessors(scrapeResult.professors);

		// Validate mapped data
		const validProfessors = mappedProfessors.filter((prof) => {
			const validation = this.mapper.validate(prof);
			if (!validation.valid) {
				console.warn(
					`Skipping invalid professor ${prof.nombre_completo}:`,
					validation.errors,
				);
			}
			return validation.valid;
		});

		console.log(`${validProfessors.length} valid professors to sync`);

		// Step 3: Sync to database
		console.log('Step 3: Syncing to database...');
		const orchestrator = new SyncOrchestrator(configurationId);
		const syncResult = await orchestrator.sync(validProfessors, {
			syncType: 'full',
			dryRun: options?.dryRun,
			userId: options?.userId,
		});

		console.log('Sync completed:', {
			status: syncResult.status,
			created: syncResult.recordsCreated,
			updated: syncResult.recordsUpdated,
			skipped: syncResult.recordsSkipped,
			failed: syncResult.recordsFailed,
		});

		return syncResult;
	}

	/**
	 * Run an incremental sync (only changed records)
	 */
	async runIncrementalSync(
		configurationId: string,
		options?: { dryRun?: boolean; userId?: string },
	): Promise<SyncResult> {
		console.log(`Starting incremental sync for configuration: ${configurationId}`);

		// Get configuration
		const config = await this.getConfiguration(configurationId);
		if (!config) {
			throw new Error(`Configuration not found: ${configurationId}`);
		}

		if (!config.enabled) {
			throw new Error(`Configuration is disabled: ${config.name}`);
		}

		// For incremental sync, we still need to scrape all professors
		// but we'll rely on the orchestrator to skip unchanged records
		const scrapeResult = await this.scraper.scrapeAll({
			maxPages: 50,
		});

		const mappedProfessors = this.mapper.mapProfessors(scrapeResult.professors);
		const validProfessors = mappedProfessors.filter((prof) =>
			this.mapper.validate(prof).valid,
		);

		const orchestrator = new SyncOrchestrator(configurationId);
		const syncResult = await orchestrator.sync(validProfessors, {
			syncType: 'incremental',
			dryRun: options?.dryRun,
			userId: options?.userId,
		});

		return syncResult;
	}

	/**
	 * Sync a single professor by URL
	 */
	async syncOne(
		url: string,
		configurationId: string,
		options?: { dryRun?: boolean; userId?: string },
	): Promise<SyncResult> {
		const scraped = await this.scraper.scrapeOne(url);
		const mapped = this.mapper.mapProfessor(scraped);

		const validation = this.mapper.validate(mapped);
		if (!validation.valid) {
			throw new Error(`Invalid professor data: ${validation.errors.join(', ')}`);
		}

		const orchestrator = new SyncOrchestrator(configurationId);
		return await orchestrator.sync([mapped], {
			syncType: 'manual',
			dryRun: options?.dryRun,
			userId: options?.userId,
		});
	}

	/**
	 * Get a sync configuration
	 */
	async getConfiguration(id: string): Promise<SyncConfiguration | null> {
		const { data, error } = await this.supabase
			.from('sync_configurations')
			.select('*')
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error fetching configuration:', error);
			return null;
		}

		return data as SyncConfiguration;
	}

	/**
	 * Get all sync configurations
	 */
	async getAllConfigurations(): Promise<SyncConfiguration[]> {
		const { data, error } = await this.supabase
			.from('sync_configurations')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching configurations:', error);
			return [];
		}

		return data as SyncConfiguration[];
	}

	/**
	 * Create a new sync configuration
	 */
	async createConfiguration(config: {
		name: string;
		source_url: string;
		enabled?: boolean;
		schedule_cron?: string;
		field_mappings?: Record<string, unknown>;
	}): Promise<SyncConfiguration> {
		const { data, error } = await this.supabase
			.from('sync_configurations')
			.insert({
				name: config.name,
				source_url: config.source_url,
				enabled: config.enabled ?? true,
				schedule_cron: config.schedule_cron,
				field_mappings: config.field_mappings || {},
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create configuration: ${error.message}`);
		}

		return data as SyncConfiguration;
	}

	/**
	 * Update a sync configuration
	 */
	async updateConfiguration(
		id: string,
		updates: Partial<{
			name: string;
			source_url: string;
			enabled: boolean;
			schedule_cron: string;
			field_mappings: Record<string, unknown>;
		}>,
	): Promise<SyncConfiguration> {
		const { data, error } = await this.supabase
			.from('sync_configurations')
			.update(updates)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update configuration: ${error.message}`);
		}

		return data as SyncConfiguration;
	}

	/**
	 * Delete a sync configuration
	 */
	async deleteConfiguration(id: string): Promise<void> {
		const { error } = await this.supabase
			.from('sync_configurations')
			.delete()
			.eq('id', id);

		if (error) {
			throw new Error(`Failed to delete configuration: ${error.message}`);
		}
	}

	/**
	 * Get sync audit logs
	 */
	async getAuditLogs(
		configurationId?: string,
		options?: { limit?: number; offset?: number },
	) {
		let query = this.supabase
			.from('sync_audit_logs')
			.select('*')
			.order('started_at', { ascending: false });

		if (configurationId) {
			query = query.eq('configuration_id', configurationId);
		}

		if (options?.limit) {
			query = query.limit(options.limit);
		}

		if (options?.offset) {
			query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to fetch audit logs: ${error.message}`);
		}

		return data;
	}

	/**
	 * Get detailed record logs for a specific audit log
	 */
	async getRecordLogs(auditLogId: string) {
		const { data, error } = await this.supabase
			.from('sync_record_logs')
			.select('*')
			.eq('audit_log_id', auditLogId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch record logs: ${error.message}`);
		}

		return data;
	}

	/**
	 * Toggle manual override for a professor field
	 */
	async toggleManualOverride(
		profesorId: string,
		field: string,
		enable: boolean,
	): Promise<void> {
		// Get current overrides
		const { data: profesor, error: fetchError } = await this.supabase
			.from('profesores')
			.select('manual_override_fields')
			.eq('id', profesorId)
			.single();

		if (fetchError) {
			throw new Error(`Failed to fetch professor: ${fetchError.message}`);
		}

		const currentOverrides = (profesor.manual_override_fields as string[]) || [];

		let newOverrides: string[];
		if (enable) {
			// Add field if not already in overrides
			newOverrides = currentOverrides.includes(field)
				? currentOverrides
				: [...currentOverrides, field];
		} else {
			// Remove field from overrides
			newOverrides = currentOverrides.filter((f) => f !== field);
		}

		// Update professor
		const { error: updateError } = await this.supabase
			.from('profesores')
			.update({ manual_override_fields: newOverrides })
			.eq('id', profesorId);

		if (updateError) {
			throw new Error(`Failed to update manual overrides: ${updateError.message}`);
		}
	}

	/**
	 * Toggle sync enabled for a professor (opt-out mechanism)
	 */
	async toggleSyncEnabled(profesorId: string, enabled: boolean): Promise<void> {
		const { error } = await this.supabase
			.from('profesores')
			.update({ sync_enabled: enabled })
			.eq('id', profesorId);

		if (error) {
			throw new Error(`Failed to update sync_enabled: ${error.message}`);
		}
	}

	/**
	 * Get sync statistics
	 */
	async getSyncStatistics(configurationId?: string) {
		let query = this.supabase.from('v_sync_statistics').select('*');

		if (configurationId) {
			query = query.eq('configuration_id', configurationId);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to fetch sync statistics: ${error.message}`);
		}

		return data;
	}
}

