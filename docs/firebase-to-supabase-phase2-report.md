# Firebase to Supabase Migration Report

Date: 2026-05-20
Phase: 2 - Firebase analysis and migration planning
Status: Safe analysis only. No Firebase functionality removed.

## Executive summary

The app is still actively dependent on Firebase for authentication and Firestore data access.
Supabase is currently connected only as a non-blocking test path and is not yet responsible for production auth or user data.

This means production is still safe, but Phase 3 and later must keep Firebase running in parallel until Supabase replacements are confirmed working.

## Current Firebase setup

Primary setup file:
- [firebase.ts](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/firebase.ts)

Configured Firebase services:
- Firebase Auth
- Firestore

Configured but not actively used in code:
- Firebase Storage bucket exists in config, but no direct Storage API usage was found in the app code

## Firebase Auth usage

Auth is initialized from:
- [firebase.ts](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/firebase.ts)

Main auth listeners and flows:
- [App.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/App.tsx)
  - `auth.onIdTokenChanged(...)`
  - `auth.signOut()`
- [components/Auth.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/components/Auth.tsx)
  - `auth.sendPasswordResetEmail(...)`
  - `auth.signInWithEmailAndPassword(...)`
  - `auth.createUserWithEmailAndPassword(...)`
  - `user.updateProfile(...)`
  - `user.sendEmailVerification()`
  - `auth.onIdTokenChanged(...)`
  - `currentUser.reload()`

### Current auth behavior

The app currently depends on Firebase Auth for:
- sign up
- login
- password reset
- email verification
- profile display name updates
- persistent signed-in session handling
- gating access to the main app until user verification is accepted

### Migration risk

High risk if replaced directly.

Reason:
- auth state is deeply connected to app boot, profile sync, and verified-email flow
- replacing this without parallel session support could lock users out or cause blank-screen/session bugs

### Recommended Phase 3 strategy

- Keep Firebase Auth active
- Add Supabase Auth in parallel
- Mirror login session checks without removing Firebase guards
- Only promote Supabase as primary auth after:
  - session persistence is stable
  - verified email flow is mapped safely
  - profile boot logic works end-to-end

## Firestore usage

Firestore is initialized from:
- [firebase.ts](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/firebase.ts)

### Collections/subcollections found

Top-level:
- `users`

Nested under each user document:
- `users/{uid}/alarms`
- `users/{uid}/clocks`

### User profile document

Used in:
- [components/Auth.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/components/Auth.tsx)
- [components/Profile.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/components/Profile.tsx)

Known fields observed:
- `name`
- `email`
- `photoFileName`
- `createdAt`
- `updatedAt`

Operations:
- create user profile doc on sign-up
- update display name
- fetch profile for profile modal
- delete profile on account deletion

### Alarms subcollection

Used in:
- [components/Alarm.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/components/Alarm.tsx)
- [components/Profile.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/components/Profile.tsx)

Known fields observed:
- `time`
- `label`
- `active`
- `days`
- `sound`
- `createdAt`
- `updatedAt`

Operations:
- live subscription via `onSnapshot`
- create
- update
- toggle active state
- delete
- auto-deactivate one-time alarms
- delete all alarms during account deletion

### Clocks subcollection

Used in:
- [components/Clock.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/components/Clock.tsx)
- [components/Profile.tsx](/Users/raviatharvaa/Documents/New project/App Builder /Focus-Timer-repo/components/Profile.tsx)

Known fields observed:
- `name`
- `country`
- `offset`
- `mood`
- `createdAt`

Operations:
- live subscription via `onSnapshot`
- create
- delete
- delete all clocks during account deletion

## Firebase Storage usage

Result of code analysis:
- no active Firebase Storage API calls found
- no `ref`, `uploadBytes`, `getDownloadURL`, or similar storage calls are currently used

### Important note

The profile data contains a `photoFileName` field, but the app does not appear to resolve or upload actual files through Firebase Storage at this time.

### Migration implication

Storage migration is low priority for now.
We should confirm whether future profile-avatar uploads are planned before creating Supabase Storage buckets.

## Local-only data not in Firebase

The app also stores significant data in browser local storage, including:
- daily goal
- achievement preferences
- achievement badges
- tasks
- session history
- theme settings
- notification preferences

These are not blocked by Firebase migration, but they do affect user experience and should be considered if we later centralize persistence in Supabase.

## Production-safe migration recommendations

### Phase 3

Implement Supabase Auth alongside Firebase Auth:
- add Supabase session bootstrap
- keep Firebase login active
- do not switch app boot gating yet
- add feature-flag style transition logic where needed

### Phase 4

Create equivalent Supabase schema:
- `profiles`
- `alarms`
- `clocks`

Recommended relational shape:
- `profiles.id` = auth user UUID
- `alarms.user_id` references `profiles.id`
- `clocks.user_id` references `profiles.id`

### Phase 5

Replace Firestore reads and writes incrementally:
- start with lowest-risk collection first, likely `clocks`
- migrate `alarms` after real-time behavior is mapped
- migrate `profiles` only after auth identity mapping is stable

### Phase 6

Data migration must be handled carefully:
- export existing Firebase user/profile/alarm/clock data
- import to Supabase with integrity checks
- verify row ownership matches authenticated users
- verify no orphaned alarms/clocks

### Phase 7

Only remove Firebase after:
- Supabase Auth fully replaces login, sign-up, reset, and verification behavior
- Firestore reads/writes are fully replaced
- production users can sign in safely
- data parity is confirmed

## Risks to watch closely

High-risk areas:
- email verification behavior
- account deletion flow
- real-time alarm and clock subscriptions
- profile bootstrap on login
- mixed identity state between Firebase UID and Supabase user ID

Medium-risk areas:
- timestamp format differences between Firestore and Supabase
- ordering behavior that currently depends on Firestore indexes
- Vercel env configuration for Supabase auth/session support

Low-risk areas:
- storage migration, unless avatar upload/download is added later

## Conclusion

Phase 2 is complete.

We now have a clear map of:
- where Firebase Auth is used
- which Firestore collections exist
- which user flows are highest risk
- where Supabase can be introduced safely next

No destructive change should happen before Phase 3 is implemented in parallel.
