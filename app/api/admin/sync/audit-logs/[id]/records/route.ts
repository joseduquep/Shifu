/**
 * API endpoint for viewing detailed record logs for a specific audit log
 * GET /api/admin/sync/audit-logs/[id]/records - Get record logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync/sync-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sync/audit-logs/[id]/records
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
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
    // If devBypass is active and user is null, we should still not proceed to access user.id
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Dev bypass active but user is null' }, { status: 401 });
    }

		const { data: profile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

    if (!profile || profile.role !== 'admin') {
        if (!devBypass) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

		const { id } = await params;
		const syncService = new SyncService();
		const records = await syncService.getRecordLogs(id);

		return NextResponse.json(records, { status: 200 });
	} catch (error) {
		console.error('Error fetching record logs:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch record logs',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

