/**
 * API endpoint for managing sync configurations
 * GET /api/admin/sync/configurations - Get all configurations
 * POST /api/admin/sync/configurations - Create a configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync/sync-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Check if user is admin
 */
async function checkAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    // Dev bypass: allow admin in non-production when explicitly enabled
    const devBypass =
        process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_ADMIN === 'true';

    if (authError || !user) {
        if (devBypass) return { authorized: true, userId: null };
        return { authorized: false, userId: null, error: 'Unauthorized', status: 401 };
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
        if (devBypass) return { authorized: true, userId: user?.id || null };
        return { authorized: false, userId: user?.id || null, error: 'Forbidden', status: 403 };
    }

    return { authorized: true, userId: user.id };
}

/**
 * GET /api/admin/sync/configurations
 * Get all sync configurations
 */
export async function GET() {
	try {
		const auth = await checkAdmin();
		if (!auth.authorized) {
			return NextResponse.json({ error: auth.error }, { status: auth.status });
		}

		const syncService = new SyncService();
		const configurations = await syncService.getAllConfigurations();

		return NextResponse.json(configurations, { status: 200 });
	} catch (error) {
		console.error('Error fetching configurations:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch configurations',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

/**
 * POST /api/admin/sync/configurations
 * Create a new sync configuration
 */
export async function POST(request: NextRequest) {
	try {
		const auth = await checkAdmin();
		if (!auth.authorized) {
			return NextResponse.json({ error: auth.error }, { status: auth.status });
		}

		const body = await request.json();
		const { name, source_url, enabled, schedule_cron, field_mappings } = body;

		if (!name || !source_url) {
			return NextResponse.json(
				{ error: 'name and source_url are required' },
				{ status: 400 },
			);
		}

		const syncService = new SyncService();
		const configuration = await syncService.createConfiguration({
			name,
			source_url,
			enabled,
			schedule_cron,
			field_mappings,
		});

		return NextResponse.json(configuration, { status: 201 });
	} catch (error) {
		console.error('Error creating configuration:', error);
		return NextResponse.json(
			{
				error: 'Failed to create configuration',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

