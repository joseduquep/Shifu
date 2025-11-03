/**
 * Admin Sync Management Page
 * Manage web scraping and data synchronization
 */

'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SyncConfiguration {
	id: string;
	name: string;
	source_url: string;
	enabled: boolean;
	schedule_cron?: string;
	last_full_sync_at?: string;
	last_incremental_sync_at?: string;
	created_at: string;
}

interface AuditLog {
	id: string;
	sync_type: string;
	status: string;
	started_at: string;
	completed_at?: string;
	records_processed: number;
	records_created: number;
	records_updated: number;
	records_skipped: number;
	records_failed: number;
	error_message?: string;
}

interface SyncStatistics {
	configuration_id: string;
	configuration_name: string;
	enabled: boolean;
	total_syncs: number;
	successful_syncs: number;
	failed_syncs: number;
	last_sync_at?: string;
	total_records_created: number;
	total_records_updated: number;
	total_records_skipped: number;
	total_records_failed: number;
}

export default function SyncManagementPage() {
	const [configurations, setConfigurations] = useState<SyncConfiguration[]>([]);
	const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
	const [statistics, setStatistics] = useState<SyncStatistics[]>([]);
	const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [activeTab, setActiveTab] = useState<'configurations' | 'logs' | 'statistics'>(
		'configurations',
	);

	// Load configurations on mount
	useEffect(() => {
		loadConfigurations();
		loadStatistics();
	}, []);

	// Load audit logs when a configuration is selected
	useEffect(() => {
		if (selectedConfig) {
			loadAuditLogs(selectedConfig);
		}
	}, [selectedConfig]);

	const loadConfigurations = async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/admin/sync/configurations');
			if (!response.ok) throw new Error('Failed to load configurations');
			const data = await response.json();
			setConfigurations(data);
		} catch (error) {
			toast.error('Failed to load configurations');
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const loadAuditLogs = async (configId?: string) => {
		setLoading(true);
		try {
			const url = configId
				? `/api/admin/sync/audit-logs?configurationId=${configId}`
				: '/api/admin/sync/audit-logs';
			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to load audit logs');
			const data = await response.json();
			setAuditLogs(data);
		} catch (error) {
			toast.error('Failed to load audit logs');
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const loadStatistics = async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/admin/sync/statistics');
			if (!response.ok) throw new Error('Failed to load statistics');
			const data = await response.json();
			setStatistics(data);
		} catch (error) {
			toast.error('Failed to load statistics');
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const triggerSync = async (configId: string, syncType: 'full' | 'incremental') => {
		if (
			!confirm(
				`Are you sure you want to trigger a ${syncType} sync? This may take several minutes.`,
			)
		) {
			return;
		}

		setSyncing(true);
		const toastId = toast.loading(`Starting ${syncType} sync...`);

		try {
			const response = await fetch('/api/admin/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					configurationId: configId,
					syncType,
					dryRun: false,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Sync failed');
			}

			const result = await response.json();
			toast.success(
				`Sync ${result.status}! Created: ${result.recordsCreated}, Updated: ${result.recordsUpdated}, Skipped: ${result.recordsSkipped}, Failed: ${result.recordsFailed}`,
				{ id: toastId, duration: 5000 },
			);

			// Reload data
			await loadAuditLogs(configId);
			await loadStatistics();
		} catch (error) {
			toast.error(
				`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{ id: toastId },
			);
			console.error(error);
		} finally {
			setSyncing(false);
		}
	};

	const toggleConfiguration = async (configId: string, enabled: boolean) => {
		try {
			const response = await fetch(`/api/admin/sync/configurations/${configId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled }),
			});

			if (!response.ok) throw new Error('Failed to update configuration');

			toast.success(`Configuration ${enabled ? 'enabled' : 'disabled'}`);
			await loadConfigurations();
		} catch (error) {
			toast.error('Failed to update configuration');
			console.error(error);
		}
	};

	const createDefaultConfiguration = async () => {
		try {
			const response = await fetch('/api/admin/sync/configurations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'EAFIT Professors',
					source_url: 'https://www.eafit.edu.co/nuestros-profesores',
					enabled: true,
					schedule_cron: '0 2 * * *', // Daily at 2 AM
					field_mappings: {},
				}),
			});

			if (!response.ok) throw new Error('Failed to create configuration');

			toast.success('Configuration created successfully');
			await loadConfigurations();
		} catch (error) {
			toast.error('Failed to create configuration');
			console.error(error);
		}
	};

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Sync Management</h1>

			{/* Tabs */}
			<div className="flex space-x-4 mb-6 border-b">
				<button
					onClick={() => setActiveTab('configurations')}
					className={`pb-2 px-4 ${
						activeTab === 'configurations'
							? 'border-b-2 border-blue-500 font-semibold'
							: 'text-gray-500'
					}`}
				>
					Configurations
				</button>
				<button
					onClick={() => setActiveTab('logs')}
					className={`pb-2 px-4 ${
						activeTab === 'logs'
							? 'border-b-2 border-blue-500 font-semibold'
							: 'text-gray-500'
					}`}
				>
					Audit Logs
				</button>
				<button
					onClick={() => setActiveTab('statistics')}
					className={`pb-2 px-4 ${
						activeTab === 'statistics'
							? 'border-b-2 border-blue-500 font-semibold'
							: 'text-gray-500'
					}`}
				>
					Statistics
				</button>
			</div>

			{/* Configurations Tab */}
			{activeTab === 'configurations' && (
				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Sync Configurations</h2>
						<button
							onClick={createDefaultConfiguration}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Create EAFIT Configuration
						</button>
					</div>

					{loading ? (
						<div className="text-center py-8">Loading...</div>
					) : configurations.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No configurations found. Create one to get started.
						</div>
					) : (
						<div className="space-y-4">
							{configurations.map((config) => (
								<div
									key={config.id}
									className="border rounded-lg p-4 bg-white shadow-sm"
								>
									<div className="flex justify-between items-start mb-2">
										<div>
											<h3 className="text-lg font-semibold">{config.name}</h3>
											<p className="text-sm text-gray-600">
												{config.source_url}
											</p>
										</div>
										<label className="flex items-center space-x-2">
											<span className="text-sm">Enabled</span>
											<input
												type="checkbox"
												checked={config.enabled}
												onChange={(e) =>
													toggleConfiguration(config.id, e.target.checked)
												}
												className="w-4 h-4"
											/>
										</label>
									</div>

									<div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
										<div>
											<span className="font-medium">Last Full Sync:</span>{' '}
											{config.last_full_sync_at
												? new Date(config.last_full_sync_at).toLocaleString()
												: 'Never'}
										</div>
										<div>
											<span className="font-medium">Last Incremental:</span>{' '}
											{config.last_incremental_sync_at
												? new Date(
														config.last_incremental_sync_at,
													).toLocaleString()
												: 'Never'}
										</div>
										{config.schedule_cron && (
											<div className="col-span-2">
												<span className="font-medium">Schedule:</span>{' '}
												{config.schedule_cron}
											</div>
										)}
									</div>

									<div className="flex space-x-2">
										<button
											onClick={() => triggerSync(config.id, 'full')}
											disabled={syncing || !config.enabled}
											className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{syncing ? 'Syncing...' : 'Run Full Sync'}
										</button>
										<button
											onClick={() => triggerSync(config.id, 'incremental')}
											disabled={syncing || !config.enabled}
											className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Run Incremental Sync
										</button>
										<button
											onClick={() => {
												setSelectedConfig(config.id);
												setActiveTab('logs');
											}}
											className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
										>
											View Logs
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Audit Logs Tab */}
			{activeTab === 'logs' && (
				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Audit Logs</h2>
						<button
							onClick={() => loadAuditLogs(selectedConfig || undefined)}
							className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						>
							Refresh
						</button>
					</div>

					{loading ? (
						<div className="text-center py-8">Loading...</div>
					) : auditLogs.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No audit logs found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full bg-white border rounded-lg">
								<thead className="bg-gray-100">
									<tr>
										<th className="px-4 py-2 text-left">Type</th>
										<th className="px-4 py-2 text-left">Status</th>
										<th className="px-4 py-2 text-left">Started</th>
										<th className="px-4 py-2 text-left">Duration</th>
										<th className="px-4 py-2 text-right">Processed</th>
										<th className="px-4 py-2 text-right">Created</th>
										<th className="px-4 py-2 text-right">Updated</th>
										<th className="px-4 py-2 text-right">Skipped</th>
										<th className="px-4 py-2 text-right">Failed</th>
									</tr>
								</thead>
								<tbody>
									{auditLogs.map((log) => (
										<tr key={log.id} className="border-t hover:bg-gray-50">
											<td className="px-4 py-2">
												<span className="px-2 py-1 text-xs rounded bg-gray-200">
													{log.sync_type}
												</span>
											</td>
											<td className="px-4 py-2">
												<span
													className={`px-2 py-1 text-xs rounded ${
														log.status === 'completed'
															? 'bg-green-200 text-green-800'
															: log.status === 'failed'
																? 'bg-red-200 text-red-800'
																: log.status === 'partial'
																	? 'bg-yellow-200 text-yellow-800'
																	: 'bg-blue-200 text-blue-800'
													}`}
												>
													{log.status}
												</span>
											</td>
											<td className="px-4 py-2 text-sm">
												{new Date(log.started_at).toLocaleString()}
											</td>
											<td className="px-4 py-2 text-sm">
												{log.completed_at
													? `${Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s`
													: '-'}
											</td>
											<td className="px-4 py-2 text-right">
												{log.records_processed}
											</td>
											<td className="px-4 py-2 text-right text-green-600">
												{log.records_created}
											</td>
											<td className="px-4 py-2 text-right text-blue-600">
												{log.records_updated}
											</td>
											<td className="px-4 py-2 text-right text-gray-600">
												{log.records_skipped}
											</td>
											<td className="px-4 py-2 text-right text-red-600">
												{log.records_failed}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Statistics Tab */}
			{activeTab === 'statistics' && (
				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Sync Statistics</h2>
						<button
							onClick={loadStatistics}
							className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						>
							Refresh
						</button>
					</div>

					{loading ? (
						<div className="text-center py-8">Loading...</div>
					) : statistics.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No statistics available.
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{statistics.map((stat) => (
								<div
									key={stat.configuration_id}
									className="border rounded-lg p-4 bg-white shadow-sm"
								>
									<h3 className="text-lg font-semibold mb-2">
										{stat.configuration_name}
									</h3>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Status:</span>
											<span
												className={
													stat.enabled ? 'text-green-600' : 'text-red-600'
												}
											>
												{stat.enabled ? 'Enabled' : 'Disabled'}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Total Syncs:</span>
											<span>{stat.total_syncs}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Successful:</span>
											<span className="text-green-600">
												{stat.successful_syncs}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Failed:</span>
											<span className="text-red-600">{stat.failed_syncs}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Last Sync:</span>
											<span>
												{stat.last_sync_at
													? new Date(stat.last_sync_at).toLocaleDateString()
													: 'Never'}
											</span>
										</div>
										<hr className="my-2" />
										<div className="flex justify-between">
											<span className="text-gray-600">Created:</span>
											<span className="text-green-600">
												{stat.total_records_created}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Updated:</span>
											<span className="text-blue-600">
												{stat.total_records_updated}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Skipped:</span>
											<span className="text-gray-600">
												{stat.total_records_skipped}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Failed:</span>
											<span className="text-red-600">
												{stat.total_records_failed}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

