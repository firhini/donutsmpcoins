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
      'Mystery boxes are the part of DonutCoins where luck is involved – but only the luck. Every box has a published drop table, the roll happens on our server when you order, and the result is on your order page before anything is handed over on DonutSMP. This page compares all six boxes, from the $1.99 Coin Crate to the $34.99 Legendary Crate, with prices, pools and the real chance of pulling an Elytra.',
    sections: [
      {
        heading: 'How a DonutSMP mystery box is rolled',
        paragraphs: [
          'Each line in a box\'s drop table has a weight. On a single roll, the chance of a line is its weight divided by the total weight of the pool – that is the percentage you see under **What\'s inside?** on every box page. Boxes with more than one roll draw without repeats, so a three-roll box always contains three different lines.',
          'Guaranteed lines are added before the random rolls, and the quantity within a line (for example 1–15 skeleton spawners) is rolled within the stated range. Nothing is re-rolled; the server records the result on your order the moment it is created.',
        ],
      },
      {
        heading: 'The six boxes at a glance',
        paragraphs: [
          '[Coin Crate](/product/coin-crate) – $1.99, one roll, money only: 5M (40%), 10M (30%), 15M (15%), 25M (9%), 50M (5%) or 100M (1%). The average payout is about 13M – a flutter, not a cheap way to buy money.',
          '[Spawner Crate](/product/spawner-crate) – $2.99, two rolls from a spawner-only pool: 5–12 or 13–24 skeleton spawners, 4–10 zombie, 2–8 iron golem, 2–6 creeper or 2–5 blaze spawners. About 79% of crates contain the 5–12 skeleton line and roughly 8% contain blazes.',
          '[Mystery Box](/product/mystery-box) – $3.99, three rolls from an eleven-line pool of gilded blackstone, netherite ingots and blocks, skeleton spawners, dragon heads, enchanted golden apples, nether stars, emerald ore, totems, 10M and an Elytra. [Elite Mystery Box](/product/elite-mystery-box) – $8.99, four rolls, Elytra at 4% per roll and 25M money in the pool. [God Mystery Box](/product/god-mystery-box) – $19.99, five rolls, Elytra at about 11% per roll, with 50M in the pool. [Legendary Crate](/product/legendary-crate) – $34.99, a guaranteed Elytra and 50M plus six more rolls from a nine-line pool.',
        ],
      },
      {
        heading: 'Elytra odds, box by box',
        paragraphs: [
          'Because multi-roll boxes draw without repeats, the chance of seeing a line somewhere in the box is higher than its per-roll percentage. Simulating the server\'s exact roll logic gives roughly these box-wide Elytra odds: Mystery Box about **3%**, Elite Mystery Box about **19%**, God Mystery Box about **58%** – a little better than a coin flip – and the Legendary Crate **100%**, since the Elytra is guaranteed. In short: $3.99 is a long shot, $8.99 a real chance, $19.99 better-than-even odds, and $34.99 certainty plus extras.',
        ],
      },
      {
        heading: 'Is a mystery box worth it?',
        paragraphs: [
          'Boxes are not a discount and we do not pretend they are: an [Elytra](/product/elytra) is $28.49 on its own, 1M is $0.18 or less, a netherite block $14.49. A box makes sense when you would be happy with most lines in its pool – true for the Elite, God and Legendary pools, where even the cheapest line is something players pay for.',
          'If you want a specific item, buy the item; if you enjoy the opening and would be happy with several outcomes, buy the box. The Coin Crate sits in between: every result is money, the floor is 5M and about 6% of crates pay 50M or more.',
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
    productIds: ['coin-crate', 'spawner-crate', 'mystery-box', 'elite-mystery-box', 'god-mystery-box', 'legendary-crate'],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Elytra
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-elytra',
    title: 'Buy a DonutSMP Elytra – Price, Enchantments and Delivery',
    seoTitle: 'Buy DonutSMP Elytra – Price, Odds & Delivery | DonutCoins',
    metaDescription:
      'DonutSMP Elytra (Unbreaking III + Mending) for $28.49, delivered in-game by staff. Why it costs so much, bundles and boxes with an Elytra, keeping yours.',
    intro:
      'An Elytra is the single most useful item on DonutSMP: it turns a base hunt from an hour of walking into five minutes of flying and makes escaping a fight possible at all. Ours comes with Unbreaking III and Mending for $28.49 and is handed over in-game by our staff. This page explains why the price is what it is, how delivery works, which bundles and boxes include an Elytra, and how to keep yours.',
    sections: [
      {
        heading: 'Why an Elytra costs what it costs on DonutSMP',
        paragraphs: [
          'Elytras only come from End cities, and on a server as old and as busy as DonutSMP the reachable End has been stripped bare. Finding an unlooted ship means flying thousands of blocks out in the End – which already requires an Elytra – or paying someone who did. That scarcity is why an Elytra trades for more than a stack of netherite ingots on the auction house, and why $28.49 is the most expensive single item in our store outside boxes and bundles.',
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
        heading: 'Cheaper routes: bundles and boxes',
        paragraphs: [
          'If you want more than the Elytra, two bundles include one at a lower combined price. The [Pro Bundle](/product/pro-bundle) ($40.99) adds 50M money and 16 skeleton spawners – bought separately that is about $42.86 – and the [Rich Bundle](/product/rich-bundle) ($79.99) comes with 250M, a God Mystery Box and the full PvP Kit for roughly $10 less than its parts. The [Basehunter Bundle](/product/basehunter-bundle) ($37.99) pairs an Elytra with the Amethyst Pickaxe, 16 totems and 20M – about $2.40 below the price of the single items.',
          'Random boxes are the gamble: the [Elite Mystery Box](/product/elite-mystery-box) ($8.99) contains an Elytra in roughly 19% of boxes, the [God Mystery Box](/product/god-mystery-box) ($19.99) in about 58%, and the [Legendary Crate](/product/legendary-crate) ($34.99) guarantees one alongside 50M and six more drops. For the Elytra alone, buying it outright at $28.49 is the better deal; the boxes pay off only if you value the other lines.',
        ],
      },
      {
        heading: 'Keeping your Elytra',
        paragraphs: [
          'Three habits keep an Elytra alive on a lifesteal server. First, Mending only works while the Elytra is equipped and you gain XP, so a quick lap past your skeleton farm after every flight keeps it topped up – an Elytra that breaks is a chestplate slot with no armor. Second, carry at least a stack of rockets and a totem; most Elytra losses are deaths mid-air, not durability. Third, store it in an Ender Chest when you are at your base and not flying, so a surprise raid does not take it.',
          '[Creeper spawners](/product/creeper-spawner) ($0.69, $0.65 at 25+) are the long-term rocket supply most Elytra owners end up buying. As with everything we sell, DonutSMP\'s rules prohibit real-money trading – we deliver through normal gameplay and keep it discreet, but the risk is yours.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much is an Elytra on DonutSMP?',
        a: 'In our store $28.49, with Unbreaking III and Mending included. Auction-house prices in-game move with every season; ours follows them and is fixed for your order once you check out.',
      },
      {
        q: 'Does the Elytra come enchanted?',
        a: 'Yes – Unbreaking III and Mending, unused, full durability. If you want a different enchantment setup, ask on Discord before ordering.',
      },
      {
        q: 'Do I have to be online to receive it?',
        a: 'Yes. An Elytra is an item, so you accept a teleport from our delivery account on DonutSMP and pick up the drop. Have a free inventory slot and be somewhere safe – your base rather than spawn.',
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
    title: 'DonutSMP Skeleton Spawner Price: $0.36–$0.43 and What a Farm Needs',
    seoTitle: 'DonutSMP Skeleton Spawner Price – from $0.36 | DonutCoins',
    metaDescription:
      'Skeleton spawners for DonutSMP at $0.43 each, $0.36 at 250+. Every bulk tier, how many spawners a farm needs, what they produce and how delivery works.',
    intro:
      'The skeleton spawner – "skelly" to anyone who has played DonutSMP for a week – is the item most players buy first and buy most of. This page gives the current prices with every bulk tier, explains why skeleton farms are the server\'s default income, helps you work out how many spawners you actually need, and describes how a hundred spawners are handed over in-game by our staff.',
    sections: [
      {
        heading: 'Current skeleton spawner prices',
        paragraphs: [
          'A [skeleton spawner](/product/skeleton-spawner) is **$0.43** at DonutCoins. Bulk tiers apply automatically per line: $0.42 each from 25 spawners, $0.40 from 50, $0.38 from 100 and $0.36 from 250, up to 2,000 per line. The tier price applies to every spawner in the line, so 100 spawners cost $38.00, not a blend of rates.',
          'On top of the tiers, the cart-wide spending discount takes 5% off orders over $15, 8% over $40 and 12% over $100. A 64-spawner order is $25.60 at the 50+ tier and $24.32 after the 5% discount; 250 spawners are $90.00 and $82.80 after 8%.',
        ],
      },
      {
        heading: 'Why skeleton spawners are the DonutSMP default',
        paragraphs: [
          'Skeletons need nothing but darkness. They drop bones, arrows and the occasional bow; bones and arrows sell to the server shop in bulk, and the XP keeps Mending gear repaired. A skeleton farm is also the easiest spawner room to build: a dark box, water streams pushing mobs into a kill chamber, hoppers into chests.',
          'Because nearly every established player runs one, skeleton spawners are the most liquid item on the auction house – there is always a buyer when you want to sell spawners back, and the price is predictable. [Iron golem spawners](/product/iron-golem-spawner) ($0.45) earn more when iron sells well and [blaze spawners](/product/blaze-spawner) ($0.89) give better XP, but the skelly is the safe default.',
        ],
      },
      {
        heading: 'How many spawners do you need?',
        paragraphs: [
          'A handful of spawners is a hobby; a room full of them is an income. Most players start at 15–25 spawners, which fits one compact room and pays for its own expansion within a week or two of normal play. 64 spawners – one stack, the Spawner Farm Bundle size – is the classic serious farm. Above 100, the limit is usually the kill chamber and hopper throughput, not the spawner count.',
          'Server shop sell prices change between seasons, so we will not quote a per-hour income here. Run a single spawner for a day, sell what it produces, and multiply – that number tells you whether the next tier is worth it faster than any guide.',
        ],
      },
      {
        heading: 'Delivery: how 100 spawners reach you',
        paragraphs: [
          'Spawners are items, so they are handed over, not paid. After you pay and report the reference, join DonutSMP with the exact username from your order and accept the teleport request from our delivery account. Larger orders arrive in shulker boxes, so bring inventory space and pick a safe spot; your base is better than spawn. A member of our staff does this by hand, usually within 5–30 minutes while we are online.',
          'DonutSMP\'s rules prohibit real-money trading; we deliver through normal gameplay and keep it discreet, but the risk is yours. Spawners can be mined back with a silk touch pickaxe on DonutSMP, which also means a found farm can be taken – hide it well.',
        ],
      },
      {
        heading: 'Alternatives: crates and bundles',
        paragraphs: [
          'The [Spawner Crate](/product/spawner-crate) ($2.99) rolls two spawner lines and contains skeleton spawners in about 79% of crates – 5–12 on the common line, 13–24 on the uncommon one. The [Starter Bundle](/product/starter-bundle) ($9.49) packs 15 skeleton spawners with 20M and a Diamond Armor Shulker, and the [Spawner Farm Bundle](/product/spawner-farm-bundle) ($25.99) is 64 skeleton spawners plus 10M in one order. For odd quantities or more than 2,000 spawners, message us on Discord for a quote.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much do 64 skeleton spawners cost?',
        a: '$25.60 at the 50+ tier of $0.40 each, or $24.32 after the automatic 5% discount for carts over $15. The Spawner Farm Bundle offers the same 64 spawners with 10M money for $25.99.',
      },
      {
        q: 'Can I move skeleton spawners after placing them?',
        a: 'Yes – they are normal spawner items, and on DonutSMP a silk touch pickaxe picks them up again. That is also why spawners are tradeable on the auction house.',
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
    productIds: ['skeleton-spawner', 'spawner-crate', 'spawner-farm-bundle', 'starter-bundle', 'iron-golem-spawner', 'blaze-spawner'],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Money prices
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-money-prices',
    title: 'DonutSMP Money Prices: What 1M to 1B Costs Right Now',
    seoTitle: 'DonutSMP Money Prices – 1M to 1B Compared | DonutCoins',
    metaDescription:
      'DonutSMP money price list: $0.18 per 1M for any amount, bulk tiers to $0.13, packs from 10M ($1.69) to 1B ($114.99), discounts, coupons. Paid with /pay.',
    intro:
      'This is the full price list for DonutSMP money at DonutCoins: the pick-your-amount rate with every bulk tier, the fixed packs from 10M to 1B, the discounts that stack on top, and worked examples so you can see what a given amount actually costs. Prices are in USD and come from the same catalog as the checkout. Money is paid to your in-game balance with /pay by our staff, usually within minutes.',
    sections: [
      {
        heading: 'Pick-your-amount rates',
        paragraphs: [
          'The flexible [money product](/product/donutsmp-money) charges per million: **$0.18 per 1M** for any amount, $0.17 from 50M, $0.16 from 100M, $0.15 from 250M, $0.14 from 500M and $0.13 from 1B, up to 5B in one line. The tier applies to the whole line – 100M costs 100 × $0.16 = $16.00, not a blend. This is the right choice for odd amounts such as 37M ($6.66) or 120M ($19.20).',
        ],
      },
      {
        heading: 'Fixed packs: the cheapest per million',
        paragraphs: [
          'At round numbers the fixed packs beat the flexible rate: [10M](/product/10m-money) for $1.69 (about $0.17 per 1M), [25M](/product/25m-money) for $3.99 ($0.16), [50M](/product/50m-money) for $7.49 ($0.15), [100M](/product/100m-money) for $13.99 ($0.14), [250M](/product/250m-money) for $32.99 ($0.13), [500M](/product/500m-money) for $61.99 ($0.124) and [1B](/product/1b-money) for $114.99 ($0.115). The 100M pack, for example, is $2.01 cheaper than 100 flexible millions.',
          'Packs can be combined: 250M + 50M as two packs is $40.48, and because that cart is over $40 it gets 8% off, landing at $37.24 for 300M.',
        ],
      },
      {
        heading: 'Discounts that stack',
        paragraphs: [
          'Three layers come off automatically or with a code. **Spending tiers:** 5% off carts over $15, 8% over $40, 12% over $100, applied to the whole cart. **One coupon per order:** the welcome code when it is enabled, a [daily spin](/spin) prize of 5–25% (the bigger ones carry a minimum order) or a review reward; alternatively a referral link gives a new customer 5%. **Store credit** from referrals or spin wins is applied last. The total discount is capped at 60%.',
        ],
      },
      {
        heading: 'Worked examples',
        paragraphs: [
          '50M: the pack is $7.49 – under the $15 threshold, so no tier discount; with a 5% welcome coupon $7.12. 250M: $32.99, 5% tier → $31.34, about $0.125 per million. 500M: $61.99, 8% tier → $57.03. 1B: $114.99, 12% tier → $101.19, about $0.10 per million; a 10% spin coupon on top of that brings it to $91.07.',
          'All examples use the default settings; a sale banner or changed tiers would show at checkout, and the cart always displays the exact total before you pay.',
        ],
      },
      {
        heading: 'Why the price changes and what is locked',
        paragraphs: [
          'DonutSMP money is player-earned, so its real-world price follows the in-game economy: it drops when farms get cheaper or the server shop pays more, and spikes for a few days after a reset when everyone is broke. We also keep a reserve so orders ship immediately, and a very large order can nudge the price until the reserve is rebuilt. The price you see at checkout is locked for that order.',
          'Delivery is manual – a member of our staff runs `/pay` to the username on your order, usually within 5–30 minutes while we are online, and big amounts can be split over several payments on request. DonutSMP\'s rules prohibit real-money trading, so buying is your own responsibility; DonutCoins is not affiliated with DonutSMP or Mojang.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is there anything cheaper than the 1B pack?',
        a: 'Not in the store – $114.99 for 1B is the lowest per-million price, and the 12% spending discount brings it to $101.19. For amounts beyond that, message us on Discord for a custom quote.',
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
      'Netherite is DonutSMP\'s hard currency: ingots and blocks hold value between seasons, and the god armor and tools made from it are what you fight in. DonutCoins sells the raw material – ancient debris, ingots and blocks – and the finished gear, all handed over in-game by our staff. This page lists the prices, explains when to buy blocks instead of ingots, and shows which kits and boxes include netherite.',
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
          'Ancient debris is for players who like smelting: four debris become four scrap, which with four gold ingots make one netherite ingot. At the 32+ tier that is $2.08 of debris per ingot plus your gold – cheaper than the $2.89 bulk ingot, and debris is also the item people hoard for the next season.',
        ],
      },
      {
        heading: 'Netherite gear: armor and tools',
        paragraphs: [
          'The finished gear is where netherite actually pays off on a lifesteal server. The $4.99 god set is a full suit with Protection IV, Unbreaking III, Mending and Thorns III; the [PvP Kit](/product/pvp-kit) ($8.49) adds a Sharpness V, Fire Aspect II, Looting III sword, an Efficiency V, Fortune III pickaxe and 8 totems. Crafting a set yourself costs four ingots – $13.16 at the single price, or 16 debris plus gold – before you have enchanted anything, which is why most of our netherite sales are gear rather than ingots.',
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
          'Netherite is handed over in-game: after you pay and report the reference, join DonutSMP with the username on your order, accept the teleport from our delivery account and pick up the drop – shulkered for larger orders. Our staff do this manually, usually within 5–30 minutes while online. Netherite does not burn, but it can be looted: keep blocks in an Ender Chest or a claimed, hidden base.',
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
