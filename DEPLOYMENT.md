# Deployment Guide

## 📱 PWA Deployment

### 1. Build the Application

```bash
npm install
npm run build
```

### 2. Generate Icons

Before deploying, generate the required icon files:

```bash
# Option A: Using ImageMagick (recommended)
convert public/icons/icon.svg -resize 192x192 public/icons/icon-192.png
convert public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
convert public/icons/icon.svg -resize 512x512 public/icons/icon-maskable.png

# Option B: Using Inkscape
inkscape public/icons/icon.svg --export-type=png --export-width=192 --export-filename=public/icons/icon-192.png
inkscape public/icons/icon.svg --export-type=png --export-width=512 --export-filename=public/icons/icon-512.png
inkscape public/icons/icon.svg --export-type=png --export-width=512 --export-filename=public/icons/icon-maskable.png

# Option C: Online tool
# Upload public/icons/icon.svg to https://realfavicongenerator.net/
```

### 3. Deploy to Netlify

#### Via Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Via Netlify Dashboard:
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy!

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### 5. Verify PWA

After deployment:
1. Open your site in Chrome
2. Open DevTools → Application → Manifest
3. Verify all icons load correctly
4. Check Service Worker is registered
5. Test "Install App" prompt

---

## 🤖 Android App Deployment

### Prerequisites

- Node.js 14+
- JDK 8 or higher
- Android SDK (via Android Studio)
- Google Play Developer account ($25 one-time fee)

### Step 1: Install Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

### Step 2: Update Configuration

Edit `twa-manifest.json`:
- Replace `host` with your deployed domain
- Update `packageId` to your unique package name
- Update icon URLs to your deployed URLs

### Step 3: Initialize TWA Project

```bash
bubblewrap init --manifest=https://your-domain.com/manifest.json
```

This will:
- Download your manifest
- Validate settings
- Create Android project structure
- Generate signing key

**IMPORTANT**: Save your keystore file securely! You'll need it for all future updates.

### Step 4: Build APK/AAB

For testing (APK):
```bash
bubblewrap build
```

For Play Store (AAB):
```bash
bubblewrap build --release
```

Output location: `./app-release-signed.aab`

### Step 5: Verify Digital Asset Links

1. Upload `assetlinks.json` to your website at:
   ```
   https://your-domain.com/.well-known/assetlinks.json
   ```

2. Get your certificate fingerprint:
   ```bash
   keytool -list -v -keystore android.keystore -alias quantum-countdown
   ```

3. Update `assetlinks.json` with the SHA-256 fingerprint

4. Verify at:
   ```
   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://your-domain.com&relation=delegate_permission/common.handle_all_urls
   ```

### Step 6: Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create new app
3. Fill out store listing:
   - App name: Quantum Countdown
   - Description: (use content from README)
   - Screenshots: (capture from different themes)
   - Feature graphic: 1024x500
   - App icon: 512x512

4. Upload the AAB file to Production → Release

5. Complete content rating questionnaire

6. Set pricing (Free)

7. Select countries

8. Submit for review

### Step 7: Testing Before Release

#### Internal Testing:
1. Upload AAB to Internal Testing track
2. Add test users
3. Share testing link
4. Verify functionality

#### Closed/Open Testing:
1. Promote to closed/open testing
2. Gather user feedback
3. Fix any issues

### Step 8: Production Release

1. Promote from testing to production
2. Google will review (typically 24-48 hours)
3. Once approved, app goes live!

---

## 🔄 Updates and Maintenance

### Updating the PWA

1. Make changes
2. Increment version in `public/service-worker.js`:
   ```javascript
   const CACHE_NAME = 'quantum-countdown-v2'; // increment version
   ```
3. Build and deploy
4. Service worker will auto-update on user's next visit

### Updating the Android App

1. Make changes to web app
2. Deploy web app
3. Increment version in `twa-manifest.json`:
   ```json
   {
     "appVersionName": "1.1.0",
     "appVersionCode": 2
   }
   ```
4. Rebuild: `bubblewrap build --release`
5. Upload new AAB to Play Console
6. Submit update

**IMPORTANT**: Always use the same keystore file for updates!

---

## 🔐 Security Checklist

- [ ] HTTPS enabled on hosting
- [ ] Service worker served over HTTPS
- [ ] Manifest.json accessible
- [ ] Icons load correctly
- [ ] Digital Asset Links verified
- [ ] Keystore backed up securely
- [ ] Certificate fingerprint matches assetlinks.json
- [ ] CSP headers configured (optional but recommended)

---

## 📊 Monitoring

### PWA Analytics

Add Google Analytics or similar:

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
```

### Android Analytics

Firebase Analytics is automatically available via Play Console.

---

## 🐛 Troubleshooting

### PWA Issues

**Service worker not registering:**
- Check HTTPS is enabled
- Verify service-worker.js path is correct
- Check browser console for errors

**Icons not showing:**
- Verify icon paths in manifest.json
- Check icon files exist and are accessible
- Try hard refresh (Ctrl+Shift+R)

**Install prompt not showing:**
- PWA criteria must be met (HTTPS, manifest, service worker, icons)
- User must visit site at least twice
- Some browsers require user engagement

### Android Issues

**Digital Asset Links verification failed:**
- Check assetlinks.json is at `/.well-known/assetlinks.json`
- Verify SHA-256 fingerprint matches
- Ensure file is accessible (no auth required)

**Build failed:**
- Check JDK version (8 or higher)
- Verify Android SDK is installed
- Update Bubblewrap: `npm update -g @bubblewrap/cli`

**App not opening TWA:**
- Verify Digital Asset Links
- Check package name matches
- Ensure host domain is correct

---

## 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [Google Play Console](https://play.google.com/console)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)

---

## 💡 Tips

1. **Test PWA locally**: Use `npm run preview` after building
2. **Test on real devices**: Use Android Studio emulator or physical device
3. **Progressive rollout**: Use staged rollout in Play Console
4. **Monitor reviews**: Respond to user feedback quickly
5. **Keep dependencies updated**: Regular security updates are important

---

## Support

For issues or questions:
- Open an issue on GitHub
- Check browser console for errors
- Review service worker status in DevTools
- Test on multiple devices/browsers
