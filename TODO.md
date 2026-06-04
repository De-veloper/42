# 42 App — v1.5 Roadmap

**v1 shipped:** iOS App Store + Google Play  
**v1.5 status:** In development on `v1.5` branch

---

## ✅ Journey Paths — Completed

- ✅ "What's Next?" screen after Day 42 with final stats
- ✅ 5 paths: Running, Riding, Swimming, Strength Base, Flexibility
- ✅ Each path: weekly targets, session dots, overall progress bar
- ✅ Completion share card (capture + share via iOS share sheet)
- ✅ Goal picker — 5K / 10K / Half Marathon for running; triathlon distances for riding
- ✅ Custom distance — user types any goal; capped by unlocked level (25mi unlocked → max 30mi custom)
- ✅ Progressive goal unlocking — 10K locked until 5K complete, ½ Ironman locked until ¼ done, etc.
- ✅ "What's next?" suggestions on Goal Achieved screen — shows unlocked next goal prominently
- ✅ Sessions per week picker — 1–4x, auto-adjusts weeks; recommendation when too low
- ✅ Multiple concurrent paths — start Run + Strength simultaneously
- ✅ Path achievements — goal badges (✅/🎯/🔒) + session milestones
- ✅ Health & Safety disclaimer — one-time acknowledgement before starting any path
- ✅ "Start Again" button on 42-day completion banner
- ✅ "Add another Journey Path" link when paths are active
- ✅ Home screen shows "Hi [Name]" if name is set in Settings
- ✅ GPS distance in miles
- ✅ Fitness score chart extends beyond Day 42

## 🔧 Journey Paths — Still To Do

- Auto-suggest path based on most-logged workout type (currently shows all equally)
- Path-specific share card improvements (add distance/pace if GPS tracked)
- Swim goals: add custom distance similar to Run/Ride

## 🏥 HealthKit (iOS) — Deferred

- `react-native-health` crashes on RN 0.85 (new arch incompatibility)
- Switch to `@kingstinct/react-native-healthkit` when available / time permits
- Goal: auto-write workouts to Apple Health, import HR + calories for fitness score

## 🏠 Home Screen Widget (iOS) — v2

- Shows current day + fitness score at a glance
- Use `@bacons/apple-targets` Expo plugin for WidgetKit integration

## 🤖 AI Coach Integration — v2

- Bring in AI coach (from ai-coach project) for personalised advice
- Reads workout history, fitness score, active paths, rest days
- "Ask AI Coach" button from Home or PathProgressScreen
- Eventually: auto-suggest next path based on performance patterns

## 📈 Lifetime Score — v2

- After hitting 100 (Elite), score keeps climbing: 200 → 500 → 1000
- New levels beyond Elite: Legend, Immortal, etc.
- Shareable lifetime score card

## 💡 Polish Ideas (build after using v1.5)

- Rest day notes ("Sore legs", "Travel day")
- Export workout history as CSV
- Share individual workout cards (not just the score card)
- Weekly summary push notification every Sunday
- Android GPS foreground service notification styling
- Test GPS on physical Android device

---

**v2 target:** After using v1.5 in the wild + completing a Journey Path
