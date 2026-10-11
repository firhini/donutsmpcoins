# DonutCoins – DonutSMP Shop (Money, Spawner, Mystery Boxes & Items)

Ein kompletter Web-Shop für DonutSMP-Ingame-Währung und Items – inspiriert von donut.market, aber mit eigenem Design,
eigenen Bildern, Glücksrad, Gutscheinen, Referral-System, Giveaways, Mystery Boxes und einem Admin-Bereich,
in dem du Bestellungen abarbeitest. Gebaut für **Netlify** (kostenloser Plan reicht) + **GitHub**.

> Du lieferst manuell in-game aus (kein Bot nötig). Die Seite nimmt Bestellungen an, zeigt dem Kunden deine
> Zahlungsdaten (PayPal, Krypto, …), der Kunde meldet die Zahlung, du bekommst eine Discord-Nachricht, bestätigst
> im Admin-Bereich und lieferst aus. Der Kunde sieht den Status live auf seiner Bestellseite.

---

## 1. Features

**Shop**
- 50+ Produkte in 8 Kategorien (Money-Pakete, Spawner, Mystery Boxes, Investments, Rüstung, Tools, Bundles, Bases)
- Mengenrabatte (z. B. 1M Money ab 1000M günstiger), Streichpreise, Tags (Hot, New, Popular …)
- Minecraft-Hotbar als Kategorie-Navigation, Suche, Sortierung, Produktseiten mit SEO-Texten
- Money-Rechner (Millionen wählen → Preis & Rate pro 1M live)
- Mystery Boxes mit Inhalt, Drop-Chancen und **serverseitigem Auslosen** – der Kunde sieht nach Bezahlung eine
  Öffnungs-Animation, du siehst im Admin genau, was du ausliefern musst
- Mehrere Währungen (USD, EUR, GBP, …) – Preise werden umgerechnet angezeigt, bezahlt wird in USD-Gegenwert
- Ausgabe-Stufen-Rabatt (z. B. ab 15 $ → 5 %, ab 40 $ → 8 %, ab 100 $ → 12 %), Sale-Banner, Ankündigungsleiste

**Kostenlos-Features (Kundenbindung)**
- 🎡 **Daily Spin** – 1× pro 24 h drehen: Gutscheine (5–25 %), 1M/5M/20M Coins, Skelett-Spawner, …
  (Server entscheidet das Ergebnis, Cooldown per IP + Gerät, max. 1 Gratis-Item pro Minecraft-Name pro Woche)
- Willkommens-Gutschein, Gutschein-Codes (Prozent/Fix, Mindestbestellwert, Nutzungen, Ablauf, an Spieler gebunden)
- **Referral**: Freund bekommt 5 % Rabatt, du bekommst 5 % des Bestellwerts als Store-Guthaben
- Geschenk-Codes (Admin erstellt z. B. `GIFT-…` → Kunde löst gegen ein Gratis-Item ein)
- Giveaways mit Teilnahme per Minecraft-Name und Zufallsziehung
- Bewertungen mit Belohnung (nach Freigabe bekommt der Kunde einen Rabattcode)

**Discord-Login & Accounts**
- Spieler melden sich mit Discord an (OAuth2, kein Passwort). Das Glücksrad kann so eingestellt werden, dass nur
  eingeloggte Spieler drehen dürfen – optional nur Mitglieder deines Discord-Servers („Join to spin“).
- Account-Seite `/account`: Minecraft-Name speichern, eigene Bestellungen, Store-Guthaben, gewonnene Preise/Codes.
- Cooldown gilt dann **pro Discord-Account** (zusätzlich zu IP und Gerät) – Mehrfach-Drehen ist praktisch unmöglich.

**Bestellen & Bezahlen**
- Checkout mit Live-Prüfung des Minecraft-Namens (Mojang API) + Skin-Vorschau
- Zahlungsarten frei konfigurierbar im Admin:
  - **Manuell** (keine Verifizierung nötig): PayPal (paypal.me-Link, Friends & Family), Litecoin/Bitcoin/USDT-Adresse,
    Revolut, Gutscheinkarten (Amazon/Paysafecard) … – Kunde zahlt, trägt Transaktions-ID ein, du bestätigst
  - **Automatisch** (optional, braucht Account/Keys): Stripe (Karte, Apple Pay, Google Pay), PayPal Checkout,
    NOWPayments (Krypto mit automatischer Bestätigung)
