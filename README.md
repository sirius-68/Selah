# Selah

Scripture affirmations, deep prayer and quiet freedom, as a native app for Android and iOS.

Built with **React Native + Expo** (TypeScript, expo-router). Every screen is drawn with native views, with no WebView. It is a port of the Selah web app ([selah-prayer.netlify.app](https://selah-prayer.netlify.app/)) and shares its Supabase account and data, so the website and the apps sync with each other.

## What's inside

- **Today**: quiet-time goals with a daily scripture affirmation, streaks, today's schedule and the weekly update.
- **Bible**: KJV, Louis Segond 1910, Darby (French) and Synodal (Russian), offline, with search, highlights, bookmarks, notes and "make it your affirmation".
- **Explore**: Upper room (prayer sessions and watches with read-aloud scripture and music), My journal, Break free (habit tracker with pledge, craving help, check-ins and patterns), Ask the Guide, Sleep Scapes, affirmation packs and widgets.
- **Share cards**: colour or photo backgrounds (or your own photo), exported as 1080 × 1350 images.
- **Accounts and sync**: Supabase email, Google and Apple sign-in; optional end-to-end encryption that is compatible with the web app.
- **Privacy**: passcode lock with fingerprint or face unlock.
- **Reminders**: real system notifications for quiet times, watches, pledges and check-ins.
- **Languages**: English, Français and Русский.

## Run it

```bash
npm install
npx expo start          # then press a for Android or i for iOS (Expo Go or a dev build)
```

Native builds:

```bash
npx expo run:android    # needs Android Studio
npx expo run:ios        # needs Xcode on a Mac
```

## Builds

GitHub Actions (`.github/workflows/ci.yml`) runs on every push to `main`:

- **check**: installs, lines up Expo SDK versions, type-checks, bundles for Android, iOS and web, and screenshots the web build.
- **android**: builds a release APK and publishes it on the **Android preview** release.
- **ios**: builds the app for the iOS simulator.

## Supabase setup

1. Run `supabase/setup.sql` in the Supabase SQL editor.
2. In **Authentication → URL Configuration**, add `selah://auth` to the redirect URLs, so email links and Google and Apple sign-in come back to the app.

## Before launch

- Set `TEST_AUTH` to `false` in `src/lib/content.ts`, so sign-in uses real accounts.
- Payments are a test-mode stub. In the stores they become Google Play Billing and StoreKit, for example through RevenueCat.
