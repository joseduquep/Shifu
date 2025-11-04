/**
 * API endpoint for triggering sync operations
 * POST /api/admin/sync - Trigger a sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync/sync-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync
 * Trigger a sync operation
 */
export async function POST(request: NextRequest) {
	try {
		// Check authentication and authorization
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

    const devBypass =
        process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_ADMIN === 'true';

    if (authError || !user) {
        if (!devBypass) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

		// Check if user is admin
    let profile: { role: string } | null = null;
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        profile = (data as { role: string } | null);
    }

    if (!profile || profile.role !== 'admin') {
        if (!devBypass) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

		// Parse request body
		const body = await request.json();
		const { configurationId, syncType, dryRun } = body;

		if (!configurationId) {
			return NextResponse.json(
				{ error: 'configurationId is required' },
				{ status: 400 },
			);
		}

		if (!syncType || !['full', 'incremental'].includes(syncType)) {
			return NextResponse.json(
				{ error: 'syncType must be "full" or "incremental"' },
				{ status: 400 },
			);
		}

		// Initialize sync service
		const syncService = new SyncService();

		// Run sync based on type
		let result;
		if (syncType === 'full') {
			result = await syncService.runFullSync(configurationId, {
				dryRun: dryRun || false,
            userId: user?.id || undefined,
			});
		} else {
			result = await syncService.runIncrementalSync(configurationId, {
				dryRun: dryRun || false,
            userId: user?.id || undefined,
			});
		}

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error('Sync error:', error);
		return NextResponse.json(
			{
				error: 'Failed to run sync',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

