/**
 * Extra SEO landing pages (pure data – the integrator wires routes + a page
 * component, e.g. with <ContentPage> and the same inline markup as the FAQ:
 * **bold**, `code`, [label](/internal-link)).
 *
 * Suggested routes: /<slug> (e.g. /donutsmp-elytra), added to src/seo/routes.ts.
 *
 * All prices, tiers and box odds mirror the DEFAULT catalog in
 * src/data/catalog.ts and the default spending tiers in settings.ts
 * ($15 → 5%, $40 → 8%, $100 → 12%). Box-wide odds were obtained by simulating
 * the exact roll logic in netlify/lib/boxes.ts (weighted draws without repeats).
 *
 * Honesty rules: manual delivery by staff (no bot), usually within 5–30 minutes
 * while online; not affiliated with DonutSMP/Mojang; DonutSMP's rules prohibit
 * real-money trading – buyer's responsibility. No invented stats or reviews.
 */

export interface LandingSection {
  heading: string;
  paragraphs: string[];
}

export interface LandingCopy {
  slug: string;
  /** H1 */
  title: string;
  /** <title> – ≤ 60 characters */
  seoTitle: string;
  /** meta description – 120–155 characters */
  metaDescription: string;
  /** lead paragraph under the H1 */
  intro: string;
  sections: LandingSection[];
  faq: { q: string; a: string }[];
  /** catalog product ids to show as cards / CTA on the page */
  productIds: string[];
}

