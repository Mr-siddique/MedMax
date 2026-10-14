# MedMax – notes

Android-only React Native app (0.87, New Architecture, TypeScript strict). Home with search, a cart with coupons and a bill, mock place-order. This file covers what I assumed, why I built it the way I did, and what I'd change with more time.

How to run: `npm install`, then `npx react-native start` and `npx react-native run-android`. Checks: `npx tsc --noEmit`, `npx eslint .`, `npx jest`. The debug APK has the JS bundle baked in, so it runs without Metro.

## 1. Assumptions

The brief left some things open. These are the calls I made, in roughly the order they matter.

**Money**
- The ₹499 delivery threshold is checked against the item total *before* any discount. 499 is free delivery, 498 pays ₹40.
- Coupon minimums are also checked against the item total before discount.
- SAVE10 is 10% rounded down, capped at ₹100. FLAT50 and FIRST100 are flat amounts. FREEDEL discounts nothing but waives the delivery fee.
- A discount can never exceed the item total, and money coupons don't touch the delivery fee.
- An empty cart bills ₹0 everywhere (no delivery fee) and drops any applied coupon.
- FREEDEL stays applied even when delivery is already free. It just shows ₹0 saved. I didn't think it was worth removing a coupon the user chose on purpose.

**Coupons**
- One coupon at a time. Applying a second replaces the first.
- FIRST100 is "once per user", and with no backend that can only mean once per device. It's marked used when the order is placed, not when it's applied, so abandoning a cart doesn't burn it.
- If the cart changes and the coupon stops qualifying, it's removed and a toast says why.

**Search and cart**
- Search is a case-insensitive substring match on name and salt, debounced by 300 ms.
- There's no backend, so I added about 400 ms of fake latency in `searchApi.ts`. That's the only reason the loading state is visible. It's easy to delete.
- A search goes into "Recent" (max 5, newest first, no duplicates) when the user submits it or adds a result to the cart, not on every keystroke.
- With an empty search box the Home screen lists the whole catalog, so there's something to add before typing anything.
- Minus at quantity 1 removes the item. Plus is disabled at the item's max quantity and says so, rather than silently doing nothing.
- The cart stores only `{id, qty}`. Price, max quantity and the Rx flag are looked up from the catalog each time, so a catalog change can't leave stale prices on disk.

**Things I added that the brief didn't ask for**
- A delivery address (name, 10-digit mobile, street, 6-digit pincode). You can't deliver an order without one, so Place order stays disabled until one is saved. One address only, no address book.
- Coupons and the address form live *on the Cart screen*, not on separate screens. I started with separate screens and they were too easy to miss, so I moved them inline. The address form is collapsed until you tap it.
- An onboarding screen that explains the two permissions before the system dialogs show up, an order-confirmed screen, a cart badge on the tab, a sticky Place order bar, and an "add ₹X more for free delivery" hint in the bill.
- Rx items get a note saying the prescription is checked at delivery. There's no upload.

**Permissions**
- Notifications on Android below 13 need no runtime permission, so I treat them as granted. I tested on Android 13+ (an API 36 emulator).
- There is no "skip" on onboarding because the brief says to ask on first launch. If a permission is still denied on a later launch, the app asks again once at startup. If Android has blocked it ("don't ask again"), the Home screen shows an "Open Settings" card instead, and status is re-read whenever the app comes back to the foreground.
- Light theme and portrait only.

**The catalog**
- I didn't have the original `catalog.json`, so `src/data/catalog.json` is a mock. The first 15 items I typed in from the brief's table; the other 15 I made up to give search and the coupon thresholds more to work with. The file has the shape `{id, name, salt, price, maxQty, rx}` and a loader that validates it at startup, so the real file can be dropped in as long as it keeps that shape. A couple of search tests count results ("paracetamol" matches 6) and would need updating.

## 2. Design decisions and trade-offs

**Business rules are plain functions with no React in them.** `src/domain` holds the cart operations, search filter, bill and coupon rules, and none of it imports React or a store. That's what made the edge cases cheap to test (there are 250 tests, most of them on this layer) and it's the part most likely to change.

