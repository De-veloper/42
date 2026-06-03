# 42 App — v1.5 Roadmap

## 🏥 HealthKit (iOS)
- Switch from `react-native-health` to `@kingstinct/react-native-healthkit` (new arch compatible)
- Auto-write workouts to Apple Health when user saves a log
- Import heart rate + calories from Health to enrich fitness score
- Effort score blends feeling (50%) + heart rate zone (50%) when HR data exists
- Volume score blends duration (60%) + calories (40%) when calorie data exists

## 🏃 Journey Paths (Post-42)
- After completing Day 42, show a "What's Next?" screen with final stats
- User picks a goal-based path based on their workout history:
  - 🏃 Run a 5K — 8 weeks, 3 runs/week
  - 🚴 Ride 50km — 6 weeks, builds distance weekly
  - 🏊 Swim 1km — 6 weeks
  - 💪 Strength Base — 8 weeks
  - 🧘 Flexibility — 4 weeks daily
- App auto-suggests path matching most-logged workout type
- Each path has weekly targets, progress bar, and completion share card
- "Start Again" button on completion banner to restart the 42-day challenge

## 🏠 Home Screen Widget (iOS)
- Shows current day + fitness score at a glance
- Use `@bacons/apple-targets` Expo plugin for WidgetKit integration
- Shares data via App Groups (UserDefaults)

## 🐛 Known Issues / Polish
- HealthKit: `react-native-health` crashes on RN 0.85 (new arch incompatibility)
- Android GPS foreground service notification styling
- Test GPS tracking on physical Android device
- What happens after Day 42 — add "Start Again" or "What's Next" flow

## 💡 Ideas from v1 (build after using it)
- User name personalisation on home screen greeting
- Rest day notes ("Sore legs", "Travel day")
- Export workout history as CSV
- Share individual workout cards (not just the score card)
- Weekly summary push notification every Sunday

---

**v1 shipped:** iOS App Store + Google Play
**v1.5 target:** After personally completing the 42-day challenge