- Bestellstatus-Seite `/order/DC-XXXXXX` mit Zahlungsanleitung, „Ich habe bezahlt“-Formular, Status-Timeline, Box-Reveal
- Discord-Webhook: neue Bestellung, Zahlung gemeldet, Zahlung bestätigt, Gewinne, Giveaway-Ziehungen

**Admin (`/admin`)**
- Dashboard, Bestellungen (Status setzen: Bezahlt → Wird geliefert → Geliefert, Notizen, `/pay`-Befehl kopieren)
- Produkte (Preise, Lagerbestand, verstecken, eigene Produkte anlegen), Gutscheine, Geschenk-Codes
- Bewertungen freigeben, Giveaways anlegen/ziehen, Store-Guthaben verwalten, CSV-Export
- Einstellungen: Zahlungsarten, Glücksrad-Preise & Gewichte, Rabattstufen, Währungen, Texte, Wartungsmodus

---

## 2. Technik

- Frontend: Vite + React 19 + TypeScript, eigenes CSS-Designsystem (dunkel, Gold/Pink)
- Backend: **Netlify Functions** (`netlify/functions/api.ts` → `/api/*`), Speicher: **Netlify Blobs** (kein extra Dienst nötig)
- Lokal ohne Netlify-CLI: `npm run dev:vite` (API läuft mit, Daten landen in `.data/`)
- Tests: `npm test` (Vitest), Typen: `npm run typecheck`, Build: `npm run build`

```
src/            React-App (pages, components, context, styles)
src/shared/     Typen + Preislogik (Frontend & Backend)
src/data/       Standard-Katalog & Standard-Einstellungen
netlify/api/    API-Routen (catalog, orders, payments, promo, social, admin)
netlify/lib/    Speicher, Auth, Bestellungen, Gutscheine, Discord …
public/img/     Alle Grafiken (SVG, generiert über scripts/gen-art.mjs)
docs/           ARCHITECTURE.md (API-Vertrag), ART.md
```

---

## 3. Lokal starten

```bash
npm install
cp .env.example .env     # ADMIN_PASSWORD setzen!
npm run dev:vite         # http://localhost:5173  (API inklusive, Daten in .data/)
# oder mit Netlify-CLI (echte Blobs-Sandbox, lädt die CLI beim ersten Mal per npx):
npm run dev              # http://localhost:8888
```

Admin: `http://localhost:5173/admin` → Passwort aus `.env`.

---

## 4. Auf Netlify veröffentlichen (Schritt für Schritt)

1. Repo auf GitHub pushen (ist dieses Repo).
2. Auf https://app.netlify.com → **Add new site → Import an existing project → GitHub** → Repo auswählen.
3. Build-Einstellungen werden aus `netlify.toml` gelesen (Build: `npm run build`, Publish: `dist`, Functions: `netlify/functions`).
4. **Site configuration → Environment variables** → mindestens setzen:

| Variable | Pflicht | Beschreibung |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ | Passwort für `/admin` |
| `ADMIN_SECRET` | optional | separater Schlüssel zum Signieren der Admin-Session (sonst wird aus dem Passwort abgeleitet) |
| `DISCORD_WEBHOOK_URL` | empfohlen | Discord → Servereinstellungen → Integrationen → Webhooks → URL kopieren |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | empfohlen | Discord-Login (siehe Abschnitt 5a) |
| `DISCORD_GUILD_ID` | optional | deine Server-ID – „Nur Server-Mitglieder dürfen drehen“ |
| `SESSION_SECRET` | optional | Schlüssel für Login-Cookies (sonst aus `ADMIN_SECRET`/`ADMIN_PASSWORD` abgeleitet) |
| `SITE_URL` | empfohlen | z. B. `https://deinshop.netlify.app` (für Zahlungs-Redirects & Links in Discord) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | optional | nur für Karten-/Apple-Pay-Zahlung über Stripe |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` | optional | nur für PayPal Checkout (automatische Bestätigung) |
| `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` | optional | nur für automatische Krypto-Zahlungen |

5. **Deploy**. Netlify Blobs ist automatisch aktiv (Functions-Laufzeit), es muss nichts extra gebucht werden.
6. `https://deinshop.netlify.app/admin` öffnen → einloggen → **Einstellungen**:
   - Discord-Invite, Shop-Name, Server-IP eintragen
   - **Zahlungsarten**: bei PayPal deinen paypal.me-Namen als *Handle* eintragen, bei Litecoin/BTC/USDT deine
     Wallet-Adresse, nicht genutzte Methoden deaktivieren
   - Glücksrad-Preise/Gewichte, Rabattstufen, Texte nach Wunsch anpassen
