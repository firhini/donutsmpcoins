# Deploy & Zahlungen – Schritt für Schritt

Diese Anleitung führt vom GitHub-Repo bis zum laufenden Shop mit echten Zahlungen. Reihenfolge einhalten, jeder Schritt
baut auf dem vorherigen auf. Rechne mit 45–60 Minuten für Teil A–C; Stripe/PayPal/NOWPayments (Teil D) kommen dazu, sobald die
Konten freigeschaltet sind.

Begriffe: **Netlify** = Hosting. **Umgebungsvariable** = ein geheimer Wert, den du in Netlify einträgst (nie in den Code).
**Admin** = `https://deine-adresse/admin`, dein Backoffice.

---

## A. Vorbereitung (5 Minuten)

1. Du brauchst: einen GitHub-Account (hat das Repo `firhini/donutsmpcoins`), eine E-Mail-Adresse, ein Discord-Konto mit
   eigenem Server, ein PayPal-Konto (privat reicht für PayPal.me).
2. Erzeuge **drei lange Zufallswerte** (je 40+ Zeichen, Buchstaben + Zahlen) und bewahre sie in einem Passwort-Manager auf:
   - `ADMIN_PASSWORD` – damit loggst du dich im Admin ein (darf auch ein normales starkes Passwort sein)
   - `ADMIN_SECRET` – signiert deine Admin-Sitzung
   - `SESSION_SECRET` – signiert die Login-Cookies der Kunden (Discord-Login)
   Mac/Linux-Terminal: `openssl rand -hex 32` (dreimal ausführen). Windows: PowerShell `[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')`
   oder ein beliebiger Passwort-Generator.
3. Discord-Webhook für Bestell-Benachrichtigungen: Discord → dein Server → **Servereinstellungen → Integrationen →
   Webhooks → Neuer Webhook** → Kanal wählen (z. B. `#bestellungen`, nur für dich sichtbar) → **Webhook-URL kopieren**.
   Diese URL ist `DISCORD_WEBHOOK_URL`.

## B. Auf Netlify veröffentlichen (15 Minuten)

4. https://app.netlify.com → **Sign up** → „Sign up with GitHub“ (gleicher Account wie das Repo).
5. **Add new project → Import an existing project → GitHub** → beim ersten Mal „Configure Netlify on GitHub“ →
   Zugriff auf das Repo `donutsmpcoins` erlauben → Repo anklicken.
6. Im Formular „Configure project“:
   - *Branch to deploy*: `claude/donutcoins-store` (der einzige Branch, wird vorausgewählt)
   - *Build command* `npm run build`, *Publish directory* `dist`, *Functions directory* `netlify/functions` – steht
     bereits in `netlify.toml`, nichts ändern.
   - **Noch NICHT auf Deploy klicken** – erst die Variablen setzen (Punkt 7). Falls du schon geklickt hast: egal, später
     einfach neu deployen.
7. **Add environment variables** (im selben Formular, oder später unter *Site configuration → Environment variables →
   Add a variable*). Jede Variable einzeln: Key eintippen, Value einfügen, „Same value for all deploy contexts“ lassen.

   | Key | Value |
   |---|---|
   | `ADMIN_PASSWORD` | dein Admin-Passwort aus Schritt 2 |
   | `ADMIN_SECRET` | Zufallswert 2 |
   | `SESSION_SECRET` | Zufallswert 3 |
   | `DISCORD_WEBHOOK_URL` | die Webhook-URL aus Schritt 3 |
   | `NODE_VERSION` | `22` (steht auch in `netlify.toml`, schadet nicht) |

   `SITE_URL`, Stripe, PayPal, NOWPayments, Discord-Login kommen später (Teil D–F). Ohne sie läuft der Shop mit den
   manuellen Zahlungsarten (PayPal.me, Wallet-Adressen, Revolut).
