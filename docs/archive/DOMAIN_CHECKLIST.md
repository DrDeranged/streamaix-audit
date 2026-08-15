# Domain Connection Checklist

## Before You Start
- [ ] Have your domain name ready
- [ ] Have GoDaddy login credentials  
- [ ] Have GitHub account
- [ ] Have Vercel account (free)

## Step 1: Vercel Deployment
- [ ] GitHub repository created
- [ ] Uploaded streamaix-IMAGES-FIXED.tar.gz files
- [ ] Connected repository to Vercel
- [ ] Selected "Other" framework (leave build settings empty)
- [ ] Site deployed and working on Vercel URL
- [ ] Copied Vercel URL for testing

## Step 2: GoDaddy DNS
- [ ] Logged into GoDaddy
- [ ] Found domain in "My Products" → "DNS"
- [ ] Deleted ALL existing A and CNAME records
- [ ] Added CNAME @ → cname.vercel-dns.com
- [ ] Added CNAME www → cname.vercel-dns.com
- [ ] Set TTL to 600 for both records
- [ ] Saved changes

## Step 3: Vercel Domain Setup
- [ ] Opened Vercel project settings
- [ ] Clicked "Domains" section
- [ ] Added main domain (yourdomain.com)
- [ ] Added www domain (www.yourdomain.com)
- [ ] Both domains show green checkmarks

## Step 4: Testing
- [ ] Waited 30 minutes after DNS changes
- [ ] Tested http://yourdomain.com
- [ ] Tested https://yourdomain.com
- [ ] Tested https://www.yourdomain.com
- [ ] All URLs show StreamAiX site
- [ ] SSL certificate working (https shows lock icon)

## Troubleshooting Reference
- **Red X in Vercel**: Wait 30 minutes, check DNS records
- **Site not loading**: Clear browser cache, try incognito
- **DNS issues**: Use whatsmydns.net to check propagation
- **SSL problems**: Vercel handles this automatically

## Success Indicators
✅ Green checkmarks in Vercel domains section
✅ Your domain loads StreamAiX site with https://
✅ Both www and non-www versions work
✅ Professional images display in all sections