7. Eigene Domain: Netlify → Domain management → Domain hinzufügen (optional).

> **Wichtig:** Alle Daten (Bestellungen, Gutscheine, Einstellungen) liegen in Netlify Blobs des jeweiligen Sites.
> Der kostenlose Netlify-Plan reicht für einen kleinen Shop locker (125k Function-Aufrufe/Monat).

---

## 5. So bekommst du dein Geld (Zahlungsarten im Detail)

Alles ist im Admin unter *Einstellungen → Zahlungsarten* einstellbar. Platzhalter in den Anleitungstexten:
`{{orderId}}` Bestellnummer, `{{total}}` Betrag, `{{username}}` Minecraft-Name, `{{handle}}` dein Handle/deine Adresse.

### Ohne Verifizierung / sofort nutzbar (manuell)
| Methode | Was du einträgst | Ablauf |
|---|---|---|
| **PayPal (paypal.me)** | dein paypal.me-Name als *Handle* | Kunde klickt „Open PayPal“ (Link mit Betrag), zahlt (am besten Friends & Family), trägt Transaktions-ID/E-Mail ein → du bestätigst |
| **Litecoin / Bitcoin / USDT** | Wallet-Adresse als *Handle* | Kunde sendet Gegenwert, trägt TX-Hash ein → du prüfst im Explorer, bestätigst |
| **Revolut** | dein revolut.me-Tag | Kunde zahlt mit Bestellnummer als Notiz |
| **Gutscheinkarten** | – | Kunde öffnet Ticket in Discord mit Code (10 % Aufschlag voreingestellt) |
| **Eigene Methode** | beliebig (Wise, Bank, Skrill, …) | „Zahlungsart hinzufügen“ → Typ *manual* |

Bei manuellen Methoden gilt: Bestellung steht auf *Awaiting payment* → Kunde meldet Zahlung → Status *pending review*
→ du klickst im Admin auf **Mark as paid** → lieferst aus → **Mark delivered**.

### Automatisch (optional)
- **Stripe** (Karte/Apple Pay/Google Pay): Stripe-Account nötig (Identitätsprüfung durch Stripe). Keys in Netlify setzen,
  Webhook `https://deinshop.netlify.app/api/payments/stripe/webhook` auf `checkout.session.completed` anlegen.
  Dann im Admin die Methode „Card / Apple Pay / Google Pay“ aktivieren.
- **PayPal Checkout**: PayPal-Business-App (developer.paypal.com) → Client-ID/Secret setzen → Methode aktivieren.
- **NOWPayments** (Krypto, automatische Bestätigung, geringe Hürden): API-Key + IPN-Secret setzen,
  IPN-URL `https://deinshop.netlify.app/api/payments/nowpayments/ipn`.

---

## 5a. Discord-Login einrichten (5 Minuten)

1. https://discord.com/developers/applications → **New Application** (z. B. „DonutCoins“).
2. Links **OAuth2** → **Client ID** kopieren, **Reset Secret** → **Client Secret** kopieren.
3. Unter **Redirects** eintragen: `https://deinshop.netlify.app/api/auth/discord/callback`
   (für lokales Testen zusätzlich `http://localhost:5173/api/auth/discord/callback`).
4. In Netlify die Variablen `DISCORD_CLIENT_ID` und `DISCORD_CLIENT_SECRET` setzen, neu deployen.
5. Optional „nur Server-Mitglieder“: In Discord **Entwicklermodus** aktivieren (Einstellungen → Erweitert), Rechtsklick auf
   deinen Server → **Server-ID kopieren** → als `DISCORD_GUILD_ID` setzen und im Admin unter *Spin* den Schalter
   „Require membership“ aktivieren.