8. **Deploy donutsmpcoins** klicken. Der erste Build dauert 2–4 Minuten (*Deploys* → oberster Eintrag → Logs). Am Ende
   steht `[prerender] 96/96 routes` und „Site is live“. Netlify vergibt eine Adresse wie
   `https://irgendwas-123456.netlify.app`.
9. Adresse ändern: *Site configuration → Site details → Change site name* → z. B. `donutcoins` →
   `https://donutcoins.netlify.app`. (Eigene Domain: Teil G.)
10. **Jetzt `SITE_URL` setzen**: *Environment variables → Add* → Key `SITE_URL`, Value `https://donutcoins.netlify.app`
    (ohne Schrägstrich am Ende). Dann *Deploys → Trigger deploy → Deploy site*. Grund: Zahlungs-Redirects, Discord-Links,
    Canonical-URLs und das Vorschaubild brauchen die endgültige Adresse.
11. Prüfen: Startseite öffnen, ein Produkt anklicken, `/sitemap.xml` öffnen (muss `https://donutcoins.netlify.app/...`
    enthalten), `/admin` öffnen.

## C. Admin einrichten – ohne das nimmt niemand Geld an (15 Minuten)

12. `https://donutcoins.netlify.app/admin` → Passwort (`ADMIN_PASSWORD`) → **Sign in**.
13. **Settings → Store**: Store name, Tagline, **Discord invite** (Discord → Kanal → Einladen → Link „läuft nie ab“ →
    kopieren → `https://discord.gg/...`), Support-E-Mail, Server name `DonutSMP`, Server IP. **Save**.
14. **Settings → Legal notice & prices** (Pflicht in DE/EU): dein voller Name, Anschrift, E-Mail; optional Telefon,
    USt-Hinweis (z. B. „No VAT is charged (§ 19 UStG)“ bei Kleinunternehmer). Price note nach Bedarf anpassen. **Save**.
    Ergebnis siehst du unter `/imprint` und im Footer.
15. **Settings → Payment methods** – hier entscheidet sich, wie du Geld bekommst:
    - **PayPal (manuell, sofort nutzbar)**: Methode „PayPal“ aufklappen → *Handle* = dein PayPal.me-Name. Den findest
      du unter https://www.paypal.com/paypalme → „Mein PayPal.me-Link erstellen“ (privat-Konto reicht). Beispiel: aus
      `paypal.me/MaxMuster` wird Handle `MaxMuster`. *Pay link template* bleibt
      `https://paypal.me/{{handle}}/{{total}}USD`. Enabled = an. **Save**.
    - **Litecoin / Bitcoin / USDT (manuell)**: jeweils *Handle* = deine Empfangsadresse aus deiner Wallet (z. B.
      Exodus, Trust Wallet, Binance → „Einzahlen“ → Adresse kopieren; bei USDT das Netzwerk TRC20 oder ERC20 in den
      Anweisungstext schreiben). Methoden, für die du keine Wallet hast: Enabled = aus.
    - **Revolut**: *Handle* = dein revolut.me-Tag (Revolut-App → Profil → „@tag“). Sonst aus.
    - **Gift cards**: nur an lassen, wenn du Gutscheincodes per Discord-Ticket annehmen willst.
    - **Card / Apple Pay / Google Pay (Stripe)**, **PayPal Checkout**, **Crypto (automatic)**: vorerst AUS – sie
      funktionieren erst mit den Schlüsseln aus Teil D.
    - Bei jeder manuellen Methode den *Instructions*-Text lesen: er wird dem Kunden gezeigt (`{{total}}`, `{{orderId}}`,
      `{{handle}}` werden automatisch ersetzt).
16. **Settings → Delivery**: *Staff username* = der Minecraft-Account, mit dem du lieferst (steht auf der Bestellseite),
    ETA-Text anpassen (z. B. „Usually within 10–30 minutes while we are online“). **Save**.
