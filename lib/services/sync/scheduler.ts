/**
 * Sync Scheduler
 * Manages scheduled sync operations using cron
 */

import cron from 'node-cron';
import { SyncService } from './sync-service';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

interface ScheduledTask {
	configurationId: string;
	configurationName: string;
	cronExpression: string;
	task: cron.ScheduledTask;
}

/**
 * Manages scheduled sync operations
 */
export class SyncScheduler {
	private scheduledTasks: Map<string, ScheduledTask> = new Map();
	private syncService = new SyncService();
	private supabase = supabaseAdmin;
	private isRunning = false;

	/**
	 * Start the scheduler
	 */
	async start() {
		if (this.isRunning) {
			console.log('Scheduler is already running');
			return;
		}

		console.log('Starting sync scheduler...');
		this.isRunning = true;

		// Load all enabled configurations with schedules
		await this.loadSchedules();

		// Check for configuration changes every 5 minutes
		this.startConfigurationWatcher();

		console.log(`Scheduler started with ${this.scheduledTasks.size} scheduled tasks`);
	}

	/**
	 * Stop the scheduler
	 */
	stop() {
		console.log('Stopping sync scheduler...');
		
		// Stop all scheduled tasks
		for (const [configId, task] of this.scheduledTasks.entries()) {
			task.task.stop();
			console.log(`Stopped scheduled task for: ${task.configurationName}`);
		}

		this.scheduledTasks.clear();
		this.isRunning = false;

		console.log('Scheduler stopped');
	}

	/**
	 * Load all scheduled configurations from database
	 */
	private async loadSchedules() {
		try {
			const { data: configurations, error } = await this.supabase
				.from('sync_configurations')
				.select('*')
				.eq('enabled', true)
				.not('schedule_cron', 'is', null);

			if (error) {
				console.error('Error loading configurations:', error);
				return;
			}

			if (!configurations || configurations.length === 0) {
				console.log('No scheduled configurations found');
				return;
			}

			for (const config of configurations) {
				await this.scheduleConfiguration(config);
			}
		} catch (error) {
			console.error('Error loading schedules:', error);
		}
	}

	/**
	 * Schedule a configuration
	 */
	private async scheduleConfiguration(config: any) {
		const { id, name, schedule_cron } = config;

		// Validate cron expression
		if (!schedule_cron || !cron.validate(schedule_cron)) {
			console.warn(
				`Invalid cron expression for ${name}: ${schedule_cron}`,
			);
			return;
		}

		// Remove existing task if any
		if (this.scheduledTasks.has(id)) {
			const existing = this.scheduledTasks.get(id);
			existing?.task.stop();
			this.scheduledTasks.delete(id);
		}

		// Create new scheduled task
		const task = cron.schedule(
			schedule_cron,
			async () => {
				await this.executeScheduledSync(id, name);
			},
			{
				scheduled: true,
				timezone: 'America/Bogota', // Adjust to your timezone
			},
		);

		this.scheduledTasks.set(id, {
			configurationId: id,
			configurationName: name,
			cronExpression: schedule_cron,
			task,
		});

		console.log(
			`Scheduled task for ${name} with cron: ${schedule_cron}`,
		);
	}

	/**
	 * Execute a scheduled sync
	 */
	private async executeScheduledSync(configId: string, configName: string) {
		console.log(`\n${'='.repeat(60)}`);
		console.log(`Executing scheduled sync for: ${configName}`);
		console.log(`Started at: ${new Date().toISOString()}`);
		console.log('='.repeat(60));

		try {
			// Run incremental sync by default (faster)
			const result = await this.syncService.runIncrementalSync(configId, {
				dryRun: false,
			});

			console.log(`\nSync ${result.status}:`);
			console.log(`  - Processed: ${result.recordsProcessed}`);
			console.log(`  - Created: ${result.recordsCreated}`);
			console.log(`  - Updated: ${result.recordsUpdated}`);
			console.log(`  - Skipped: ${result.recordsSkipped}`);
			console.log(`  - Failed: ${result.recordsFailed}`);

			if (result.errors.length > 0) {
				console.log(`\nErrors (${result.errors.length}):`);
				result.errors.slice(0, 5).forEach((err) => {
					console.log(`  - ${err.externalId}: ${err.error}`);
				});
				if (result.errors.length > 5) {
					console.log(`  ... and ${result.errors.length - 5} more errors`);
				}
			}

			// If incremental sync has issues or hasn't run in a while, suggest full sync
			if (result.recordsFailed > result.recordsProcessed * 0.1) {
				console.log(
					'\n⚠️  High failure rate detected. Consider running a full sync manually.',
				);
			}
		} catch (error) {
			console.error(`\n❌ Sync failed:`, error);
		}

		console.log(`Completed at: ${new Date().toISOString()}`);
		console.log('='.repeat(60) + '\n');
	}

	/**
	 * Watch for configuration changes
	 */
	private startConfigurationWatcher() {
		// Check for configuration changes every 5 minutes
		setInterval(async () => {
			console.log('Checking for configuration changes...');
			await this.loadSchedules();
		}, 5 * 60 * 1000);
	}

	/**
	 * Get current scheduled tasks
	 */
	getScheduledTasks(): Array<{
		configurationId: string;
		configurationName: string;
		cronExpression: string;
	}> {
		return Array.from(this.scheduledTasks.values()).map((task) => ({
			configurationId: task.configurationId,
			configurationName: task.configurationName,
			cronExpression: task.cronExpression,
		}));
	}

	/**
	 * Check if scheduler is running
	 */
	getIsRunning(): boolean {
		return this.isRunning;
	}
}

// Singleton instance
let schedulerInstance: SyncScheduler | null = null;

/**
 * Get or create scheduler instance
 */
export function getScheduler(): SyncScheduler {
	if (!schedulerInstance) {
		schedulerInstance = new SyncScheduler();
	}
	return schedulerInstance;
}

