# Web Scraping and Data Synchronization System

This document describes the automated web scraping and data synchronization system for Shifu, which automatically imports and updates professor profiles from external sources (e.g., EAFIT university website).

## Features

✅ **Automated Web Scraping** - Scrapes professor data from EAFIT's public website  
✅ **Full & Incremental Syncs** - Support for both full imports and incremental updates  
✅ **Manual Override Protection** - Fields manually edited by admins won't be overwritten  
✅ **Opt-out Mechanism** - Professors can opt out of automatic updates  
✅ **Audit Logging** - Complete audit trail of all sync operations  
✅ **Scheduled Syncs** - Automatic periodic syncs using cron schedules  
✅ **Dry Run Mode** - Test syncs without making changes  
✅ **Admin UI** - Web interface for managing syncs and viewing logs  

## Architecture

### Components

1. **Web Scraper** (`lib/services/scrapers/eafit-scraper.ts`)
   - Scrapes professor data from EAFIT website
   - Handles pagination and rate limiting
   - Extracts name, bio, email, department, research areas, etc.

2. **Data Mapper** (`lib/services/sync/data-mapper.ts`)
   - Transforms scraped data to Shifu's internal schema
   - Validates data before syncing
   - Detects changes between current and incoming data

3. **Sync Orchestrator** (`lib/services/sync/sync-orchestrator.ts`)
   - Manages the sync process
   - Respects manual overrides and opt-outs
   - Creates/updates professors in database
   - Logs all operations

4. **Sync Service** (`lib/services/sync/sync-service.ts`)
   - High-level API for running syncs
   - Manages sync configurations
   - Provides statistics and audit logs

5. **Scheduler** (`lib/services/sync/scheduler.ts`)
   - Runs periodic syncs based on cron schedules
   - Monitors configuration changes
   - Provides graceful shutdown

### Database Schema

The system adds the following tables and columns:

**New columns on `profesores` table:**
- `external_id` - Unique identifier from external source (e.g., profile URL)
- `external_source` - Source name (e.g., 'eafit_web')
- `last_synced_at` - Timestamp of last successful sync
- `sync_enabled` - Boolean opt-out flag
- `manual_override_fields` - Array of field names protected from sync
- `raw_scraped_data` - JSONB with complete scraped data

**New tables:**
- `sync_configurations` - Sync job configurations
- `sync_audit_logs` - High-level audit logs for each sync run
- `sync_record_logs` - Detailed record-level logs
- `v_sync_statistics` - View with aggregated statistics

## Usage

### 1. Database Migration

Run the migration to add the sync system tables:

```sql
-- Apply migration 0007_add_web_scraping_metadata.sql
```

### 2. Create a Sync Configuration

Via Admin UI:
1. Go to `/admin/sync`
2. Click "Create EAFIT Configuration"
3. Configure schedule (optional)

Via API:
```bash
curl -X POST /api/admin/sync/configurations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "EAFIT Professors",
    "source_url": "https://www.eafit.edu.co/nuestros-profesores",
    "enabled": true,
    "schedule_cron": "0 2 * * *"
  }'
```

### 3. Run a Manual Sync

**Via Admin UI:**
1. Go to `/admin/sync`
2. Select a configuration
3. Click "Run Full Sync" or "Run Incremental Sync"

**Via CLI:**
```bash
# Run incremental sync with first available configuration
npm run sync:manual

# Run full sync for specific configuration
npm run sync:manual [configId] --type=full

# Dry run (no changes)
npm run sync:manual [configId] --dry-run
```

**Via API:**
```bash
curl -X POST /api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{
    "configurationId": "abc-123",
    "syncType": "incremental",
    "dryRun": false
  }'
```

### 4. Run the Scheduler

For automatic periodic syncs:

```bash
# Start the scheduler (keeps running)
npm run sync:scheduler

# Or use a process manager like PM2
pm2 start npm --name "shifu-scheduler" -- run sync:scheduler

# Or run in Docker
docker-compose up scheduler
```

## Sync Behavior

### Full Sync
- Scrapes ALL professors from the source website
- Creates new professors that don't exist
- Updates existing professors (respecting manual overrides)
- Recommended for: Initial import, major updates, weekly/monthly maintenance

### Incremental Sync
- Scrapes ALL professors but only updates changed records
- Faster than full sync due to change detection
- Recommended for: Daily updates, scheduled syncs