Der Button „Login with Discord“ erscheint im Header automatisch, sobald die Variablen gesetzt sind. Im Admin unter *Spin*
steuerst du, ob das Rad einen Login verlangt (Standard: ja, sobald Discord-Login konfiguriert ist).

## 5b. Welches Zahlungssystem? (Empfehlung)

Kein einzelner Anbieter liefert Kreditkarte, Apple Pay **und** Krypto ohne Verifizierung. Die praktikable Kombination:

| Wunsch | Anbieter | Verifizierung | Status im Shop |
|---|---|---|---|
| Kreditkarte, Apple Pay, Google Pay, Klarna, Link | **Stripe** | Ausweis + IBAN, Angaben zum Geschäft (als Privatperson/Einzelunternehmer möglich, 18+) | fertig eingebaut – nur Keys eintragen |
| PayPal + Karte über PayPal | **PayPal Checkout** (Business-Konto) | Ausweis, Bankkonto | fertig eingebaut |
| Krypto (BTC, ETH, LTC, USDT, 100+) mit automatischer Bestätigung | **NOWPayments** | nur E-Mail + Auszahlungs-Wallet | fertig eingebaut |
| Alles manuell ohne jede Prüfung | PayPal.me / Wallet-Adressen / Revolut | keine | fertig, Standard |

**Stripe aktivieren:** Stripe-Konto anlegen → Dashboard → *Entwickler → API-Schlüssel* → `sk_live_…` als `STRIPE_SECRET_KEY`.
Dann *Entwickler → Webhooks → Endpunkt hinzufügen*: `https://deinshop.netlify.app/api/payments/stripe/webhook`,
Ereignis `checkout.session.completed`, den Signing-Secret als `STRIPE_WEBHOOK_SECRET`. Apple Pay und Google Pay sind auf
der Stripe-Checkout-Seite automatisch aktiv; weitere Methoden (Klarna, SEPA, iDEAL, …) schaltest du im Stripe-Dashboard unter
*Zahlungsmethoden* frei – der Shop übergibt keine feste Liste. Zuletzt im Admin die Methode „Card / Apple Pay / Google Pay“ einschalten.

**NOWPayments aktivieren:** Konto auf nowpayments.io → Auszahlungs-Wallet hinterlegen → *Store settings → API keys* →
`NOWPAYMENTS_API_KEY`; *IPN secret* generieren → `NOWPAYMENTS_IPN_SECRET`. IPN-URL ist
`https://deinshop.netlify.app/api/payments/nowpayments/ipn`. Im Admin „Crypto (automatic)“ einschalten.

Hinweis: Stripe und PayPal prüfen Händler nachträglich und können Konten mit vielen Rückbuchungen (Chargebacks) oder bei
Verstößen gegen ihre Richtlinien sperren. Halte Lieferbelege (Screenshots) bereit und liefere schnell.

## 6. Ablauf einer Bestellung (für dich)

1. Discord-Ping „🛒 New order DC-ABC123“ (Spieler, Items, Betrag, Zahlungsart).
2. Kunde zahlt und meldet die Zahlung → Discord-Ping „💳 Payment reported“ mit Referenz.
3. Admin → Bestellung öffnen → Zahlung prüfen → **Mark as paid** (Kunde sieht sofort „Paid“, Mystery-Box-Ergebnis wird
   dem Kunden angezeigt, Referral-Guthaben wird gutgeschrieben).
4. In-game liefern: Money per `/pay <Name> <Betrag>` (im Admin kopierbar), Items per Teleport/Trade. Bei Boxen steht im
   Admin genau, welche Items gewürfelt wurden.
5. **Mark delivered** → Kunde bekommt die Aufforderung, eine Bewertung zu schreiben (Belohnung: Rabattcode nach Freigabe).

Gratis-Gewinne vom Glücksrad (z. B. „1M Coins“) erscheinen als Bestellung mit Status *Paid* (Zahlungsart *Free*) –
einfach ausliefern und auf *Delivered* setzen.

