# Connect Your Domain to StreamAiX (GoDaddy + Vercel)

## IMPORTANT: Do These Steps in Exact Order

### STEP 1: Deploy to Vercel First
1. **Upload your files to GitHub**:
   - Create new repository on GitHub
   - Upload contents of `streamaix-IMAGES-FIXED.tar.gz`
   - Make sure all files are in the root directory

2. **Connect to Vercel**:
   - Go to vercel.com and sign up/login
   - Click "Import Project" 
   - Select your GitHub repository
   - **Framework Preset**: Select "Other" (leave blank)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - Click "Deploy"

3. **Get your Vercel URL**:
   - After deployment, copy the URL (like `yourproject-abc123.vercel.app`)
   - Test that your site works on this URL first

### STEP 2: Configure GoDaddy DNS (EXACT STEPS)

1. **Login to GoDaddy**:
   - Go to godaddy.com → Sign in
   - Click "My Products" 
   - Find your domain → Click "DNS"

2. **Delete ALL existing records**:
   - Look for any A records pointing to @ or www
   - Look for any CNAME records for @ or www  
   - Delete them all (click trash icon)

3. **Add exactly these 2 records**:

   **Record #1**:
   - Type: `CNAME`
   - Name: `@` (exactly the @ symbol)
   - Value: `cname.vercel-dns.com` (copy this exactly)
   - TTL: `600` (10 minutes)

   **Record #2**:
   - Type: `CNAME` 
   - Name: `www`
   - Value: `cname.vercel-dns.com` (same as above)
   - TTL: `600` (10 minutes)

4. **Save changes** and wait 10 minutes

### STEP 3: Add Domain in Vercel

1. **Go to your Vercel project**:
   - Dashboard → Select your project
   - Click "Settings" tab
   - Click "Domains" in sidebar

2. **Add your domain**:
   - Click "Add" button
   - Type your domain: `yourdomain.com` (without www)
   - Click "Add"

3. **Add www version**:
   - Click "Add" again  
   - Type: `www.yourdomain.com`
   - Click "Add"

4. **Wait for verification**:
   - You'll see "Pending" status
   - Should turn green within 30 minutes
   - If it stays red, check your DNS settings

### STEP 4: Test Your Domain

1. **Wait 30 minutes** after DNS changes
2. **Test these URLs**:
   - `http://yourdomain.com`
   - `https://yourdomain.com` 
   - `https://www.yourdomain.com`
3. **All should show your StreamAiX site**

## If Something Goes Wrong

### DNS Not Working?
- **Check**: DNS records are exactly `cname.vercel-dns.com`
- **Wait**: Up to 2 hours for global updates
- **Clear**: Browser cache or use incognito mode

### Vercel Shows Red X?
- **Double-check**: Domain spelling in Vercel matches your actual domain
- **Verify**: DNS records are saved in GoDaddy
- **Wait**: 30 minutes then refresh Vercel page

### Still Not Working?
1. Go to whatsmydns.net
2. Enter your domain
3. Select "CNAME" from dropdown
4. Check if it shows `cname.vercel-dns.com` globally

## What You Get
- Your StreamAiX site on your custom domain
- Automatic SSL certificate (https://)
- Professional landing page with all images working
- Mobile responsive design
- Fast global delivery

**Total setup time: 30 minutes to 2 hours depending on DNS propagation**