### Manual Overrides
When an admin manually edits a professor field:
1. Mark the field as a manual override:
   ```bash
   PATCH /api/admin/profesores/[id]/sync
   {
     "manual_override_field": "bio",
     "enable_override": true
   }
   ```
2. Future syncs will NOT overwrite that field
3. The sync logs will show the field was skipped due to override

### Opt-Out
To prevent a professor from being updated by sync:
```bash
PATCH /api/admin/profesores/[id]/sync
{
  "sync_enabled": false
}
```

## Monitoring

### View Audit Logs

**Admin UI:** `/admin/sync` → "Audit Logs" tab

**API:**
```bash
# Get recent audit logs
GET /api/admin/sync/audit-logs?limit=50

# Get logs for specific configuration
GET /api/admin/sync/audit-logs?configurationId=abc-123

# Get detailed record logs for a sync
GET /api/admin/sync/audit-logs/[auditLogId]/records
```

### View Statistics

**Admin UI:** `/admin/sync` → "Statistics" tab

**API:**
```bash
GET /api/admin/sync/statistics
```

## API Endpoints

### Configurations
- `GET /api/admin/sync/configurations` - List all configurations
- `POST /api/admin/sync/configurations` - Create configuration
- `GET /api/admin/sync/configurations/[id]` - Get configuration
- `PATCH /api/admin/sync/configurations/[id]` - Update configuration
- `DELETE /api/admin/sync/configurations/[id]` - Delete configuration

### Sync Operations
- `POST /api/admin/sync` - Trigger a sync

### Audit & Statistics
- `GET /api/admin/sync/audit-logs` - Get audit logs
- `GET /api/admin/sync/audit-logs/[id]/records` - Get record logs
- `GET /api/admin/sync/statistics` - Get statistics

### Professor Sync Settings
- `PATCH /api/admin/profesores/[id]/sync` - Update sync settings

## Scheduling

Cron expressions for common schedules:

```
"0 2 * * *"     - Daily at 2:00 AM
"0 */6 * * *"   - Every 6 hours
"0 2 * * 0"     - Weekly on Sunday at 2:00 AM
"0 2 1 * *"     - Monthly on the 1st at 2:00 AM
```

## Error Handling

The system handles various error scenarios:

1. **Network Errors** - Retries with exponential backoff (future enhancement)
2. **Invalid Data** - Skips invalid records and logs errors
3. **Database Errors** - Logs errors and continues with next record
4. **Rate Limiting** - Built-in delays between requests (1-2 seconds)

## Best Practices

1. **Start with Dry Run** - Test configuration with `dryRun: true` first
2. **Monitor First Sync** - Watch the first full sync closely for issues
3. **Use Incremental for Regular Syncs** - Schedule incremental syncs daily
4. **Run Full Sync Periodically** - Weekly or monthly full syncs for cleanup
5. **Review Audit Logs** - Check logs after each sync for errors
6. **Set Manual Overrides** - Protect manually curated content
7. **Handle Opt-Outs** - Respect professor privacy preferences

## Troubleshooting

### Sync Fails Immediately
- Check database connection
- Verify admin credentials
- Check sync configuration is enabled

### High Failure Rate
- Check EAFIT website structure hasn't changed
- Review error messages in audit logs
- Consider running a full sync

### Scheduler Not Running
- Check cron expression is valid
- Verify configuration is enabled
- Check scheduler process is running

### Fields Not Updating
- Check if field has manual override enabled
- Verify sync_enabled is true for professor
- Check if data actually changed on source site

## Security Considerations

1. **Admin Only** - All sync operations require admin role
2. **Rate Limiting** - Built-in delays prevent overwhelming source website
3. **Data Validation** - All scraped data is validated before import
4. **Audit Trail** - Complete logging of all operations
5. **Opt-Out** - Professors can disable automatic updates
6. **Manual Override** - Admins can protect specific fields

## Future Enhancements

- [ ] Email notifications for sync failures
- [ ] Webhook support for sync completion
- [ ] Retry logic with exponential backoff
- [ ] Scraping from multiple sources
- [ ] Conflict resolution UI
- [ ] Data quality metrics
- [ ] Automatic schema detection
- [ ] Machine learning for data extraction

## Support

For issues or questions:
1. Check audit logs for detailed error messages
2. Review this documentation
3. Contact the development team

---

**Last Updated:** November 3, 2025
**Version:** 1.0.0

