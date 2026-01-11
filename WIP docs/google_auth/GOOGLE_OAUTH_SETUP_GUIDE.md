# Google OAuth Setup Guide

## Step-by-Step Instructions to Obtain Google OAuth Credentials

### Prerequisites

- Google Account (Gmail)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

### Step 1: Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top left, next to "Google Cloud")
3. Click "New Project"
4. Enter project details:
   - **Project Name**: `TravelODesk` or `TravelODesk-Production`
   - **Organization**: (optional)
   - **Location**: (optional)
5. Click "Create"
6. Wait for project creation (usually takes a few seconds)

---

### Step 2: Enable Google APIs

1. From the left sidebar, go to: **APIs & Services** → **Library**
2. Search for: **Google+ API** (or **People API**)
3. Click on the API
4. Click **Enable**
5. Wait for API to be enabled

**Note**: Google+ API is deprecated but still works for basic profile info. For new projects, use **People API** or **Google Identity Services**.

---

### Step 3: Configure OAuth Consent Screen

1. From the left sidebar, go to: **APIs & Services** → **OAuth consent screen**
2. Select User Type:
   - **External** (for public users)
   - Click **Create**
3. Fill in required fields:

   **App Information**:

   - **App name**: `TravelODesk`
   - **User support email**: `support@travelodesk.in` (or your email)
   - **App logo**: (optional, upload company logo)

   **App domain**:

   - **Application home page**: `https://travelodesk.com`
   - **Application privacy policy link**: `https://travelodesk.com/privacy`
   - **Application terms of service link**: `https://travelodesk.com/terms`

   **Developer contact information**:

   - **Email addresses**: `support@travelodesk.in`

4. Click **Save and Continue**

5. **Scopes** screen:

   - Click **Add or Remove Scopes**
   - Select the following scopes:
     - `../auth/userinfo.email` - View your email address
     - `../auth/userinfo.profile` - See your personal info
   - Click **Update**
   - Click **Save and Continue**

6. **Test users** screen (if using External type):

   - Add test email addresses (optional for testing)
   - Click **Save and Continue**

7. **Summary** screen:
   - Review your settings
   - Click **Back to Dashboard**

---

### Step 4: Create OAuth 2.0 Client ID

1. From the left sidebar, go to: **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** (top)
3. Select **OAuth client ID**
4. Configure the client:

   **Application type**: Select **Web application**

   **Name**: `TravelODesk Web Client` (or any descriptive name)

   **Authorized JavaScript origins**: (optional)

   - `http://127.0.0.1:3060` (local)
   - `https://todsweb.travelodesk.com` (dev)
   - `http://stg.travelodesk.com` (staging)
   - `https://travelodesk.com` (production)

   **Authorized redirect URIs**: (CRITICAL - must match exactly)

   - `http://127.0.0.1:5050/api/auth/google/callback` (local)
   - `https://todapi.travelodesk.com/api/auth/google/callback` (dev)
   - `https://todsapi.travelodesk.com/api/auth/google/callback` (staging)
   - `https://api.travelodesk.com/api/auth/google/callback` (production)

5. Click **Create**

---

### Step 5: Copy Credentials

1. A modal will appear with your credentials:

   - **Client ID**: `1234567890-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz12`

2. **IMPORTANT**: Copy these values immediately!

3. You can also download the JSON file for backup

---

### Step 6: Update Environment Variables

1. Open: `/Users/vedan/Projects/travelodesk/todapi/.env`

2. Replace placeholder values:

   **Before**:

   ```bash
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
   ```

   **After**:

   ```bash
   GOOGLE_CLIENT_ID=1234567890-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz12
   ```

3. Save the file

---

### Step 7: Restart Backend Server

Since `.env` changes require a server restart:

```bash
# Option 1: If running with npm
cd /Users/vedan/Projects/travelodesk/todapi
npm run dev
# (Press Ctrl+C first to stop, then run again)

# Option 2: If running with PM2
pm2 restart todapi

# Option 3: Find process and kill
lsof -i :5050
kill -9 <PID>
npm run dev
```

---

### Step 8: Test OAuth Flow

1. Open browser and go to: `http://127.0.0.1:3060/signin`

2. Click **"Sign in with Google"** button

3. You should be redirected to Google's consent screen

4. Select your Google account

5. Grant permissions (email and profile)

6. You should be redirected back to TravelODesk and logged in

7. Verify in database:
   ```sql
   SELECT id, email, google_id, oauth_provider, is_oauth_user
   FROM tod_users
   WHERE oauth_provider = 'google'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## Troubleshooting

### Error: "Redirect URI mismatch"

**Cause**: The callback URL in your code doesn't match Google Console settings

**Solution**:

1. Check `.env` file: `GOOGLE_CALLBACK_URL_LOC`
2. Go to Google Console → Credentials → Edit OAuth Client
3. Verify redirect URI is exactly: `http://127.0.0.1:5050/api/auth/google/callback`
4. No trailing slashes!
5. Protocol must match (http vs https)

### Error: "Invalid client"

**Cause**: Client ID or Client Secret is incorrect

**Solution**:

1. Go to Google Console → Credentials
2. Click on your OAuth Client ID
3. Copy Client ID and Client Secret again
4. Update `.env` file
5. Restart server

### Error: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not properly configured

**Solution**:

1. Go to Google Console → OAuth consent screen
2. Ensure all required fields are filled
3. Add necessary scopes (email, profile)
4. If "External" type, publish the app or add test users

### Error: "This app is not verified"

**Cause**: App is in testing mode or not verified by Google

**Solution** (for testing):

1. Click "Advanced"
2. Click "Go to TravelODesk (unsafe)"
3. This is normal for development

**Solution** (for production):

1. Go to Google Console → OAuth consent screen
2. Click "Publish App"
3. Submit for verification (if needed)

### User created but not logged in

**Cause**: Frontend not receiving tokens or profile fetch failed

**Solution**:

1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify tokens in URL: `/auth/callback?access_token=...&refresh_token=...`
4. Check network tab for `/getprofile` request
5. Verify CORS settings allow frontend domain

---

## Security Best Practices

1. **Never commit credentials to Git**:

   - `.env` files should be in `.gitignore`
   - Use environment variables in production

2. **Rotate credentials regularly**:

   - Every 90 days minimum
   - Immediately if compromised

3. **Limit redirect URIs**:

   - Only add URIs you actually use
   - Remove test URIs in production

4. **Use HTTPS in production**:

   - OAuth requires HTTPS for redirect URIs
   - Only exception is `localhost` or `127.0.0.1`

5. **Monitor usage**:
   - Check Google Cloud Console quotas
   - Set up billing alerts
   - Review OAuth consent logs

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)

---

## Support

For issues related to:

- Google Cloud setup: [Google Cloud Support](https://cloud.google.com/support)
- TravelODesk implementation: Check `/WIP/GOOGLE_OAUTH_IMPLEMENTATION.md`
- Database issues: Check PostgreSQL logs
- Server errors: Check `todapi/logger.txt`

---

**Last Updated**: November 7, 2024
