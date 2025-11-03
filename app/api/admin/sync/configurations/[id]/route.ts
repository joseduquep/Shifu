/**
 * API endpoint for managing individual sync configurations
 * GET /api/admin/sync/configurations/[id] - Get a configuration
 * PATCH /api/admin/sync/configurations/[id] - Update a configuration
 * DELETE /api/admin/sync/configurations/[id] - Delete a configuration
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
        profile = data as any;
    }

    if (!profile || profile.role !== 'admin') {
        if (devBypass) return { authorized: true, userId: user?.id || null };
        return { authorized: false, userId: user?.id || null, error: 'Forbidden', status: 403 };
    }

    return { authorized: true, userId: user.id };
}

/**
 * GET /api/admin/sync/configurations/[id]
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await checkAdmin();
		if (!auth.authorized) {
			return NextResponse.json({ error: auth.error }, { status: auth.status });
		}

		const { id } = await params;
		const syncService = new SyncService();
		const configuration = await syncService.getConfiguration(id);

		if (!configuration) {
			return NextResponse.json(
				{ error: 'Configuration not found' },
				{ status: 404 },
			);
		}

		return NextResponse.json(configuration, { status: 200 });
	} catch (error) {
		console.error('Error fetching configuration:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch configuration',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

/**
 * PATCH /api/admin/sync/configurations/[id]
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await checkAdmin();
		if (!auth.authorized) {
			return NextResponse.json({ error: auth.error }, { status: auth.status });
		}

		const { id } = await params;
		const body = await request.json();

		const syncService = new SyncService();
		const configuration = await syncService.updateConfiguration(id, body);

		return NextResponse.json(configuration, { status: 200 });
	} catch (error) {
		console.error('Error updating configuration:', error);
		return NextResponse.json(
			{
				error: 'Failed to update configuration',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/sync/configurations/[id]
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await checkAdmin();
		if (!auth.authorized) {
			return NextResponse.json({ error: auth.error }, { status: auth.status });
		}

		const { id } = await params;
		const syncService = new SyncService();
		await syncService.deleteConfiguration(id);

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error deleting configuration:', error);
		return NextResponse.json(
			{
				error: 'Failed to delete configuration',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

