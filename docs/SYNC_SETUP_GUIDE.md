# Sync System Setup Guide

Quick setup guide for the Shifu web scraping and data synchronization system.

## Prerequisites

- Shifu application running
- Admin access to the platform
- Access to Supabase database

## Step-by-Step Setup

### 1. Run Database Migration

Apply the migration to add sync system tables:

```bash
# Connect to your Supabase database and run:
migrations/0007_add_web_scraping_metadata.sql
```

Or through Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `migrations/0007_add_web_scraping_metadata.sql`
3. Execute the SQL

### 2. Install Dependencies

Dependencies are already installed if you ran `npm install`. The sync system uses:
- `cheerio` - HTML parsing
- `node-html-parser` - Additional HTML parsing
- `node-cron` - Scheduling
- `tsx` - TypeScript execution

### 3. Create First Sync Configuration

**Option A: Via Admin UI (Recommended)**

1. Navigate to `/admin/sync`
2. Click "Create EAFIT Configuration"
3. The system will create a default configuration with:
   - Name: "EAFIT Professors"
   - Source: https://www.eafit.edu.co/nuestros-profesores
   - Schedule: Daily at 2 AM

**Option B: Via API**

```bash
curl -X POST http://localhost:3000/api/admin/sync/configurations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "EAFIT Professors",
    "source_url": "https://www.eafit.edu.co/nuestros-profesores",
    "enabled": true,
    "schedule_cron": "0 2 * * *"
  }'
```

### 4. Run First Sync (Test)

**Start with a Dry Run:**

```bash
# Get configuration ID from admin UI or API
npm run sync:manual YOUR_CONFIG_ID --dry-run
```

This will:
- Scrape the EAFIT website
- Show what would be imported
- NOT make any changes to the database

**Run Actual Sync:**

```bash
npm run sync:manual YOUR_CONFIG_ID --type=full
```

Or via Admin UI:
1. Go to `/admin/sync`
2. Click "Run Full Sync" on your configuration
3. Wait for completion (may take 10-30 minutes for full import)

### 5. Verify Results

After the sync completes:

1. **Check Audit Logs**
   - Go to `/admin/sync` → "Audit Logs" tab
   - Verify status is "completed"
   - Check records created/updated

2. **Check Professors**
   - Go to `/admin/profesores`
   - Verify professors were imported
   - Check that data looks correct

3. **Check Statistics**
   - Go to `/admin/sync` → "Statistics" tab
   - Review import statistics

### 6. Set Up Automated Syncs (Optional)

**Option A: Run Scheduler Process**

```bash
# Start scheduler (keeps running)
npm run sync:scheduler

# Or with PM2 for production
pm2 start npm --name "shifu-scheduler" -- run sync:scheduler
pm2 save
```

**Option B: Use Cron (Linux/Mac)**

Add to crontab:
```bash
# Run incremental sync daily at 2 AM
0 2 * * * cd /path/to/shifu && npm run sync:manual -- --type=incremental >> /var/log/shifu-sync.log 2>&1
```

**Option C: Docker Compose**

Add scheduler service to your `docker-compose.yml`:
```yaml
services:
  # ... existing services ...
  
  scheduler:
    build: .
    command: npm run sync:scheduler
    env_file: .env
    depends_on:
      - app
    restart: unless-stopped
```

## Configuration

### Cron Schedule Examples

```
"0 2 * * *"      - Daily at 2:00 AM
"0 */6 * * *"    - Every 6 hours
"*/30 * * * *"   - Every 30 minutes
"0 2 * * 0"      - Weekly on Sunday at 2:00 AM
"0 2 1 * *"      - Monthly on the 1st at 2:00 AM
```

### Recommended Schedule

- **Initial Import**: Manual full sync
- **Daily Updates**: Incremental sync at 2 AM
- **Weekly Cleanup**: Full sync every Sunday

## Monitoring

### Check Scheduler Status

