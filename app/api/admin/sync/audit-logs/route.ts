/**
 * API endpoint for viewing sync audit logs
 * GET /api/admin/sync/audit-logs - Get audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync/sync-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sync/audit-logs
 * Get sync audit logs with optional filters
 */
export async function GET(request: NextRequest) {
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

		// Parse query parameters
		const searchParams = request.nextUrl.searchParams;
		const configurationId = searchParams.get('configurationId') || undefined;
		const limit = parseInt(searchParams.get('limit') || '50');
		const offset = parseInt(searchParams.get('offset') || '0');

		// Fetch audit logs
		const syncService = new SyncService();
		const logs = await syncService.getAuditLogs(configurationId, { limit, offset });

		return NextResponse.json(logs, { status: 200 });
	} catch (error) {
		console.error('Error fetching audit logs:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch audit logs',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

