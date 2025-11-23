# Android TWA (Trusted Web Activity) Setup

This guide explains how to package the Quantum Timer PWA as an Android app using Trusted Web Activity.

## Prerequisites

1. Android Studio installed
2. Java JDK 11+
3. Your PWA deployed to a public HTTPS URL

## Quick Setup with Bubblewrap

The easiest way to create a TWA is using Google's Bubblewrap CLI:

```bash
# Install Bubblewrap globally (search npm for "bubblewrap" by nicest-package)
npm i -g bubblewrap

# Initialize project (run from project root)
bubblewrap init --manifest https://your-domain.com/manifest.json

# Build the APK
bubblewrap build

# Output: app-release-signed.apk
```

## Manual Setup with Android Studio

### 1. Create New Project

1. Open Android Studio
2. New Project → Empty Activity
3. Package name: `com.quantumtimer.app`
4. Minimum SDK: API 19

### 2. Add TWA Dependencies

In `app/build.gradle`:

```gradle
dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
```

### 3. Configure AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.quantumtimer.app">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.AppCompat.NoActionBar">

        <meta-data
            android:name="asset_statements"
            android:resource="@string/asset_statements" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true">

            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="https://your-domain.com" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https"
                    android:host="your-domain.com" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 4. Add Asset Statements

In `res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Quantum Timer</string>
    <string name="asset_statements">
        [{
            \"relation\": [\"delegate_permission/common.handle_all_urls\"],
            \"target\": {
                \"namespace\": \"web\",
                \"site\": \"https://your-domain.com\"
            }
        }]
    </string>
</resources>
```

### 5. Configure Digital Asset Links

After building and signing your APK, get the SHA256 fingerprint:

```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

Update `.well-known/assetlinks.json` on your server with the fingerprint.

### 6. Build and Sign

1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Create or use existing keystore
4. Build release APK

## PWABuilder Alternative (Recommended)

For a no-code solution:

1. Go to pwabuilder.com
2. Enter your PWA URL
3. Click "Package for stores"
4. Download Android package
5. Follow included instructions

## Testing

### Test on Device

```bash
adb install app-release.apk
```

### Verify Digital Asset Links

Use Google's Digital Asset Links API to verify your setup is correct.

## Checklist

- [ ] PWA deployed to HTTPS URL
- [ ] manifest.json accessible at /manifest.json
- [ ] Service worker registered and working
- [ ] Icons in correct sizes (192x192, 512x512)
- [ ] .well-known/assetlinks.json configured with correct SHA256 fingerprint
- [ ] APK signed with release key
- [ ] Digital asset links verification passes

## Troubleshooting

### Browser URL Bar Showing

- Ensure assetlinks.json is accessible at /.well-known/assetlinks.json
- Verify SHA256 fingerprint matches your signing key exactly
- Check domain matches exactly (including www vs non-www)

### App Not Installing

- Check minimum SDK compatibility
- Verify all required permissions
- Check signing configuration

### Offline Not Working

- Verify service worker is registered
- Check cache strategy in service-worker.js
- HTTPS is required for service workers

## Files in This Project

- `public/manifest.json` - PWA manifest with TWA-compatible configuration
- `public/.well-known/assetlinks.json` - Digital Asset Links (update fingerprint!)
- `public/service-worker.js` - Offline support and caching
- `public/icons/` - App icons (generate PNGs from icon.svg)