export const landingCopy: LandingCopy[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. Mystery boxes
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-mystery-boxes',
    title: 'DonutSMP Mystery Boxes: Every Box, Price and Real Drop Chance',
    seoTitle: 'DonutSMP Mystery Boxes – Prices & Real Odds | DonutCoins',
    metaDescription:
      'DonutSMP mystery boxes compared: Coin Crate, Spawner Crate, Mystery, Elite and God boxes, Legendary Crate – prices from $1.99, drop tables, Elytra odds.',
    intro:
      'Mystery boxes are the part of DonutCoins where luck is involved – but only the luck. Every box has a published drop table, the roll happens on our server when you order, and the result is on your order page before anything is handed over on DonutSMP. This page compares all nine boxes, from the $1.99 Coin Crate to the $34.99 Legendary Crate, with prices, pools and the real chance of pulling an Elytra.',
    sections: [
      {
        heading: 'How a DonutSMP mystery box is rolled',
        paragraphs: [
          'Each line in a box\'s drop table has a weight. On a single roll, the chance of a line is its weight divided by the total weight of the pool – that is the percentage you see under **What\'s inside?** on every box page. Boxes with more than one drop draw without repeats, so a two-drop box always contains two different lines.',
          'The quantity within a line (for example 2–4 zombie spawners) is rolled within the stated range. Nothing is re-rolled; the server records the result on your order the moment it is created.',
        ],
      },
      {
        heading: 'All nine boxes at a glance',
        paragraphs: [
          '[Coin Crate](/product/coin-crate) – $1.99, one money drop from 10M to 250M. [Mega Coin Crate](/product/mega-coin-crate) – $9.99, one money drop from 60M to 1B. [Spawner Crate](/product/spawner-crate) – $2.99, one spawner drop, with a cow spawner or 10 skellies as the jackpots.',
          '[Netherite Crate](/product/netherite-crate) – $5.99, one netherite drop up to a netherite block. [Elytra Crate](/product/elytra-crate) – $7.99, one drop with about a 1 in 12 Elytra chance. [Mystery Box](/product/mystery-box) – $3.99, two drops from an eleven-line pool.',
          '[Elite Mystery Box](/product/elite-mystery-box) – $8.99, two drops with bigger stacks and 100M in the pool. [God Mystery Box](/product/god-mystery-box) – $19.99, three drops from a stronger pool with 250M in it. [Legendary Crate](/product/legendary-crate) – $34.99, three drops from our best pool with the highest jackpot odds.',
        ],
      },
      {
        heading: 'Elytra odds, box by box',
        paragraphs: [
          'Because multi-roll boxes draw without repeats, the chance of seeing a line somewhere in the box is higher than its per-roll percentage. Simulating the server\'s exact roll logic gives roughly these box-wide Elytra odds: Mystery Box about **1 in 200**, Elite Mystery Box about **1 in 95**, God Mystery Box about **1 in 22**, Legendary Crate about **1 in 8** and the Elytra Crate about **1 in 12** – the cheapest shot per dollar. If you want an Elytra for certain, [buy one directly](/product/elytra).',
        ],
      },
      {
        heading: 'Is a mystery box worth it?',
        paragraphs: [
          'Boxes are not a discount and we do not pretend they are: on average every box pays out less than buying the same items directly. An [Elytra](/product/elytra) is $28.49 on its own, 1M is $0.05 or less, a netherite block $14.49.',
          'If you want a specific item, buy the item; if you enjoy the opening and would be happy with several outcomes, buy the box. The Coin Crate sits in between: every result is money, the floor is 10M and about one crate in ten pays 50M or more – though a crate averages around 21M, less than the 25M pack costs to buy outright.',
        ],
      },
      {
        heading: 'Delivery and what you see on your order page',
        paragraphs: [
          'Your order page lists every rolled line with its quantity. Item drops are delivered by hand: join DonutSMP with your order username, accept the teleport from our delivery account and pick up the drop, in a shulker for bigger results. Money lines are paid to your balance with `/pay`. A member of our staff does this manually, usually within 5–30 minutes while we are online – there is no bot.',
          'As with everything we sell: DonutSMP\'s rules prohibit real-money trading, buying is at your own risk, and DonutCoins is not affiliated with DonutSMP or Mojang.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can I see what I rolled before delivery?',
        a: 'Yes. The box is rolled server-side when the order is created and every line with its quantity appears on your order page as soon as your payment is confirmed – before anything is handed over. What you see there is exactly what you get.',
      },
      {
        q: 'Can I get a refund on a bad roll?',
        a: 'No. The odds are public before you buy and the rolled result is delivered in full, so a low roll is not a refund reason. Our refund policy covers non-delivery, duplicate payments and wrong items.',
      },
      {
        q: 'How many boxes can I order at once?',
        a: 'Up to 50 per line for most boxes, 25 God Mystery Boxes and 10 Legendary Crates. Each box is rolled separately, and the whole cart counts toward the 5–12% spending discount.',
      },
    ],
    productIds: ['coin-crate', 'spawner-crate', 'mystery-box', 'netherite-crate', 'elytra-crate', 'elite-mystery-box', 'mega-coin-crate', 'god-mystery-box', 'legendary-crate'],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Elytra
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-elytra',
    title: 'How Much Is an Elytra on DonutSMP? Price in Coins and Dollars',
    seoTitle: 'How Much Is an Elytra on DonutSMP? ~700M Coins | DonutCoins',
    metaDescription:
      'An Elytra on DonutSMP trades for around 700M coins (Nov 2026). Here it costs $28.49 with Unbreaking III + Mending, handed over in-game by our staff.',
    intro:
      'Short answer: an Elytra on DonutSMP goes for around 700M coins in player trades right now (November 2026), and here it costs $28.49 with Unbreaking III and Mending. An Elytra is the single most useful item on DonutSMP: it turns a base hunt from an hour of walking into five minutes of flying and makes escaping a fight possible at all. Ours comes with Unbreaking III and Mending for $28.49 and is handed over in-game by our staff. This page explains why the price is what it is, how delivery works, which bundles and boxes include an Elytra, and how to keep yours.',
    sections: [
      {
        heading: 'Why an Elytra costs what it costs on DonutSMP',
        paragraphs: [
          'Elytras only come from End cities. On DonutSMP the End is hosted only on the NA East region and sits inside a world border, so the supply is finite, and on a server as old and as busy as this one the reachable End has been stripped bare. Finding an unlooted ship means flying thousands of blocks out in the End – which already requires an Elytra – or paying someone who did. That scarcity is why an Elytra trades for hundreds of millions of coins on the auction house, and why $28.49 is the most expensive single item in our store outside boxes and bundles.',
          'We price against the in-game auction house, not against other real-money sellers: when Elytras get cheaper in-game, our price follows. The price you lock at checkout is final either way.',
        ],
      },
      {
        heading: 'What you get and how delivery works',
        paragraphs: [
          'The [Elytra](/product/elytra) is delivered with **Unbreaking III and Mending** – the two enchantments that matter, since Mending repairs it with XP while you fly past a mob farm and Unbreaking III triples its practical lifetime. It arrives unused with full durability. You can order up to 20 per line.',
          'Delivery is manual: pay, report your payment reference, then join DonutSMP with the exact username from your order. A member of our staff sends a teleport request from our delivery account, you accept, pick up the drop and the order page switches to delivered – usually within 5–30 minutes while we are online, never by bot. Bring firework rockets; the Elytra does nothing without them.',
        ],
      },
      {
        heading: 'Other routes: bundles and boxes',
        paragraphs: [
          'If you want more than the Elytra, three bundles include one in a single order and handover. The [Pro Bundle](/product/pro-bundle) ($40.99) adds 50M money and 16 skeleton spawners, the [Rich Bundle](/product/rich-bundle) ($59.99) comes with 250M, a God Mystery Box and the full PvP Kit, and the [Basehunter Bundle](/product/basehunter-bundle) ($33.99) pairs an Elytra with the Amethyst Pickaxe, 16 totems and 20M. At current prices each costs less than its parts bought separately – about $4.24 less for the Pro Bundle, $6.98 for the Rich Bundle and $3.81 for the Basehunter Bundle.',
          'Random boxes are the gamble: the [Elite Mystery Box](/product/elite-mystery-box) ($8.99) contains an Elytra in roughly 1 in 95 boxes, the [Elytra Crate](/product/elytra-crate) ($7.99) in about 1 in 12 and the [Legendary Crate](/product/legendary-crate) ($34.99) in about 1 in 8. For the Elytra itself, buying it outright at $28.49 is always the safe choice.',
        ],
      },
      {
        heading: 'Keeping your Elytra',
        paragraphs: [
          'Three habits keep an Elytra alive on DonutSMP. First, Mending only works while the Elytra is equipped and you gain XP, so a few minutes of collecting XP after every flight keeps it topped up – an Elytra that breaks is a chestplate slot with no armor. Second, carry at least a stack of rockets and a totem; most Elytra losses are deaths mid-air, not durability. Third, store it in an Ender Chest when you are at your base and not flying, so a surprise raid does not take it.',
          '[Creeper spawners](/product/creeper-spawner) ($0.69, $0.65 at 25+) are the long-term rocket supply most Elytra owners end up buying. As with everything we sell, DonutSMP\'s rules prohibit real-money trading – we deliver through normal gameplay and keep it discreet, but the risk is yours.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much is an Elytra on DonutSMP?',
        a: 'In our store $28.49, with Unbreaking III and Mending included. Auction-house prices in-game move constantly; ours follows them and is fixed for your order once you check out.',
      },
      {
        q: 'Does the Elytra come enchanted?',
        a: 'Yes – Unbreaking III and Mending, unused, full durability. If you want a different enchantment setup, ask on Discord before ordering.',
      },
      {
        q: 'Do I have to be online to receive it?',
        a: 'Yes. An Elytra is an item, so you accept a teleport from our delivery account on DonutSMP and pick up the drop. Have a free inventory slot and be somewhere safe – ideally your base.',
      },
      {
        q: 'Is buying an Elytra allowed on DonutSMP?',
        a: 'DonutSMP\'s rules prohibit trading items for real money, so buying is at your own risk and a later punishment is not a refund reason. We deliver with a normal teleport and drop and never ask for your account.',
      },
    ],
    productIds: ['elytra', 'pro-bundle', 'rich-bundle', 'basehunter-bundle', 'god-mystery-box', 'legendary-crate', 'creeper-spawner'],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Skeleton spawner
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-skeleton-spawner',
    title: 'How Much Is a Skeleton Spawner on DonutSMP? (~18M Coins, $0.89)',
    seoTitle: 'DonutSMP Skeleton Spawner Price – 18M / $0.89 | DonutCoins',
    metaDescription:
      'A skeleton spawner on DonutSMP trades for about 18M coins. Here: $0.89 each, $0.69 at 250+. Every bulk tier, how spawners work and how delivery works.',
    intro:
      'The skeleton spawner – "skelly" to anyone who has played DonutSMP for a week – is the item most players buy first and buy most of. This page gives the current prices with every bulk tier, explains how we set them, how spawners actually work on DonutSMP and why skeletons are the server\'s default income, helps you work out how many spawners you actually need, and describes how a hundred spawners are handed over in-game by our staff.',
    sections: [
      {
        heading: 'Current skeleton spawner prices',
        paragraphs: [
          'A [skeleton spawner](/product/skeleton-spawner) is **$0.89** at DonutCoins. Bulk tiers apply automatically per line: $0.84 each from 25 spawners, $0.79 from 50, $0.74 from 100 and $0.69 from 250, up to 2,000 per line. The tier price applies to every spawner in the line, so 100 spawners cost $74.00, not a blend of rates – and 50 spawners ($39.50) cost less than 45 ($40.05).',
          'On top of the tiers, the cart-wide spending discount takes 5% off orders over $15, 8% over $40 and 12% over $100. A 64-spawner order is $50.56 at the 50+ tier, so the 8% discount applies; 250 spawners are $172.50 and get 12% off.',
          'Why $0.89? Our spawner prices follow what spawners go for in our own deals – about 18M coins for a skelly. Fan price trackers often show lower figures and player prices swing, so take it as our reference, not a server-wide fact. 18M money costs about the same at our $0.05 base rate, so buying the spawner and buying the coins to pay a player come out roughly even – the difference is that ours are in stock and handed over by staff. Since the June 2026 update the server no longer sells spawners, so every spawner, ours included, comes from player trades. The same logic prices [iron golem spawners](/product/iron-golem-spawner) at $1.99 (about 41M coins) and [cow spawners](/product/cow-spawner) at $4.99 (around 100M).',
        ],
      },
      {
        heading: 'Why skeleton spawners are the DonutSMP default',
        paragraphs: [
          'On DonutSMP spawners do not spawn mobs. A skeleton spawner generates bones and arrows straight into its own storage, which you open by right-clicking like a chest, and Shift + right-clicking another skelly onto it stacks them into a single block. No dark room, no water streams, no kill chamber – you collect the drops and sell them with `/sell` or fill buy orders on `/orders`, where bones are in steady demand.',
          'Because so many established players run them, skeleton spawners are among the most traded items between players – there is usually a buyer when you want to sell spawners back, though prices move. [Iron golem spawners](/product/iron-golem-spawner) ($1.99) earn more when iron sells well and [blaze spawners](/product/blaze-spawner) ($0.89) produce blaze powder for brewers, but the skelly is the safe default.',
        ],
      },
      {
        heading: 'How many spawners do you need?',
        paragraphs: [
          'A handful of spawners is a hobby; a room full of them is an income. Most players start at 15–25 spawners and expand as the farm earns. 64 spawners – one stack, the Spawner Farm Bundle size – is the classic serious farm. Output per spawner shrinks as a single stack grows, so several separate stacks in different blocks produce more than one giant stack – spread big orders out.',
          '/sell base prices can change with server updates (sell multipliers were removed in June 2026), so we will not quote a per-hour income here. Run a single spawner for a day, sell what it produces, and multiply – that number tells you whether the next tier is worth it faster than any guide.',
        ],
      },
      {
        heading: 'Delivery: how 100 spawners reach you',
        paragraphs: [
          'Spawners are items, so they are handed over, not paid. After you pay and report the reference, join DonutSMP with the exact username from your order and accept the teleport request from our delivery account. Larger orders arrive in shulker boxes, so bring inventory space and pick a safe spot – your base is best. A member of our staff does this by hand, usually within 5–30 minutes while we are online.',
          'DonutSMP\'s rules prohibit real-money trading; we deliver through normal gameplay and keep it discreet, but the risk is yours. There are no land claims on DonutSMP, so a farm that gets found can be raided – hide it well.',
        ],
      },
      {
        heading: 'Alternatives: crates and bundles',
        paragraphs: [
          'The [Spawner Crate](/product/spawner-crate) ($2.99) gives one spawner drop – mostly zombies or a single skelly, with a cow spawner in about one crate in 33 and 10 skeleton spawners in roughly one in a hundred. The [Starter Bundle](/product/starter-bundle) ($13.49) packs 15 skeleton spawners with 20M and a Diamond Armor Shulker, and the [Spawner Farm Bundle](/product/spawner-farm-bundle) ($45.99) is 64 skeleton spawners plus 10M in one order – about $5.07 less than the parts. For odd quantities or more than 2,000 spawners, message us on Discord for a quote.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much do 64 skeleton spawners cost?',
        a: '$50.56 at the 50+ tier of $0.79 each – and since that is over $40, the automatic 8% spending discount comes off on top. The Spawner Farm Bundle offers the same 64 spawners with 10M money for $45.99.',
      },
      {
        q: 'Can I move skeleton spawners after placing them?',
        a: 'We cannot promise it. How – and whether – placed spawners can be picked back up on DonutSMP is not clearly documented, and some reports say stored drops are lost when a spawner is broken. Plan where your farm goes before you place it, and ask on Discord if you need current details.',
      },
      {
        q: 'How are spawners delivered on DonutSMP?',
        a: 'By hand. Be online with your order username, accept the teleport from our delivery account and pick up the drop; big orders come in shulker boxes. Staff do this manually, usually within 5–30 minutes while online.',
      },
      {
        q: 'What is the maximum I can order?',
        a: '2,000 skeleton spawners per line through the store. For more, or for a mixed spawner package, message us on Discord and we will quote a price.',
      },
    ],
    productIds: ['skeleton-spawner', 'spawner-crate', 'spawner-farm-bundle', 'starter-bundle', 'iron-golem-spawner', 'cow-spawner', 'blaze-spawner'],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Money prices
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-money-prices',
    title: 'DonutSMP Money Prices: What 1M to 1B Costs Right Now',
    seoTitle: 'DonutSMP Money Prices – 1M to 1B Compared | DonutCoins',
    metaDescription:
      'DonutSMP money price list: $0.05 per 1M for any amount, bulk tiers to $0.03, packs from 10M ($0.49) to 1B ($28.99), discounts, cashback. Paid with /pay.',
    intro:
      'This is the full price list for DonutSMP money at DonutCoins: the pick-your-amount rate with every bulk tier, the fixed packs from 10M to 1B, the discounts that stack on top, and worked examples so you can see what a given amount actually costs. Prices are in USD and come from the same catalog as the checkout. Money is paid to your in-game balance with /pay by our staff, usually within minutes.',
    sections: [
      {
        heading: 'Pick-your-amount rates',
        paragraphs: [
          'The flexible [money product](/product/donutsmp-money) charges per million: **$0.05 per 1M** for any amount, $0.04 from 100M and $0.03 from 1B, up to 5B in one line. The tier applies to the whole line – 100M costs 100 × $0.04 = $4.00, not a blend, so anything from 80M up is worth rounding to 100M. This is the right choice for odd amounts such as 37M ($1.85) or 120M ($4.80).',
        ],
      },
      {
        heading: 'Fixed packs: the cheapest per million',
        paragraphs: [
          'At round numbers the fixed packs are a little cheaper than the flexible rate: [10M](/product/10m-money) for $0.49 ($0.049 per 1M), [25M](/product/25m-money) for $1.19 (under $0.048), [50M](/product/50m-money) for $2.39 (under $0.048), [100M](/product/100m-money) for $3.79 (under $0.038), [250M](/product/250m-money) for $9.49 (under $0.038), [500M](/product/500m-money) for $18.99 (under $0.038) and [1B](/product/1b-money) for $28.99 ($0.029). The 100M pack, for example, is about 5% cheaper than 100 flexible millions at $4.00.',
          'Packs can be combined, but bigger is cheaper per million: two 500M packs cost $37.98, while the 1B pack is $28.99. Buy the largest pack that covers what you need and top up with the flexible listing.',
        ],
      },
      {
        heading: 'Discounts that stack',
        paragraphs: [
          'Three layers come off automatically or with a code, and a fourth comes back after delivery. **Spending tiers:** 5% off carts over $15, 8% over $40, 12% over $100, applied to the whole cart. **One coupon per order:** the welcome code when it is enabled, a [daily spin](/spin) prize of 5–25% (the bigger ones carry a minimum order) or a review reward; alternatively a referral link gives a new customer 5%. **Store credit** from referrals, spin wins or cashback is applied last – and every delivered order earns **5% cashback** as store credit for the next one. The total discount is capped at 60%.',
        ],
      },
      {
        heading: 'Worked examples',
        paragraphs: [
          '50M: the pack is $2.39 – under the $15 threshold, so no tier discount; with a 5% welcome coupon $2.27. 250M: $9.49, also under $15 – $9.02 with the welcome coupon. 500M: $18.99, 5% tier → $18.04. 1B: $28.99, 5% tier → $27.54, under $0.028 per million. On every one of them, 5% of what you pay comes back as store credit after delivery.',
          'All examples use the default settings; a sale banner or changed tiers would show at checkout, and the cart always displays the exact total before you pay.',
        ],
      },
      {
        heading: 'Why the price changes and what is locked',
        paragraphs: [
          'DonutSMP money is player-earned, so its real-world price follows the in-game economy: it drops when farms get cheaper or `/sell` pays more, and moves when big server updates change how money enters the game – as the June 2026 update did. The current season is declared permanent, so there are no map resets to plan around. We also keep a reserve so orders ship immediately, and a very large order can nudge the price until the reserve is rebuilt. The price you see at checkout is locked for that order.',
          'Delivery is manual – a member of our staff runs `/pay` to the username on your order, usually within 5–30 minutes while we are online, and big amounts can be split over several payments on request. DonutSMP\'s rules prohibit real-money trading, so buying is your own responsibility; DonutCoins is not affiliated with DonutSMP or Mojang.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is there anything cheaper than the 1B pack?',
        a: 'Not in the store – $28.99 for 1B is the lowest per-million price, and the 5% spending discount brings it to $27.54. For amounts beyond that, message us on Discord for a custom quote.',
      },
      {
        q: 'Do the prices include fees?',
        a: 'PayPal Friends & Family and Litecoin add nothing on our side. Gift cards carry a 10% fee shown at checkout, and crypto network fees are paid by you. Your bank or wallet may convert currencies at its own rate.',
      },
      {
        q: 'Can I lock a price and take delivery in parts?',
        a: 'Yes. The price is fixed when the order is created; tell us in the order note or on Discord how you want the amount split and over what days, and we deliver on that schedule.',
      },
    ],
    productIds: ['money-1m', 'money-10m', 'money-25m', 'money-50m', 'money-100m', 'money-250m', 'money-500m', 'money-1b'],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Netherite
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-netherite',
    title: 'Buy DonutSMP Netherite: Ingots, Blocks, Debris and God Gear',
    seoTitle: 'Buy DonutSMP Netherite – Ingots, Blocks & Gear | DonutCoins',
    metaDescription:
      'DonutSMP netherite delivered in-game: ingots from $2.89, blocks from $13.49, ancient debris from $0.52, god netherite armor $4.99 and maxed tools $0.99.',
    intro:
      'Netherite is DonutSMP\'s hard currency: ingots and blocks hold value over time, and the god armor and tools made from it are what you fight in. DonutCoins sells the raw material – ancient debris, ingots and blocks – and the finished gear, all handed over in-game by our staff. This page lists the prices, explains when to buy blocks instead of ingots, and shows which kits and boxes include netherite.',
    sections: [
      {
        heading: 'Netherite prices on DonutSMP',
        paragraphs: [
          '[Ancient debris](/product/ancient-debris) is $0.57 each, $0.52 at 32+. [Netherite ingots](/product/netherite-ingot) are $3.29, $3.09 at 9+ and $2.89 at 36+. [Netherite blocks](/product/netherite-block) are $14.49, or $13.49 when you buy four or more. Finished gear: the [god netherite armor set](/product/netherite-armor-set) with Protection IV, Unbreaking III, Mending and Thorns III is $4.99, the [Netherite Armor Shulker](/product/netherite-armor-shulker) with six sets is $18.99, and the god [netherite sword](/product/netherite-sword) and [pickaxe](/product/netherite-pickaxe) are $0.99 each, with 27-piece shulkers at $21.99 and $18.99.',
        ],
      },
      {
        heading: 'Blocks vs ingots vs debris',
        paragraphs: [
          'Buy by the cheapest route to the netherite you need. A block is nine ingots: at $14.49 that is **$1.61 per ingot**, against $3.09 for loose ingots at the 9+ tier – so anyone who wants ingots in bulk should buy blocks and split them at a crafting table. Loose ingots make sense for small amounts, one to eight.',
          'Ancient debris is for players who like smelting: four debris become four scrap, which with four gold ingots make one netherite ingot. At the 32+ tier that is $2.08 of debris per ingot plus your gold – cheaper than the $2.89 bulk ingot, and debris is also an item people hoard long-term.',
        ],
      },
      {
        heading: 'Netherite gear: armor and tools',
        paragraphs: [
          'The finished gear is where netherite actually pays off in PvP. The $4.99 god set is a full suit with Protection IV, Unbreaking III, Mending and Thorns III; the [PvP Kit](/product/pvp-kit) ($8.49) adds a Sharpness V, Fire Aspect II, Looting III sword, an Efficiency V, Fortune III pickaxe and 8 totems. Crafting a set yourself costs four ingots – $13.16 at the single price, or 16 debris plus gold – before you have enchanted anything, which is why most of our netherite sales are gear rather than ingots.',
        ],
      },
      {
        heading: 'Netherite in kits and boxes',
        paragraphs: [
          'The Investment Boxes are fixed kits with netherite in them: the [Starter box](/product/starter-investment-box) ($9.49) has one ingot, the [Value box](/product/value-investment-box) ($37.99) a block plus four ingots, and the [Elite box](/product/elite-investment-box) ($47.99) a block plus six ingots alongside a dragon head and two heavy cores. Random boxes carry netherite too – ingots or blocks turn up in most Elite and God Mystery Boxes, and the Legendary Crate rolls a maxed netherite armor set in roughly 57% of crates. The odds are public on every box.',
        ],
      },
      {
        heading: 'Delivery and storage',
        paragraphs: [
          'Netherite is handed over in-game: after you pay and report the reference, join DonutSMP with the username on your order, accept the teleport from our delivery account and pick up the drop – shulkered for larger orders. Our staff do this manually, usually within 5–30 minutes while online. Netherite does not burn, but it can be looted: keep blocks in an Ender Chest or a well-hidden base – DonutSMP has no land claims.',
          'DonutSMP\'s rules prohibit real-money trading and buying is your own responsibility; DonutCoins is an independent store, not affiliated with DonutSMP or Mojang.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much is a netherite block on DonutSMP?',
        a: '$14.49 in our store, or $13.49 each when you buy four or more. That is nine ingots\' worth of netherite for roughly half the price of nine loose ingots.',
      },
      {
        q: 'Is it cheaper to buy netherite ingots or blocks?',
        a: 'Blocks, by a wide margin: $1.61 per ingot inside a block versus $2.89–$3.29 per loose ingot. Buy blocks and craft them back into ingots unless you only need a few.',
      },
      {
        q: 'Are the netherite tools and armor fully enchanted?',
        a: 'Yes. Armor has Protection IV, Unbreaking III, Mending and Thorns III; the sword has Sharpness V, Fire Aspect II, Looting III, Unbreaking III and Mending; the pickaxe has Efficiency V, Fortune III, Unbreaking III and Mending.',
      },
      {
        q: 'Do I need to be online to receive netherite?',
        a: 'Yes – it is an item hand-off. Be on DonutSMP with your order username, accept the teleport from our delivery account and have inventory space ready. Money orders are the only ones that can reach an offline balance.',
      },
    ],
    productIds: ['netherite-block', 'netherite-ingot', 'ancient-debris', 'netherite-armor-set', 'pvp-kit', 'netherite-sword', 'netherite-pickaxe', 'value-investment-box'],
  },
];

export const landingBySlug: Record<string, LandingCopy> = Object.fromEntries(landingCopy.map((l) => [l.slug, l]));

export function findLanding(slug: string): LandingCopy | undefined {
  return landingBySlug[slug];
}