**Coupons are a list of small rule objects.** Each rule has a code, a `check` (eligible or not, with a reason shown to the user) and an `effect` (discount and whether delivery is waived). One file under `domain/coupons/rules/` per coupon, registered in one array. `computeBill` never mentions a specific coupon, so adding a new one means adding a file and one line to the registry, and the cart, list and error messages pick it up. The one-time-use behaviour is a flag on the rule that the engine enforces, rather than something each coupon implements.

**The bill is derived, not stored.** Nothing stores totals. `computeBill` runs from lines + coupon code + used coupons. If the coupon is no longer valid it computes the bill without it and returns the reason. The cart store looks at that reason to remove the coupon and show the toast, so there's one place that decides validity.

**State is zustand, one small store per concern** (cart, search, address, permissions, toast). I picked it over Redux because there's very little shared state and the stores are easy to test without rendering anything. The trade-off I accepted: the cart store calls the toast store directly, which is a store-to-store dependency. It's the simplest way to say "your coupon was removed" from where the decision is made.

**Persistence is AsyncStorage through zustand's `persist`, versioned and defensive.** Every persisted store runs what it reads through a sanitizer, and the storage wrapper never throws. I found out by reading the zustand source that a storage that throws leaves the store "not hydrated" forever, which would mean a splash screen that never ends. Corrupt data now falls back to defaults. The app shows a splash until every store has loaded, so the first screen is never wrong for a frame.

**Permissions: the OS result is never persisted, only a "blocked" hint.** On Android, `check()` can't tell "never asked" from "don't ask again". Only `request()` reveals the blocked state. So I remember a blocked result and treat a later denied check as still blocked, and a granted check clears it. Live status is re-read on launch and on return to foreground.

**Search ignores stale responses.** Each request has an id and only the latest one is allowed to update the screen, so a slow "par" can't overwrite a fast "paracetamol".

**Styling** is a small token file (`ui/theme.ts`) plus a handful of shared components (Button, Stepper, TextField, Card and so on). Rupee formatting is hand-written instead of `Intl`, because I didn't want to depend on Hermes Intl support on Android.

**Accessibility:** every pressable has a role and a label, touch targets are at least 48dp, errors and toasts are announced, and I made sure no two buttons on one screen share an identical label. The keyboard is handled on both screens (see below).

**Keyboard:** edge-to-edge is on, which means Android doesn't resize the window for the keyboard, so I lift the lists with `KeyboardAvoidingView`. Dragging dismisses the keyboard, the Place order bar hides while you type, and the address fields move to the next one on the keyboard's Next key.

## 3. What I'd do differently with more time

- Replace the mock catalog with the real one and add a script that checks it on CI.
- Real search and real "once per user" for FIRST100. Both need a backend, and today both are simulated or per-device.
- Multiple addresses, plus using the device location to fill the pincode. Right now location is only shown as "Delivering to".
- Dark mode, tablet/landscape layouts, and localisation.
- UI tests on a real device (Detox or Maestro). My component tests run in Jest, so things like animation smoothness and the keyboard behaviour were checked by hand, not by a test.
- Prescription upload for Rx items, which is currently just a note.
- Error reporting. Failures are handled quietly (a retry button, a kept previous state) but nothing is logged anywhere.

## Known limits

- I don't have a physical Android phone, so I couldn't test on a real device. Everything was run on an Android emulator (API 36) and in Jest. Things that can differ on hardware are the real GPS fix, the permission dialogs on a vendor-skinned Android, keyboard feel and animation smoothness.
- Search latency is simulated, and "once per user" is once per device.
- Android only, light theme only, one saved address.
- If someone sets a permission to "Ask every time" in system Settings *after* blocking it, the app may still say "blocked" until they grant it, because Android gives no way to read that state without asking.
- The Metro "can't connect" red box you can get in a dev build after backgrounding the app doesn't happen in the APK.
