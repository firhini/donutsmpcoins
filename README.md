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
| `ADMIN_SECRET` | empfohlen | langer Zufallswert (z. B. `openssl rand -hex 32`) zum Signieren der Admin-Session |
| `DISCORD_WEBHOOK_URL` | empfohlen | Discord → Servereinstellungen → Integrationen → Webhooks → URL kopieren |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | empfohlen | Discord-Login (siehe Abschnitt 5a) |
| `DISCORD_GUILD_ID` | optional | deine Server-ID – „Nur Server-Mitglieder dürfen drehen“ |
| `DISCORD_BOT_TOKEN` | optional | Bot-Token – Spieler treten beim Login automatisch deinem Server bei (Bot muss auf dem Server sein) |
| `DISCORD_PUBLIC_KEY` | optional | Public Key der App – aktiviert den `/setup`-Bot (siehe 5a) |
| `SESSION_SECRET` | Pflicht bei Discord-Login | langer Zufallswert (≥ 32 Zeichen) für die Login-Cookies – nie das Admin-Passwort wiederverwenden |
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
4. In Netlify die Variablen `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` **und `SESSION_SECRET`** (langer Zufallswert,
   z. B. aus `openssl rand -hex 32` oder einem Passwort-Generator, mindestens 32 Zeichen) setzen, neu deployen.
5. Optional „nur Server-Mitglieder“: In Discord **Entwicklermodus** aktivieren (Einstellungen → Erweitert), Rechtsklick auf
   deinen Server → **Server-ID kopieren** → als `DISCORD_GUILD_ID` setzen und im Admin unter *Spin* den Schalter
   „Require membership“ aktivieren.

Der Button „Login with Discord“ erscheint im Header automatisch, sobald die Variablen gesetzt sind. Im Admin unter *Spin*
steuerst du, ob das Rad einen Login verlangt (Standard: ja, sobald Discord-Login konfiguriert ist).

### Discord-Bot mit `/setup` (kein eigener Server nötig)

Der Bot läuft komplett über Netlify (Discord „Interactions“ per HTTP) – nichts muss dauerhaft laufen.

1. Developer Portal → deine App → **General Information** → **Public Key** kopieren → in Netlify als
   `DISCORD_PUBLIC_KEY` setzen (dazu `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`) → neu deployen.
2. Auf derselben Seite bei **Interactions Endpoint URL** eintragen: `https://deinshop/api/discord/interactions` → Speichern.
3. Admin → *Settings* → **Discord bot** → „Invite bot“ (Administrator-Recht) → danach in Discord unter
   Servereinstellungen → Rollen die Bot-Rolle **ganz nach oben** ziehen.
4. Im selben Admin-Bereich „1. Register /setup command“ klicken.
5. In Discord `/setup` eingeben (oder im Admin „2. Run setup now“). Der Bot legt Rollen, Kategorien, Kanäle und alle
   Panel-Nachrichten an. Erneut ausführen ist sicher: Vorhandenes wird wiederverwendet bzw. aktualisiert. Falls Discord
   „Run /setup again“ meldet, einfach wiederholen, bis ✅ kommt (der Fortschritt wird gespeichert).
6. Deinen Bestell-Webhook in die Kategorie **🔒 STAFF → 🧾・orders** verschieben.

Danach: Ping-Rollen per Button, private Tickets, Guthaben-Abfrage, automatische Restock-Pings (wenn du im Admin den
Bestand erhöhst) und die Rolle *Customer* nach jeder ausgelieferten Bestellung.

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

## 5c. Google SEO – was eingebaut ist und was du noch tun musst

**Eingebaut (automatisch bei jedem Deploy):**
- **Pre-Rendering:** Alle öffentlichen Seiten (Startseite, Shop, 8 Kategorien, 57 Produktseiten, Guides, Landingpages, FAQ,
  Rechtliches) werden beim Build als fertiges HTML erzeugt. Google bekommt Inhalte, Titel und Beschreibungen ohne
  JavaScript. Danach übernimmt React („Hydration“) – die Seite bleibt eine schnelle App.
- **Meta-Tags pro Seite:** Title, Description, Canonical, Open Graph/Twitter, `robots` (private Seiten wie Warenkorb,
  Checkout, Bestellung, Account, Admin sind `noindex`).
- **Strukturierte Daten (JSON-LD):** OnlineStore + WebSite (Startseite), Product + Offer + Breadcrumbs (Produkte),
  CollectionPage (Kategorien), FAQPage (FAQ, Landingpages, Guides, Produkte), Article (Guides/Landingpages),
  AggregateRating (Bewertungsseite, sobald echte Bewertungen existieren).