17. **Settings → Announcement / Spin / Rewards / Currencies**: optional anpassen; Standardwerte sind sinnvoll.
18. **Testbestellung** (unbedingt): Shop im Inkognito-Fenster öffnen → 1M Money in den Warenkorb → Checkout →
    eigener Minecraft-Name → PayPal (manuell) → Bestellung absenden → auf der Bestellseite „Open PayPal“ prüfen (Link
    muss deinen Namen + Betrag enthalten) → „Report payment“ mit Fantasie-Referenz. Im Discord-Kanal muss ein Ping
    ankommen. Admin → **Orders** → Bestellung → **Mark as paid** → **Mark delivered**. Danach **Cancel**/Refund-Flow
    einmal anschauen.
19. **Einmal neu deployen** (*Deploys → Trigger deploy*): Der Build holt sich jetzt Store-Name, Discord-Link,
    Impressum und Preise live aus deinem Admin in die statischen Seiten, die Google sieht. Das gilt für die Zukunft:
    nach größeren Änderungen im Admin (Preise, Produkte, Name) einmal „Trigger deploy“.

## D. Automatische Zahlungen anbinden

Alle drei sind optional und unabhängig. Reihenfolge nach Verfügbarkeit: NOWPayments (geringste Hürde, 10 Minuten),
Stripe (Identitätsprüfung, 1–2 Tage), PayPal Checkout (Business-Konto, 1–3 Tage).

### D1. NOWPayments – Krypto mit automatischer Bestätigung

20. https://nowpayments.io → **Sign up** (E-Mail bestätigen).
21. Dashboard → **Settings → Payments → Payout wallets** → „Add wallet“ → Coin wählen (z. B. USDT TRC20 oder LTC) →
    deine Empfangsadresse → speichern. Ohne Auszahlungs-Wallet werden keine Zahlungen angenommen.
22. **Settings → Payments → API keys** → „Add new key“ → Namen vergeben → Key kopieren → Netlify: Variable
    `NOWPAYMENTS_API_KEY`.
23. **Settings → Payments → IPN** (Instant Payment Notification) → „Generate IPN secret“ → kopieren → Netlify:
    `NOWPAYMENTS_IPN_SECRET`. Als IPN-URL ist nichts im Dashboard nötig: der Shop schickt pro Rechnung
    `https://donutcoins.netlify.app/api/payments/nowpayments/ipn` mit.
24. Netlify → *Trigger deploy* (neue Variablen gelten erst nach einem Deploy).
25. Admin → Payment methods → **Crypto (automatic)** → Enabled an → Save. Die manuellen Coin-Methoden kannst du jetzt
    ausschalten (oder parallel lassen).
26. Test: Bestellung mit „Crypto (automatic)“ → Weiterleitung auf die NOWPayments-Rechnung muss klappen. Kleinstbetrag
    zahlen (z. B. 1M Money ≈ 0,18 $) – nach Bestätigung springt die Bestellung automatisch auf *Paid* und Discord pingt.

### D2. Stripe – Kreditkarte, Apple Pay, Google Pay (und mehr)

27. https://dashboard.stripe.com/register → Konto anlegen → „Konto aktivieren“: Angaben zur Person (18+, Ausweis),
    Geschäftstätigkeit („Digitale Güter / virtuelle Gegenstände für Minecraft-Server“), Bankkonto (IBAN) für
    Auszahlungen, Website-URL = deine Shop-Adresse. Stripe prüft 1–2 Tage; bis dahin geht nur Test-Modus.
28. Oben rechts **Test-Modus AUS** (Schalter) → **Entwickler → API-Schlüssel** → *Geheimschlüssel* „Anzeigen“ →
    `sk_live_...` kopieren → Netlify: `STRIPE_SECRET_KEY`.