```bash
# If using PM2
pm2 status shifu-scheduler
pm2 logs shifu-scheduler

# If running directly
# Check process is running
ps aux | grep run-scheduler
```

### View Recent Syncs

```bash
# Via API
curl http://localhost:3000/api/admin/sync/audit-logs?limit=10

# Via Admin UI
# Go to /admin/sync → "Audit Logs" tab
```

## Common Operations

### Manually Trigger a Sync

```bash
# Incremental (default)
npm run sync:manual

# Full sync
npm run sync:manual YOUR_CONFIG_ID --type=full

# Dry run (test without changes)
npm run sync:manual YOUR_CONFIG_ID --dry-run
```

### Disable Automatic Sync for a Professor

Via API:
```bash
PATCH /api/admin/profesores/[id]/sync
{
  "sync_enabled": false
}
```

Via Database:
```sql
UPDATE profesores 
SET sync_enabled = false 
WHERE id = 'professor-uuid';
```

### Protect a Field from Sync

Via API:
```bash
PATCH /api/admin/profesores/[id]/sync
{
  "manual_override_field": "bio",
  "enable_override": true
}
```

This prevents the sync from overwriting the "bio" field.

### Enable/Disable a Configuration

Via Admin UI:
1. Go to `/admin/sync`
2. Toggle the "Enabled" checkbox

Via API:
```bash
PATCH /api/admin/sync/configurations/[id]
{
  "enabled": false
}
```

## Troubleshooting

### Sync Fails to Start

**Check:**
- Configuration is enabled
- You have admin permissions
- Database migration was applied
- Network access to EAFIT website

**Debug:**
```bash
# Run with verbose logging
npm run sync:manual YOUR_CONFIG_ID 2>&1 | tee sync-debug.log
```

### No Records Created/Updated

**Possible causes:**
- All records already exist and haven't changed (incremental sync)
- Data validation failing
- Rate limiting from source website

**Check:**
- View detailed logs in Admin UI
- Run with `--dry-run` to see what would be imported
- Check `sync_record_logs` table for details

### Scheduler Not Running

**Check:**
- Process is running: `ps aux | grep run-scheduler`
- Cron expression is valid
- Configuration is enabled
- Check logs for errors

**Restart:**
```bash
# If using PM2
pm2 restart shifu-scheduler

# If using systemd
systemctl restart shifu-scheduler
```

## Security Checklist

- [ ] Sync endpoints require admin authentication
- [ ] Rate limiting configured for scraping
- [ ] Audit logs are being recorded
- [ ] Database backups are enabled
- [ ] Opt-out mechanism is working
- [ ] Manual overrides are respected

## Next Steps

After setup:

1. **Monitor First Week**
   - Check sync logs daily
   - Verify data quality
   - Adjust schedule if needed

2. **Configure Notifications** (Future)
   - Set up email alerts for failures
   - Configure webhooks for sync completion

3. **Fine-tune Settings**
   - Adjust schedule based on source update frequency
   - Set manual overrides for curated content
   - Handle opt-out requests

4. **Regular Maintenance**
   - Review audit logs weekly
   - Run full sync monthly
   - Update scraper if website changes

## Support

For issues:
1. Check audit logs in Admin UI
2. Review error messages in `sync_record_logs`
3. Consult main documentation: `docs/SYNC_SYSTEM.md`
4. Check application logs

## Quick Reference

```bash
# Create configuration (via UI preferred)
POST /api/admin/sync/configurations

# Run sync
npm run sync:manual [configId] [--type=full|incremental] [--dry-run]

# Start scheduler
npm run sync:scheduler

# View logs
GET /api/admin/sync/audit-logs

# View statistics
GET /api/admin/sync/statistics

# Toggle professor sync
PATCH /api/admin/profesores/[id]/sync
```

---

**Setup Time:** ~15-30 minutes (excluding first full sync)  
**First Full Sync:** ~10-30 minutes depending on professor count  
**Ongoing Maintenance:** ~5 minutes/week  