- **sitemap.xml + robots.txt** werden beim Build generiert (`dist/sitemap.xml`).
- **Echte 404-Seiten** (Status 404 statt „Soft 404“), saubere URLs ohne Parameter, Breadcrumbs, interne Verlinkung.
- **URL-Form:** Die Seiten werden als flache Dateien (`dist/shop/money.html`) erzeugt. Netlify liefert sie unter
  `/shop/money` aus und leitet `/shop/money/` per 301 darauf um – genau die Form, die in Canonical-Tags und Sitemap
  steht. Lass in Netlify unter *Build & deploy → Post processing* die Option **Pretty URLs** eingeschaltet (Standard).
- **Kein Spinner, kein Layout-Sprung:** Der Inhalt steht direkt im HTML (React `prerender`), und beim Laden wird zuerst
  das Modul der aktuellen Seite geholt, bevor React übernimmt – Google und Nutzer sehen sofort die fertige Seite.
- **Performance:** Code-Splitting, CSS der Seite wird direkt im HTML verlinkt, Bilder lazy, Assets ein Jahr gecacht.
- **SEO-Inhalte:** 57 eigene Produkttexte (`src/data/productCopy.ts`), Kategorie-Texte (`src/data/categoryCopy.ts`),
  7 lange Guides unter `/guides` (`src/data/guides.ts`), 5 Keyword-Landingpages (`src/data/landingCopy.ts`, z. B.
  `/donutsmp-elytra`, `/donutsmp-money-prices`) und 39 FAQ-Einträge – alles original, mit echten Preisen aus dem Katalog.
  Achtung: Preise in diesen Texten sind fest eingetragen. Änderst du Preise im Admin oder in `catalog.ts`, passe die
  betroffenen Sätze dort an (die Tests `tests/productCopy.test.ts` prüfen, dass der Preis im Seitentitel stimmt).
- Prüfung: `npm run build && npm run seo:check` validiert jede generierte Seite (Title, Description, Canonical, JSON-LD, H1).

**Das musst du einmalig machen:**
1. **Domain:** Eine eigene Domain (z. B. `donutcoins.gg`) rankt deutlich besser als `*.netlify.app`. In Netlify unter
   *Domain management* verbinden, danach `SITE_URL=https://deine-domain` als Umgebungsvariable setzen (sonst nimmt der
   Build automatisch die Netlify-URL).
2. **Google Search Console:** https://search.google.com/search-console → Property anlegen → Methode „HTML-Tag“ → den
   `content`-Wert als `GOOGLE_SITE_VERIFICATION` in Netlify setzen → neu deployen → verifizieren. Dann unter *Sitemaps*
   `https://deine-domain/sitemap.xml` einreichen.
3. **Google Analytics (optional):** GA4-Property anlegen, Mess-ID (`G-XXXXXXX`) als `GA_MEASUREMENT_ID` setzen. Die Seite
   zeigt einen kleinen Cookie-Hinweis und lädt Analytics erst nach „Accept“ (DSGVO).
4. **Bing Webmaster Tools** (gratis, importiert aus der Search Console) – bringt zusätzlich Bing/DuckDuckGo-Traffic.
5. **Backlinks & Inhalte:** Discord-Server-Beschreibung, YouTube-Shorts/TikTok mit Link, Minecraft-Foren und
   Serverlisten verlinken. Die Guides unter `/guides` sind dafür gemacht, geteilt zu werden. Neue Guides: einfach einen
   Eintrag in `src/data/guides.ts` ergänzen – Seite, Sitemap und strukturierte Daten entstehen automatisch.
6. **Bewertungen sammeln:** Echte Bewertungen erzeugen Sterne-Snippets in Google. Nach jeder Lieferung auf die
   Bewertungsfunktion hinweisen (der Bestellstatus macht das automatisch).

Wichtig: Die Seite muss die **Google-Richtlinien** einhalten – keine gekauften Bewertungen, keine Keyword-Massen, keine
irreführenden Preise. Alles Eingebaute hält sich daran.

## 5d. Rechtliches: Impressum, Datenschutz, Preise, Widerruf

Die Seite bringt alle Texte mit, aber ein paar Angaben kann nur der Betreiber machen – **ohne sie ist der Shop in
Deutschland/der EU nicht rechtssicher**:

1. **Impressum (Pflicht, § 5 DDG):** `/admin` → *Settings* → **Legal notice & prices** – Name, Anschrift, E-Mail
   (optional Telefon, USt-IdNr./Kleinunternehmer-Hinweis, weitere Pflichtangaben). Erscheint unter `/imprint`, im Footer
   und als „Controller“ in der Datenschutzerklärung. Bis du es ausfüllst, zeigt die Seite einen Hinweis statt erfundener Daten.
2. **Preisangabe (PAngV):** Der *Price note*-Text („All prices are final prices …“) steht unter jeder Bestellsumme und im
   Footer. Bist du Kleinunternehmer, ergänze z. B. „No VAT is charged (§ 19 UStG)“; führst du Umsatzsteuer ab, „incl. VAT“.