---

## 7. Preise & Produkte anpassen

- Schnell: Admin → Produkte (Preis, Streichpreis, Lager, Tags, verstecken, eigene Produkte).
- Dauerhaft im Code: `src/data/catalog.ts` (Preise in Cent). Admin-Änderungen überlagern die Code-Werte.
- Bilder: `node scripts/gen-art.mjs` generiert alle SVGs neu (siehe `docs/ART.md`). Eigene Bilder einfach nach
  `public/img/products/` legen und im Produkt den Pfad eintragen.

---

## 8. Sicherheit & Hinweise

- Preise werden **immer serverseitig** berechnet – der Browser kann keine Preise manipulieren.
- Guthaben, Gutscheine, Geschenk-Codes, Lagerbestand, Glücksrad-Cooldowns und Rate-Limits werden **atomar** gespeichert
  (Netlify-Blobs-ETags) – parallele Anfragen können nichts doppelt einlösen.
- Stornierte/erstattete Bestellungen geben Guthaben, Lagerbestand, Gutschein und Referral-Bonus automatisch zurück;
  beim Wiedereröffnen wird alles erneut abgezogen.
- Deploy-Previews und Branch-Deploys benutzen einen eigenen Datenspeicher und können Live-Daten nicht verändern.
- Glücksrad-Ergebnis, Box-Inhalte und Gutscheine werden serverseitig ausgelost/geprüft, Cooldowns laufen über IP + Gerät.
- Admin-Login ist rate-limited; Session-Token laufen nach 7 Tagen ab.
- Der Shop ist nicht mit DonutSMP, Mojang oder Microsoft verbunden. DonutSMP verbietet laut eigenen Regeln Real-Money-Trading –
  das Risiko trägt der Spieler; das steht so auch in den AGB-/FAQ-Texten der Seite.
- Bei manuellen Zahlungsarten gibt es für dich **keinen Käuferschutz** in beide Richtungen – bestätige erst nach
  tatsächlichem Zahlungseingang.

---

## 9. Checkliste nach dem ersten Deploy

1. `/admin` → Einstellungen → **Store**: Discord-Invite, Server-IP, Support-E-Mail.
2. **Zahlungsarten**: PayPal-Handle / Wallet-Adressen eintragen, Platzhalter-Methoden deaktivieren, die du nicht nutzt.
3. **Ankündigungsleiste** anpassen (z. B. „Glücksrad – jeden Tag Gratis-Coins“).
4. Testbestellung machen (eigener Minecraft-Name, 1M Money) → Discord-Ping prüfen → im Admin auf *Paid* und *Delivered* setzen.
5. Einmal das Glücksrad drehen und prüfen, dass der Gutschein im Checkout funktioniert.
6. Optional: `SITE_URL` in Netlify auf deine echte Domain setzen (wird für Links in Discord, Zahlungs-Redirects und das Vorschaubild benutzt).

## 10. Troubleshooting

| Problem | Lösung |
|---|---|
| `/admin` sagt „Admin is not configured“ | `ADMIN_PASSWORD` in Netlify setzen und neu deployen |
| Keine Discord-Nachrichten | `DISCORD_WEBHOOK_URL` prüfen (Webhook muss im richtigen Kanal angelegt sein) |
| Bestellungen verschwinden nach Redeploy | Nur lokal (`.data/`). Auf Netlify liegen Daten dauerhaft in Blobs |
| Minecraft-Name wird nicht bestätigt | Mojang-API kurz nicht erreichbar – Bestellung geht trotzdem („unverified“) |
| Stripe-Methode erscheint nicht im Checkout | Methode im Admin aktiviert **und** `STRIPE_SECRET_KEY` gesetzt? Beides nötig |
| Glücksrad sagt „Try again tomorrow“ obwohl neu | Cooldown läuft pro IP **und** Gerät (24 h) – im Admin unter *Spin* änderbar |

Tests: `npm test` · API-Smoke-Test gegen einen laufenden Dev-Server: `BASE=http://localhost:5173 ADMIN_PASSWORD=… node scripts/smoke-api.mjs` · Screenshots aller Seiten: `node scripts/screenshot-all.mjs`.
