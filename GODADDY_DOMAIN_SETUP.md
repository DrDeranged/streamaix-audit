# Connecting StreamAiX to GoDaddy Domain

## Step-by-Step Domain Connection Process

### 1. Deploy to Vercel First
- Extract `streamaix-IMAGES-FIXED.tar.gz`
- Upload to GitHub repository
- Import to Vercel and deploy
- Note your Vercel deployment URL (e.g., `streamaix-abc123.vercel.app`)

### 2. GoDaddy DNS Configuration

#### A. Log into GoDaddy
1. Go to godaddy.com and sign in
2. Navigate to "My Products" → "DNS"
3. Find your domain and click "Manage"

#### B. Update DNS Records
**Delete existing records** (if any):
- Remove any existing A records
- Remove any existing CNAME records for @ and www

**Add new CNAME records**:
1. **Record 1 (Root domain)**:
   - Type: CNAME
   - Name: @
   - Value: cname.vercel-dns.com
   - TTL: 3600 (1 hour)

2. **Record 2 (WWW subdomain)**:
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com
   - TTL: 3600 (1 hour)

### 3. Vercel Domain Configuration

#### A. Add Domain in Vercel
1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `yourdomain.com`)
4. Add www version (e.g., `www.yourdomain.com`)

#### B. Verification
- Vercel will automatically verify domain ownership
- This may take 5-30 minutes for DNS propagation
- You'll see a green checkmark when successful

### 4. SSL Certificate
- Vercel automatically provides SSL certificates
- No additional configuration needed
- Your site will be accessible via https://yourdomain.com

### 5. Redirect Configuration (Optional)
Add this to your `vercel.json` for www → non-www redirect:
```json
{
  "redirects": [
    {
      "source": "https://www.yourdomain.com/:path*",
      "destination": "https://yourdomain.com/:path*",
      "permanent": true
    }
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```

## Troubleshooting

### Common Issues:
1. **DNS Propagation Delay**: Can take up to 48 hours globally
2. **Cache Issues**: Clear browser cache or try incognito mode
3. **Wrong DNS Records**: Double-check CNAME values

### Verification Commands:
```bash
# Check DNS propagation
nslookup yourdomain.com

# Check CNAME records
dig CNAME yourdomain.com
```

## Expected Timeline:
- DNS updates: 5-30 minutes
- Global propagation: Up to 48 hours
- SSL certificate: Automatic within minutes

Your StreamAiX landing page will be live on your custom domain with professional SSL encryption.