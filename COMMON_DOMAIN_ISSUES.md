# Common Domain Connection Issues & Solutions

## Issue 1: "Domain Not Found" Error
**Symptoms**: Vercel can't verify domain ownership
**Cause**: DNS records not properly set
**Solution**:
1. Go back to GoDaddy DNS management
2. Verify CNAME records are exactly:
   - @ → cname.vercel-dns.com
   - www → cname.vercel-dns.com
3. Wait 30 minutes and try again

## Issue 2: Site Shows "404 Not Found"
**Symptoms**: Domain loads but shows 404 error
**Cause**: Wrong build configuration in Vercel
**Solution**:
1. Go to Vercel project settings
2. Click "Functions" → "Build & Output Settings"
3. Ensure "Framework Preset" is "Other"
4. Ensure "Output Directory" is empty
5. Redeploy the project

## Issue 3: Mixed Content Warnings
**Symptoms**: Some images/assets not loading over HTTPS
**Cause**: Asset paths pointing to HTTP
**Solution**:
This is already fixed in streamaix-IMAGES-FIXED.tar.gz package

## Issue 4: DNS Propagation Taking Too Long
**Symptoms**: Domain not working after several hours
**Cause**: Global DNS update delays
**Solutions**:
1. Use different DNS servers (8.8.8.8, 1.1.1.1)
2. Check propagation at whatsmydns.net
3. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

## Issue 5: GoDaddy Won't Save DNS Records
**Symptoms**: Records disappear after saving
**Cause**: Conflicting existing records
**Solution**:
1. Delete ALL DNS records first (A, AAAA, CNAME)
2. Wait 5 minutes
3. Add only the two CNAME records needed
4. Don't add any A records

## Issue 6: Vercel Domain Shows "Invalid Configuration"
**Symptoms**: Red warning in Vercel domains
**Cause**: Multiple domains pointing to same CNAME
**Solution**:
1. Remove domain from Vercel
2. Wait 10 minutes
3. Re-add domain
4. Ensure only one Vercel project uses this domain

## Issue 7: Site Loads But Images Still Missing
**Symptoms**: Site works but avatar images don't display
**Cause**: Using old deployment package
**Solution**:
Ensure you're using streamaix-IMAGES-FIXED.tar.gz (the latest package with fixed images)

## Quick Verification Commands

### Check DNS Records:
```bash
nslookup yourdomain.com
dig CNAME yourdomain.com
```

### Check SSL Certificate:
```bash
curl -I https://yourdomain.com
```

### Check Global DNS Propagation:
Visit: https://whatsmydns.net
Enter your domain, select CNAME

## Emergency Reset Process
If everything breaks:
1. Delete domain from Vercel
2. Delete all DNS records in GoDaddy
3. Wait 1 hour
4. Start over from Step 1

## Expected Timelines
- DNS record changes: 5-30 minutes
- Vercel verification: 5-15 minutes
- Global propagation: 2-48 hours
- SSL certificate: Automatic within 5 minutes