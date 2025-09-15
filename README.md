# Breakdown Buddy - React Native Mobile App

## Quick Start

```bash
# Managed workflow setup with dependency sync
npm run prebuild:managed

# Start development server
npm start
```

## Production Build

```bash
# Complete managed workflow build for Play Store
npm run build:android

# Manual step verification
npm run sync         # Git pull from master
npm run doctor       # Verify expo-doctor passes
npm run doctor:fix   # Fix any version mismatches
npm run commit:deps  # Commit dependency updates
```

## Test on Device

1. Install **Expo Go** from Google Play Store
2. Scan QR code from terminal
3. App loads on your device

## Configuration

Edit `src/services/api.ts` with your backend URL:
```typescript
const API_BASE_URL = 'https://your-backend-url.replit.dev/api';
```

## Features

- Native React Native app with Expo
- Authentication with secure storage
- Push notifications
- Camera and GPS access
- Real-time messaging
- Material Design UI
- Automated managed workflow prevents dependency conflicts
- Cross-platform build support (Windows/Unix)
- Permanent build setup requires no manual intervention

## Project Structure

```
src/
├── components/          # Reusable components
├── context/            # React contexts
├── navigation/         # App navigation
├── screens/           # App screens
├── services/          # API services
└── theme/            # Design system
```