29. **Entwickler → Webhooks → Endpunkt hinzufügen**:
    - Endpunkt-URL: `https://donutcoins.netlify.app/api/payments/stripe/webhook`
    - Ereignisse: `checkout.session.completed` (zusätzlich erlaubt: `checkout.session.async_payment_succeeded`,
      `checkout.session.async_payment_failed`)
    - Endpunkt hinzufügen → auf den Endpunkt klicken → **Signaturgeheimnis** „Anzeigen“ → `whsec_...` → Netlify:
      `STRIPE_WEBHOOK_SECRET`.
30. **Einstellungen → Zahlungsmethoden**: Karten sind an; **Apple Pay** und **Google Pay** sind auf der von Stripe
    gehosteten Checkout-Seite automatisch aktiv (keine Domain-Verifizierung nötig). Optional Klarna, SEPA, iDEAL,
    Link einschalten – der Shop übergibt keine feste Liste, Stripe zeigt alles Freigeschaltete.
31. **Einstellungen → Branding**: Logo (`public/img/brand/logo.svg` als PNG exportieren) und Farbe `#f5b43a` – rein
    optisch.
32. Netlify → *Trigger deploy*. Admin → Payment methods → **Card / Apple Pay / Google Pay** → Enabled an → Save.
33. Test: Bestellung mit Karte → Stripe-Seite → mit eigener Karte 1M Money kaufen (≈ 0,18 $, sofort wieder
    erstattbar im Stripe-Dashboard) → zurück im Shop steht die Bestellung auf *Paid*. Wenn nicht: Stripe → Webhooks →
    Endpunkt → „Versuche“ zeigt die Antwort des Shops (muss 200 sein).

### D3. PayPal Checkout – automatische Bestätigung statt PayPal.me

Vorteil: Kunde zahlt im PayPal-Fenster, Bestellung wird automatisch *Paid*. Nachteil: braucht ein **PayPal-
Geschäftskonto** (kostenlos, aber Prüfung von Identität und Bankkonto) und PayPal nimmt Gebühren.

34. https://www.paypal.com/de/business → Geschäftskonto eröffnen (oder bestehendes Privatkonto hochstufen:
    Einstellungen → „Zu Geschäftskonto wechseln“). Identität + Bankkonto bestätigen.
35. https://developer.paypal.com/dashboard/applications/live → mit dem Geschäftskonto einloggen → Reiter **Live** (nicht
    Sandbox) → **Create App** → Name „DonutCoins“ → Typ Merchant → Create.
36. Auf der App-Seite: **Client ID** kopieren → Netlify `PAYPAL_CLIENT_ID`; **Secret** „Show“ → kopieren → Netlify
    `PAYPAL_CLIENT_SECRET`; zusätzlich Netlify `PAYPAL_ENV` = `live`.
    (Zum Testen ohne echtes Geld: Reiter *Sandbox*, dortige App-Credentials und `PAYPAL_ENV=sandbox`, Testkäufer-Konto
    unter *Testing Tools → Sandbox accounts*.)
37. Netlify → *Trigger deploy*. Admin → Payment methods → **PayPal Checkout** → Enabled an → Save. Die manuelle
    PayPal.me-Methode kannst du parallel anlassen (Friends & Family ohne Gebühren) oder ausschalten.
38. Test: Bestellung mit PayPal Checkout → PayPal-Fenster → zahlen → Bestellung *Paid*, Discord-Ping.

## E. Discord-Login (Kunden können sich einloggen, Rad drehen, Bestellungen sehen)

39. https://discord.com/developers/applications → **New Application** → Name „DonutCoins“ → Create.
40. Links **OAuth2**: *Client ID* kopieren → Netlify `DISCORD_CLIENT_ID`. **Reset Secret** → kopieren → Netlify
    `DISCORD_CLIENT_SECRET`.
41. Unter **Redirects → Add Redirect**: `https://donutcoins.netlify.app/api/auth/discord/callback` → **Save Changes**.
    (Mit eigener Domain später die Domain-Variante zusätzlich eintragen.)
