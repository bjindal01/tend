# Tend

Tend is a personal CRM for staying in touch with the people who matter. You pick how often you want to talk to each person, Tend tells you when someone is due, and it keeps track of what you talked about so the next conversation is easy to start.

Built with Expo (SDK 58), Expo Router and React Native. All data stays on your phone.

## Screens

- **Today.** Who's due today and why: a birthday, a person past their check-in interval, or something you said you'd follow up on. Also shows your progress for the day, a conversation starter pulled from your notes, and what's coming up.
- **People.** Everyone, grouped into circles (Inner circle, Close friends, Family, Work network, Friends & network). You can search names and notes and filter by circle. Each person has a bar showing how close they are to being due.
- **Map.** You at the center with your circles as rings around you. Each line from you to a person shows how recently you've been in touch:
  - green, solid: on track
  - amber, dashed: fading, between 1× and 2× their check-in interval
  - red, dotted: untouched, more than 2× the interval

  Thin grey lines connect people who know each other. You can filter to just the people who need attention.
- **Rhythm.** A 12-week heatmap of how often you've been in touch, your streak in weeks, how many people in each circle are on track, and a list of people you're drifting away from.
- **Person.** Message or call in one tap, things to remember about them, and the full history of your conversations.
- **Log a touch.** Record how you connected (call, text, in person, video or email), add a note and something to remember for next time, and choose when Tend should remind you again.
- **Add / Edit person.** Name, how you know them, circle, how often to stay in touch, phone, email, birthday, and who they know.

The first time you open the app it loads made-up sample contacts. To reset them or start fresh, tap **⋯** on the Today screen.

## Run it on your phone

You need Node 20 or newer, plus the **Expo Go** app on your phone (from the App Store or Google Play). Your Expo Go version must support SDK 58.

```bash
npm install
npx expo start
```

Scan the QR code with your iPhone camera, or from inside Expo Go on Android. To run it in a simulator, press `i` for iOS (needs Xcode) or `a` for Android (needs Android Studio).

## Project layout

```
src/
  app/                 Routes (Expo Router)
    _layout.tsx        Fonts, data store, root stack
    (tabs)/            Today, People, Map, Rhythm
    person/[id].tsx    Contact profile
    log.tsx            Log a touch (modal)
    person-form.tsx    Add / edit person (modal)
  components/          Icons and shared UI
  lib/
    store.tsx          App state, saved with AsyncStorage
    status.ts          On-track / fading / untouched logic
    seed.ts            Sample data
    theme.ts           Colors and fonts
```

## Ideas for what's next

- Local push notifications for nudges (`expo-notifications`)
- Import people from the phone's contacts (`expo-contacts`)
- Drag people between rings on the Map to change how often you stay in touch
- iCloud or Supabase sync between devices
