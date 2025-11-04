/**
 * API endpoint for viewing sync statistics
 * GET /api/admin/sync/statistics - Get sync statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync/sync-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sync/statistics
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

		// Fetch statistics
		const syncService = new SyncService();
		const statistics = await syncService.getSyncStatistics(configurationId);

		return NextResponse.json(statistics, { status: 200 });
	} catch (error) {
		console.error('Error fetching sync statistics:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch sync statistics',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