42. `SESSION_SECRET` ist aus Schritt 7 gesetzt – ohne ihn verweigert der Login (503).
43. Optional „nur Server-Mitglieder dürfen drehen“: Discord-App → Einstellungen → Erweitert → **Entwicklermodus** an →
    Rechtsklick auf deinen Server → **Server-ID kopieren** → Netlify `DISCORD_GUILD_ID`. Dann Admin → Settings →
    **Spin** → „Require membership“ an.
44. Netlify → *Trigger deploy*. Im Header erscheint „Login with Discord“. Einmal selbst einloggen, unter *Account*
    deinen Minecraft-Namen setzen (das ist auch die Bedingung, um Guthaben auszugeben).

## F. Netlify-Feinheiten

45. **Scheduled function** `expire-orders` läuft stündlich und storniert Bestellungen, die 24 h unbezahlt sind (Bestand
    und Gutscheine kommen zurück). Sichtbar unter *Logs → Functions*. Nichts einzurichten.
46. **Deploy-Benachrichtigung**: *Site configuration → Notifications* → E-Mail bei fehlgeschlagenem Deploy.
47. **Kosten**: Free-Plan reicht (125 000 Function-Aufrufe und 100 GB Traffic pro Monat). Netlify Blobs (Datenbank) ist
    inklusive. Bei Erfolg Pro-Plan (19 $/Monat) für mehr Function-Minuten.
48. **Backups**: Admin → Orders zeigt alles; exportiere regelmäßig (Admin → Dashboard → Export, falls eingebaut, sonst
    Screenshots der Bestellliste). Blobs werden von Netlify nicht automatisch gesichert.

## G. Eigene Domain + Google (sobald der Shop läuft)

49. Domain kaufen (z. B. Namecheap, IONOS, Netlify selbst: *Domain management → Add a domain → Register*). Günstig und
    passend: `.gg`, `.shop`, `.store`, `.net`.
50. Netlify → **Domain management → Add a domain → Add domain you already own** → Anleitung für DNS folgen (bei externem
    Registrar: Nameserver auf Netlify umstellen, dauert bis 24 h). HTTPS-Zertifikat wird automatisch ausgestellt.
51. Netlify → Environment variables → `SITE_URL` auf `https://deine-domain` ändern → Trigger deploy.
52. Stripe-Webhook-URL (Schritt 29), NOWPayments (nichts), PayPal (nichts), Discord-Redirect (Schritt 41): überall die
    neue Domain eintragen bzw. ergänzen.
53. **Google Search Console**: https://search.google.com/search-console → „Property hinzufügen“ → URL-Präfix
    `https://deine-domain` → Methode **HTML-Tag** → den Wert aus `content="..."` kopieren → Netlify
    `GOOGLE_SITE_VERIFICATION` → Trigger deploy → in der Search Console „Bestätigen“ → links **Sitemaps** →
    `https://deine-domain/sitemap.xml` einreichen.
54. Optional **Google Analytics**: https://analytics.google.com → Property → Datenstream Web → Mess-ID `G-XXXXXXXX` →
    Netlify `GA_MEASUREMENT_ID` → Trigger deploy. Der Cookie-Hinweis erscheint automatisch.

## H. Täglicher Betrieb

- Discord-Ping „New order“ → Kunde zahlt → Ping „Payment reported“ (manuell) oder direkt „PAID“ (Stripe/PayPal/NOW).
- Manuelle Zahlung: im PayPal-/Wallet-Konto prüfen, dass Betrag + Bestellnummer stimmen → Admin → Order →
  **Mark as paid**.
- Ingame liefern (bei Money `/pay Name Betrag`, Items per Teleport) → **Mark delivered**. Der Kunde sieht jeden Schritt
  auf seiner Bestellseite und wird um eine Bewertung gebeten.
- Probleme: **Refund** (gibt Guthaben/Bestand zurück) oder Store-Guthaben über Admin → Credit.
- Nie Zahlungsdaten per Discord-DM annehmen; alles läuft über die Bestellseite.