3. **Widerrufsrecht bei digitalen Inhalten:** Die Checkbox im Checkout enthält die ausdrückliche Zustimmung zum sofortigen
   Lieferbeginn und den Hinweis auf das Erlöschen des Widerrufsrechts (§ 356 Abs. 5 BGB). Der Server speichert die
   Bestellung nur mit gesetzter Zustimmung; AGB (§ 2) und Refund Policy erklären es.
4. **Datenschutz:** `/privacy` beschreibt Bestelldaten, Discord-Login (Cookies `dc_session`, `dc_oauth_state`), lokale
   Speicherung und – nur wenn `GA_MEASUREMENT_ID` gesetzt ist – Google Analytics mit Consent-Banner (Accept / No thanks).
5. **Steuern & Gewerbe:** Regelmäßige Verkäufe sind in Deutschland in der Regel gewerblich (Gewerbeanmeldung,
   Einkommensteuer, ggf. Umsatzsteuer). Das kann die Seite nicht für dich lösen – kläre es mit dem Finanzamt oder einem
   Steuerberater, bevor du Umsatz machst.

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
- Admin-Login ist rate-limited; Session-Token laufen nach 7 Tagen ab und werden beim Ändern von `ADMIN_PASSWORD`
  sofort ungültig. Signatur-Schlüssel werden nie direkt aus dem Passwort gebildet (scrypt); für den Discord-Login
  gehört ein eigenes `SESSION_SECRET` gesetzt.
- **Unbezahlte Bestellungen laufen nach 24 h ab** (stündliche Netlify-Funktion `expire-orders` + Prüfung bei jeder
  neuen Bestellung): reservierter Bestand, Gutschein-Nutzung und Guthaben kommen automatisch zurück. Bestellungen, bei
  denen der Kunde eine Zahlung gemeldet hat, bleiben für dich zur Prüfung offen.
- **Mystery-Box-Ergebnisse** werden zwar beim Bestellen ausgelost, auf der öffentlichen Bestellseite aber erst nach
  Zahlungseingang angezeigt – sonst könnte man „bestellen, gucken, stornieren“ so lange wiederholen, bis der Wurf passt.
- **Guthaben** kann, sobald Discord-Login konfiguriert ist, nur noch der Spieler ausgeben, der den Minecraft-Namen in
  seinem Account hinterlegt hat (vorher könnte jeder unter fremdem Namen fremdes Guthaben verbrauchen).
- **PayPal Checkout:** Es wird nur die PayPal-Bestellung akzeptiert, die der Server selbst für genau diese Bestellung
  angelegt hat, und jede Capture-ID kann nur einmal eine Bestellung bezahlen.
- Der Shop ist nicht mit DonutSMP, Mojang oder Microsoft verbunden. DonutSMP verbietet laut eigenen Regeln Real-Money-Trading –
  das Risiko trägt der Spieler; das steht so auch in den AGB-/FAQ-Texten der Seite.
- Bei manuellen Zahlungsarten gibt es für dich **keinen Käuferschutz** in beide Richtungen – bestätige erst nach
  tatsächlichem Zahlungseingang.

---

## 9. Checkliste nach dem ersten Deploy

1. `/admin` → Einstellungen → **Store**: Discord-Invite, Server-IP, Support-E-Mail. **Legal notice & prices**: Impressum
   (Name, Anschrift, E-Mail) und Preis-Hinweis ausfüllen – siehe Abschnitt 5d.
2. **Zahlungsarten**: PayPal-Handle / Wallet-Adressen eintragen, Platzhalter-Methoden deaktivieren, die du nicht nutzt.
3. **Ankündigungsleiste** anpassen (z. B. „Glücksrad – jeden Tag Gratis-Coins“).
4. Testbestellung machen (eigener Minecraft-Name, 1M Money) → Discord-Ping prüfen → im Admin auf *Paid* und *Delivered* setzen.
5. Einmal das Glücksrad drehen und prüfen, dass der Gutschein im Checkout funktioniert.
6. Optional: `SITE_URL` in Netlify auf deine echte Domain setzen (wird für Links in Discord, Zahlungs-Redirects und das Vorschaubild benutzt).
7. **Nach Änderungen an Preisen, Produkten, Store-Name oder Discord-Invite im Admin einmal neu deployen** (Netlify →
   *Deploys* → *Trigger deploy*): Der Build holt sich beim Vorrendern die Live-Einstellungen und den Live-Katalog von
   deiner Seite (`/api/config`, `/api/catalog`), damit Google exakt das sieht, was Kunden sehen. Bis dahin zeigt das
   statische HTML den alten Stand und der Browser aktualisiert ihn nach dem Laden.

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
