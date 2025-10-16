# Winnovate PWA Setup

This document explains the PWA (Progressive Web App) setup for the Winnovate client website with Nudgify push notifications integration.

## Architecture Overview

### Two Separate Service Workers

1. **`sw.js`** (Client's PWA Service Worker)
   - Handles offline caching
   - Manages PWA installation
   - Provides offline fallback pages
   - Owned by the client (Winnovate)

2. **`firebase-messaging-sw.js`** (Nudgify's Push Notification Service Worker)
   - Handles push notifications via Firebase/Web Push
   - Registered by `push-optin.js`
   - Owned by Nudgify (the service provider)
   - **Should NOT be modified by clients**

### Why Two Service Workers?

- Service workers can coexist with different scopes
- `sw.js` manages PWA features (offline, caching, app shell)
- `firebase-messaging-sw.js` manages push notifications
- No conflicts - they serve different purposes

## Files Structure

```
winnovate-fomo/
├── index.html              # Main page with PWA meta tags
├── manifest.json           # PWA manifest
├── sw.js                   # PWA service worker (CLIENT)
├── offline.html            # Offline fallback page
├── push-optin.js           # Nudgify's push opt-in script (NUDGIFY)
├── firebase-messaging-sw.js # Nudgify's push SW (NUDGIFY)
├── generate-icons.html     # Icon generator tool
└── icons/                  # PWA icons directory
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png
```

## Setup Instructions

### 1. Generate PWA Icons

Open `generate-icons.html` in a browser:

```bash
open generate-icons.html
```

- Click "Generate Icons"
- Download all icons
- Create `icons/` folder
- Save icons with proper names

### 2. Deploy Files

Ensure all files are in the root directory of your website:

- ✅ `manifest.json`
- ✅ `sw.js`
- ✅ `offline.html`
- ✅ `icons/` folder with all icons

### 3. HTTPS Required

PWA and push notifications **require HTTPS**. Make sure your site is served over SSL.

### 4. Test Installation

#### Desktop (Chrome/Edge)
1. Open your site
2. Click the install icon in the address bar
3. Or go to Settings → Install Winnovate

#### Mobile (Android)
1. Open site in Chrome
2. Tap "Add to Home Screen"
3. App icon appears on home screen

#### iOS (Safari)
1. Open site in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. iOS 16.4+ required for push notifications

## PWA Features

### ✅ Offline Support
- App shell cached for offline access
- Offline page shown when no connection
- Auto-reconnect when network restored

### ✅ Installable
- "Install App" prompt shows automatically
- App can be added to home screen
- Runs in standalone mode (no browser UI)

### ✅ App-like Experience
- Custom splash screen
- Theme color integration
- Full-screen mode
- App shortcuts

### ✅ Push Notifications
- Handled by Nudgify's service
- Works independently from PWA
- Cross-platform support

## Customization

### Update App Name/Colors

Edit `manifest.json`:

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "theme_color": "#your-color",
  "background_color": "#your-bg-color"
}
```

### Modify Cached Resources

Edit `sw.js`:

```javascript
const CACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    // Add your own resources here
];
```

### Update Offline Page

Edit `offline.html` to match your brand.

## How It Works Together

```
┌─────────────────────────────────────┐
│         Client's Website            │
│           (Winnovate)               │
└──────────┬─────────────┬────────────┘
           │             │
           │             │
      ┌────▼────┐   ┌────▼────────────┐
      │  sw.js  │   │ push-optin.js   │
      │  (PWA)  │   │   (Nudgify)     │
      └────┬────┘   └────┬────────────┘
           │             │
           │             │
    ┌──────▼──────┐ ┌───▼───────────────────┐
    │   Offline   │ │firebase-messaging-sw.js│
    │   Caching   │ │  (Push Notifications)  │
    └─────────────┘ └───────────────────────┘
```

## Service Worker Registration

Both service workers register automatically:

1. **`sw.js`** - Registered in `index.html` (line 65)
   ```javascript
   navigator.serviceWorker.register('/sw.js', { scope: '/' })
   ```

2. **`firebase-messaging-sw.js`** - Registered by `push-optin.js`
   - Happens when user grants push permission
   - Managed by Nudgify automatically

## Testing Checklist

- [ ] Icons display correctly in manifest
- [ ] App installs on desktop
- [ ] App installs on mobile
- [ ] Offline page shows when network off
- [ ] PWA launches in standalone mode
- [ ] Push notifications work (Nudgify)
- [ ] App updates properly
- [ ] Theme colors applied correctly

## Troubleshooting

### PWA Won't Install
- Check HTTPS is enabled
- Verify `manifest.json` is accessible
- Ensure all icons exist
- Check browser console for errors

### Service Worker Conflicts
- Clear site data in DevTools
- Unregister all service workers
- Hard refresh (Ctrl+Shift+R)
- Re-register service workers

### Icons Not Showing
- Verify icon paths in `manifest.json`
- Check icons exist in `/icons/` folder
- Clear cache and reload

## Browser Support

- ✅ Chrome/Edge (Desktop & Android)
- ✅ Safari (macOS & iOS 16.4+)
- ✅ Firefox (Desktop & Android)
- ✅ Samsung Internet
- ⚠️ iOS < 16.4 (No push notifications)

## Notes

- **Never modify** `firebase-messaging-sw.js` or `push-optin.js` - these are Nudgify's files
- **Always keep** `sw.js` and `manifest.json` up to date with your app
- **Test offline mode** regularly to ensure caching works
- **Update CACHE_NAME** in `sw.js` when deploying new versions

## Support

For PWA issues: Check browser DevTools → Application tab
For Push Notifications: Contact Nudgify support
