# GoPlate — 3D Restaurant Menus

A restaurant menu turned into an interactive 3D experience.

**How it works:** a restaurant owner installs the **GoPlate mobile app**, builds their menu, films each dish, and prints one **QR code**. Customers scan it with their phone camera — no app install — and the restaurant's menu opens in the browser with **interactive 3D models / 360° videos** of every dish.

```
food menu/
├── web/      Next.js — customer menu (QR target), landing page, and the whole backend API
└── mobile/   Expo (React Native) — restaurant owner app, publishable to Google Play
```

---

## 1. Run the web app (backend + customer menu)

```bash
cd web
npm install
npx prisma db push        # creates the SQLite dev database
node prisma/seed.mjs      # optional: demo restaurant + demo login
npm run dev
```

Open:
- `http://localhost:3000` — landing page
- `http://localhost:3000/r/demo-bistro` — the seeded demo menu (tap a dish → 3D / 360° stage)

Demo owner login: `demo@goplate.app` / `demo1234`

### Environment (`web/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite in dev. For production use Postgres (Neon/Supabase) — change `provider` in `prisma/schema.prisma` to `postgresql`. |
| `JWT_SECRET` | Sign-in token secret. **Change in production.** |
| `NEXT_PUBLIC_APP_URL` | Public URL embedded in QR codes. Set to your deployed domain. |
| `MESHY_API_KEY` | Optional. Enables real photo → 3D model generation via [Meshy.ai](https://www.meshy.ai). Without it, menus show the interactive 360° video instead. |

## 2. Run the mobile app (restaurant owners)

```bash
cd mobile
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_URL (see below)
npx expo start
```

- **Android emulator**: works out of the box (`10.0.2.2:3000` is the default).
- **Physical phone (Expo Go)**: set `EXPO_PUBLIC_API_URL` in `mobile/.env` to `http://<your computer's LAN IP>:3000` and make sure the phone is on the same Wi-Fi.

**Owner flow in the app:** Create account → New restaurant → add categories → add dishes (photo + 360° video from the camera) → *Generate 3D model* → *QR code* screen → print and display it.

## 3. Menu customization (owner-controlled, from the app)

Restaurant Settings in the mobile app controls how the customer menu looks:

- **Caption** — a tagline shown under the restaurant name.
- **Theme** — Midnight (navy), Espresso (warm dark), or Ivory (light).
- **Dish layout** — List rows or a 2-column photo grid.
- **“From our kitchen” reel** — an autoplaying strip of dish videos at the top of the menu.
- **Accent color** — tints prices, badges, buttons, and the category pills.

## 4. “How it's made” videos with auto-editing

In the dish editor, owners tap **Film / choose video** and record the cooking however they like.
The server auto-edits the clip (bundled ffmpeg — `web/src/lib/video.ts`): first 45 s taken, sped up 3×,
capped at 15 s / 720p / 30 fps, fade-in, audio stripped, faststart for instant phone streaming.
The result plays in the menu's kitchen reel and in the dish viewer under a **How it's made** tab.

## 5. Serving schedules, sold-out, modifiers, AR

- **Serving windows** — each category can have a window (e.g. Lunch 11:00–16:00), set from the app with presets. The menu shows a "Serving now" / "Served 11:00–16:00" pill and dims closed sections. Times use the customer's device clock (they're at the restaurant), including overnight windows like 22:00–02:00.
- **Sold out today ("86")** — one tap on the 86 pill in the app's menu editor. Customers see a SOLD OUT ribbon; the flag auto-expires at midnight.
- **Options & add-ons** — sizes, toppings, spice levels with price deltas, edited per dish in the app. Customers pick them in the dish viewer and watch the price update live.
- **AR** — dishes with 3D models get a "View on your table" button (Android Scene Viewer / iOS Quick Look via USDZ when the 3D provider supplies one).

## 6. Subscription tiers (Stripe)

Free: 1 restaurant, full video menus. Pro: multiple restaurants + 3D model generation.
Limits are enforced server-side (`web/src/lib/plans.ts`); gated endpoints return **402** and the app
shows an Upgrade prompt that opens Stripe Checkout. To enable billing set in `web/.env`:
`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` (Pro monthly price), `STRIPE_WEBHOOK_SECRET`, and point a
Stripe webhook at `/api/billing/webhook` (events: `checkout.session.completed`,
`customer.subscription.deleted`). Without keys, billing endpoints return 503 and everything else
works — free-plan limits still apply.

## 7. The 3D pipeline

- The dish **photo** is sent to a 3D generation provider (Meshy.ai image-to-3D) and the resulting **GLB model** is attached to the dish. The customer menu renders it with `<model-viewer>` (drag to spin, pinch to zoom).
- While a model is processing — or when no `MESHY_API_KEY` is configured — the menu shows the owner's **360° video** loop instead, so the product works fully without the paid service.
- The provider is isolated in `web/src/lib/gen3d.ts`; swapping in Luma AI, Tripo, or your own photogrammetry service only touches that file.

## 8. Deploy the web app

Any Node host works. For Vercel:

1. Move the database to Postgres (e.g. Neon via Vercel Marketplace): change the Prisma `provider` to `postgresql`, set `DATABASE_URL`, run `npx prisma db push`.
2. Swap upload storage from local disk to Vercel Blob or S3 (only `web/src/app/api/upload/route.ts` changes).
3. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL=https://yourdomain.com`, `MESHY_API_KEY`.
4. `vercel deploy --prod` from `web/`.

QR codes automatically point at `NEXT_PUBLIC_APP_URL`, so existing printed codes keep working as long as the domain stays the same.

## 9. Publish the mobile app to Google Play

The app is pre-configured (`com.goplate.app`, dark adaptive icon, camera permissions, EAS profiles).

```bash
npm install -g eas-cli
cd mobile
eas login                 # free Expo account
eas build:configure
# 1) Point the production build at your deployed backend:
#    edit eas.json → build.production.env.EXPO_PUBLIC_API_URL
# 2) Build the Play Store bundle (.aab):
eas build --platform android --profile production
# 3) Create a Google Play Console account ($25 one-time), create the app,
#    then upload the .aab — or submit straight from the CLI:
eas submit --platform android
```

Play Store checklist:
- [ ] Deployed backend URL set in `eas.json` (production profile)
- [ ] App icon/splash replaced with your brand (`mobile/assets/images/`)
- [ ] Privacy policy URL (required by Play Console — the landing page can host it)
- [ ] Store listing: screenshots of the menu editor, QR screen, and a customer menu
- [ ] Internal testing track first, then production rollout

## Tech stack

| Layer | Choice |
|---|---|
| Web + API | Next.js 16 (App Router), Tailwind CSS 4 |
| Database | Prisma 6 — SQLite (dev) / Postgres (prod) |
| Auth | JWT (jose) + bcrypt, Bearer tokens |
| 3D viewer | Google `<model-viewer>` (GLB) |
| 3D generation | Meshy.ai image-to-3D (pluggable) |
| QR codes | `qrcode` (server-generated PNG) |
| Video auto-edit | ffmpeg (`ffmpeg-static`, server-side) |
| Mobile | Expo SDK 57, expo-router, expo-image-picker, SecureStore |
| Store builds | EAS Build (`eas.json` ready) |
