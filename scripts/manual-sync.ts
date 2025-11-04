/**
 * Manual Sync Script
 * 
 * Run a manual sync operation from the command line.
 * 
 * Usage:
 *   npx tsx scripts/manual-sync.ts [configId] [--type=full|incremental] [--dry-run]
 * 
 * Examples:
 *   npx tsx scripts/manual-sync.ts  # Uses first available config, incremental
 *   npx tsx scripts/manual-sync.ts abc123 --type=full  # Full sync for config abc123
 *   npx tsx scripts/manual-sync.ts abc123 --dry-run  # Dry run (no changes)
 */

import { SyncService } from '../lib/services/sync/sync-service';

async function main() {
	const args = process.argv.slice(2);
	
	// Parse arguments
	let configId = args.find(arg => !arg.startsWith('--'));
	const syncType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] as 'full' | 'incremental' || 'incremental';
	const dryRun = args.includes('--dry-run');

	console.log('='.repeat(60));
	console.log('Shifu Manual Sync');
	console.log('='.repeat(60));
	console.log(`Started at: ${new Date().toISOString()}`);
	console.log(`Sync Type: ${syncType}`);
	console.log(`Dry Run: ${dryRun ? 'Yes' : 'No'}`);
	console.log('='.repeat(60) + '\n');

	const syncService = new SyncService();

	// Get configuration
	if (!configId) {
		console.log('No configuration ID provided, loading available configurations...');
		const configs = await syncService.getAllConfigurations();
		
		if (configs.length === 0) {
			console.error('❌ No configurations found. Please create one first.');
			process.exit(1);
		}

		configId = configs[0].id;
		console.log(`Using configuration: ${configs[0].name} (${configId})\n`);
	}

	const config = await syncService.getConfiguration(configId);
	if (!config) {
		console.error(`❌ Configuration not found: ${configId}`);
		process.exit(1);
	}

	console.log(`Configuration: ${config.name}`);
	console.log(`Source URL: ${config.source_url}`);
	console.log(`Enabled: ${config.enabled}\n`);

	if (!config.enabled && !dryRun) {
		console.error('❌ Configuration is disabled. Enable it first or use --dry-run.');
		process.exit(1);
	}

	// Run sync
	try {
		let result;
		if (syncType === 'full') {
			console.log('Starting full sync...\n');
			result = await syncService.runFullSync(configId, { dryRun });
		} else {
			console.log('Starting incremental sync...\n');
			result = await syncService.runIncrementalSync(configId, { dryRun });
		}

		console.log('\n' + '='.repeat(60));
		console.log('Sync Results');
		console.log('='.repeat(60));
		console.log(`Status: ${result.status}`);
		console.log(`Audit Log ID: ${result.auditLogId}`);
		console.log(`\nRecords:`);
		console.log(`  - Processed: ${result.recordsProcessed}`);
		console.log(`  - Created: ${result.recordsCreated}`);
		console.log(`  - Updated: ${result.recordsUpdated}`);
		console.log(`  - Skipped: ${result.recordsSkipped}`);
		console.log(`  - Failed: ${result.recordsFailed}`);

		if (result.errors.length > 0) {
			console.log(`\nErrors (${result.errors.length}):`);
			result.errors.slice(0, 10).forEach((err, i) => {
				console.log(`  ${i + 1}. ${err.externalId}`);
				console.log(`     Error: ${err.error}`);
			});
			if (result.errors.length > 10) {
				console.log(`  ... and ${result.errors.length - 10} more errors`);
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log(`Completed at: ${new Date().toISOString()}`);
		console.log('='.repeat(60));

		if (dryRun) {
			console.log('\n⚠️  This was a dry run. No changes were made to the database.');
		}

		process.exit(result.status === 'completed' ? 0 : 1);
	} catch (error) {
		console.error('\n❌ Sync failed:', error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});

