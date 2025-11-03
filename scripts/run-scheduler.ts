/**
 * Run Sync Scheduler
 * 
 * This script starts the sync scheduler that runs periodic syncs based on cron schedules.
 * It's meant to be run as a background process or in a separate container.
 * 
 * Usage:
 *   npx tsx scripts/run-scheduler.ts
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "scheduler": "tsx scripts/run-scheduler.ts"
 *   }
 */

import { getScheduler } from '../lib/services/sync/scheduler';

async function main() {
	console.log('='.repeat(60));
	console.log('Shifu Sync Scheduler');
	console.log('='.repeat(60));
	console.log(`Started at: ${new Date().toISOString()}`);
	console.log('Press Ctrl+C to stop\n');

	const scheduler = getScheduler();

	// Handle graceful shutdown
	process.on('SIGINT', () => {
		console.log('\n\nReceived SIGINT, shutting down gracefully...');
		scheduler.stop();
		process.exit(0);
	});

	process.on('SIGTERM', () => {
		console.log('\n\nReceived SIGTERM, shutting down gracefully...');
		scheduler.stop();
		process.exit(0);
	});

	// Start scheduler
	try {
		await scheduler.start();

		// Keep process alive
		process.stdin.resume();
	} catch (error) {
		console.error('Failed to start scheduler:', error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});

