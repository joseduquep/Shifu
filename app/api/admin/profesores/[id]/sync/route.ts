/**
 * API endpoint for managing professor sync settings
 * PATCH /api/admin/profesores/[id]/sync - Update sync settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync/sync-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/profesores/[id]/sync
 * Update sync settings for a professor
 */
export async function PATCH(
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
        if (!devBypass) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

		const { id } = await params;
		const body = await request.json();
		const { sync_enabled, manual_override_field, enable_override } = body;

		const syncService = new SyncService();

		// Handle sync_enabled toggle
		if (typeof sync_enabled === 'boolean') {
			await syncService.toggleSyncEnabled(id, sync_enabled);
		}

		// Handle manual override toggle
		if (manual_override_field && typeof enable_override === 'boolean') {
			await syncService.toggleManualOverride(
				id,
				manual_override_field,
				enable_override,
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error updating sync settings:', error);
		return NextResponse.json(
			{
				error: 'Failed to update sync settings',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

