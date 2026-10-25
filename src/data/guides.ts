/**
 * SEO guides (/guides and /guides/:slug). Pure data + tiny helpers, no React.
 *
 * Paragraph / list / FAQ strings support the same inline markup as the FAQ
 * (`renderRich` in components/shop/richText.tsx): **bold**, `code`,
 * [label](/internal-link) and the placeholders {{store}} and {{eta}} which the
 * GuidePage fills from the live PublicConfig.
 *
 * Every price, tier and drop weight below is taken from src/data/catalog.ts –
 * keep them in sync when the catalog changes.
 */

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  intro: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  relatedProductIds: string[];
  relatedGuides: string[];
  /** ISO date (YYYY-MM-DD) */
  updatedAt: string;
  readingMinutes: number;
}

type GuideInput = Omit<Guide, 'readingMinutes'>;

const UPDATED = '2026-10-11';

const raw: GuideInput[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. How to get money on DonutSMP
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'how-to-get-money-on-donutsmp',
    title: 'How to Get Money on DonutSMP Fast (2026 Guide)',
    seoTitle: 'How to Get Money on DonutSMP Fast – 2026 Guide | {{store}}',
    metaDescription:
      'Legit ways to make money on DonutSMP – spawner farms, shop selling, auction flipping, base hunting – plus what buying DonutSMP money costs per 1M in 2026.',
    intro:
      'Money on DonutSMP buys the things that actually move you forward: spawners, god gear, netherite, a place on the balance top. This guide walks through the in-game methods that still work in 2026 – spawner farms, selling to the shop, flipping the auction house and base hunting – with honest notes on how long each one takes. At the end we cover the shortcut: what buying DonutSMP money costs per million and how delivery works.',
    sections: [
      {
        heading: 'Why money matters on DonutSMP',
        paragraphs: [
          'DonutSMP is a lifesteal survival server with a player-driven economy. Almost everything you want is priced in in-game money: spawners on the auction house, netherite, totems, even hearts if you are trading with the right people. A player with a few hundred million can set up a farm in an evening; a player with nothing spends that evening mining.',
          'The methods below are ordered roughly from slowest-but-safest to fastest-but-riskiest. Most rich players use two or three of them at the same time, and every one of them gets easier once you have a little starting capital.',
        ],
      },
      {
        heading: 'Method 1: Spawner farms – the reliable grind',
        paragraphs: [
          'Spawner farms are the backbone of the DonutSMP economy. A skeleton spawner drops bones and arrows, both of which the server shop buys in bulk, and the XP is a welcome side effect for mending your gear. One spawner is pocket change; sixty-four spawners in a dark room with a water-and-hopper collection system is a steady income while you stand still.',
          'Spawners can be picked up with a silk touch pickaxe when you find them in dungeons and mineshafts, which is free but slow. The faster route is buying them: on the auction house in-game, or from a store like {{store}} where a [Skeleton Spawner](/product/skeleton-spawner) is $0.43 each and drops to $0.36 at 250+. Iron golem spawners ($0.45) produce iron, which sells well and never goes out of fashion; blaze spawners ($0.89) give rods for brewing and some of the best XP on the server.',
          'The main cost is not the spawners – it is building a base that does not get found. Keep the farm small at first, expand with the profit, and read our [spawners guide](/guides/donutsmp-spawners-guide) for the payback math.',
        ],
      },
      {
        heading: 'Method 2: Selling to the server shop',
        paragraphs: [
          'DonutSMP has a server shop that buys common items at a fixed rate. The sell prices change between seasons, so check `/shop` before you commit to anything, but the principle is always the same: automate a farm for whatever currently pays best per hour of your time.',
          'Sugar cane, cactus, pumpkin and melon farms need no mobs and almost no attention. Villager-based setups (rotten flesh from zombie spawners traded to clerics, for example) turn junk into emeralds. The numbers per hour are lower than a big spawner room, but the startup cost is close to zero, which is why this is where most new players should begin.',
        ],
        list: [
          'Start with one crop farm that runs on its own and sell the output daily.',
          'Reinvest the first few million into a handful of skeleton spawners.',
          'Only build giant farms once you have a hidden base – a visible farm is a free farm for somebody else.',
        ],
      },
      {
        heading: 'Method 3: Auction house flipping',
        paragraphs: [
          'The auction house (`/ah`) is where impatient players sell to patient ones. People list netherite, spawners, elytras and enchanted gear below market value because they want cash now. If you know the real value of items – and you will after a week of watching – you can buy low, relist, and keep the difference.',
          'Flipping scales with capital. With 5M you can flip a few cheap listings a day; with 200M you can clear out a whole category for an evening. It is also the method most exposed to risk: prices crash after big base raids, and a listing that looked cheap can sit unsold for days. Never put more than half your balance into flips.',
        ],
      },
      {
        heading: 'Method 4: Base hunting',
        paragraphs: [
          'Base hunting means finding other players’ bases and taking what is inside. It is the highest-variance method on the server: one loaded base can be worth more than a month of farming, and a hundred empty chunks are worth nothing. You need an elytra, stacks of rockets, totems and a lot of patience.',
          'It is also the method that makes you a target. Hunters get hunted, and the gear you bring is the gear you can lose. We cover routes, tools and the Amethyst Pickaxe in the [base hunting guide](/guides/donutsmp-base-hunting-guide).',
        ],
      },
      {
        heading: 'Method 5: Just buy it – what DonutSMP money costs',
        paragraphs: [
          'Every method above costs time – anywhere from a few hours for a crop farm to weeks for a serious spawner setup. If you would rather spend the evening playing, buying DonutSMP money is the shortcut, and the prices are smaller than most people expect.',
          'At {{store}} the pick-your-amount option starts at **$0.18 per 1M** and drops automatically with volume: $0.17 from 50M, $0.16 from 100M, $0.15 from 250M, $0.14 from 500M and $0.13 from 1B. Fixed packs are a little cheaper for round amounts – a [50M pack](/product/50m-money) is $7.49 (about $0.15 per million), [100M](/product/100m-money) is $13.99 and [1B](/product/1b-money) is $114.99. On top of that, carts over $15 get 5% off, over $40 get 8% and over $100 get 12%.',
          'Delivery is done by hand: a member of our staff logs in and runs `/pay` to the username on your order. {{eta}} There is no bot and no automation – slower in theory, more reliable in practice, because nothing breaks at 3am. You can follow the status on your order page.',
          'Two honest notes. DonutSMP’s rules prohibit trading in-game money for real currency; enforcement is the server’s decision and buying is your own responsibility. And {{store}} is an independent player-run store, not affiliated with DonutSMP, Mojang or Microsoft.',
        ],
      },
      {
        heading: 'Which method fits you',
        paragraphs: [
          'Pick the row that sounds like you. The pattern is always the same: a small amount of money, invested in something that produces more money, compounds faster than any single grinding session.',
        ],
        list: [
          '**New player, no money:** crop farm plus the server shop, then your first skeleton spawners.',
          '**Some money, lots of time:** a 32–64 spawner farm in a hidden base, selling output every day.',
          '**Some money, little time:** auction house flipping in the evenings.',
          '**Geared up and bored:** base hunting with an elytra and a friend on voice.',
          '**Want to skip the grind:** buy 25M–100M, build the farm immediately and let it pay for itself.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the fastest legit way to get money on DonutSMP?',
        a: 'For most players it is a skeleton spawner farm. Nothing else produces sellable items around the clock without you being there. Base hunting can be faster, but only on the sessions where you actually find something.',
      },
      {
        q: 'How much is 1M DonutSMP money worth in real money?',
        a: 'At {{store}} it is $0.18 for a single million and as low as $0.13 per million at 1B. Fixed packs land in between – a 100M pack works out to about $0.14 per million.',
      },
      {
        q: 'Can I get banned for buying DonutSMP money?',
        a: 'DonutSMP’s rules forbid real-money trading and the server can enforce that however it chooses. We deliver with ordinary /pay commands and keep it discreet, but the risk is yours. Read the [safe buying guide](/guides/buying-donutsmp-money-safely) before you order anywhere.',
      },
      {
        q: 'Do I need to be online to receive money?',
        a: 'Usually not – a /pay reaches your balance either way – but we recommend being online so you see the confirmation in chat and can leave a review straight away.',
      },
    ],
    relatedProductIds: ['money-1m', 'money-50m', 'skeleton-spawner', 'starter-bundle'],
    relatedGuides: ['donutsmp-spawners-guide', 'buying-donutsmp-money-safely', 'donutsmp-base-hunting-guide'],
    updatedAt: UPDATED,
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Spawners explained
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-spawners-guide',
    title: 'DonutSMP Spawners Explained: Skeleton, Iron Golem, Blaze & More',
    seoTitle: 'DonutSMP Spawners Guide – Types, Prices & Farms | {{store}}',
    metaDescription:
      'What every DonutSMP spawner produces, what it costs (skeleton spawners from $0.36 in bulk), payback math and where to place a farm so it does not get raided.',
    intro:
      'Spawners are how money gets made on DonutSMP. Everything else – flipping, hunting, trading – moves money that somebody’s spawner farm created first. This guide explains what each spawner type actually produces, what it costs in our store, how the payback math works and where to put a farm so you get to keep it.',
    sections: [
      {
        heading: 'How spawners work on DonutSMP',
        paragraphs: [
          'A spawner spawns its mob whenever a player is within range and the conditions are right – darkness for hostile mobs, space for golems. Mobs drop items when killed, and most of those items can be sold to the server shop or to other players. On DonutSMP spawners can be mined with a silk touch pickaxe, so they are a tradeable item: you can move them, stack them in one room and buy or sell them on the auction house.',
          'That last point is what makes them an investment rather than a grind. A spawner you buy today still has resale value next month, as long as the server has not reset. Money you spend on spawners is money you can get back; money you spend on rockets is gone.',
        ],
      },
      {
        heading: 'Skeleton spawners – the default choice',
        paragraphs: [
          'The skeleton spawner is the DonutSMP workhorse. Skeletons drop bones and arrows, both of which sell in bulk, and they give decent XP for mending gear. Farms are easy to build: a dark room, water streams pushing mobs into a kill chamber, hoppers into chests. Because almost every rich player runs a skelly farm, auction house prices are predictable and there is always a buyer when you want to sell the spawners back.',
          'In our store a [Skeleton Spawner](/product/skeleton-spawner) is **$0.43** on its own, $0.42 from 25, $0.40 from 50, $0.38 from 100 and $0.36 from 250 spawners. A full 64-spawner room is $25.60 at the 50+ rate, or you can take the [Spawner Farm Bundle](/product/spawner-farm-bundle) – 64 skellies plus 10M for building materials – at $25.99.',
        ],
      },
      {
        heading: 'Iron golem spawners',
        paragraphs: [
          'Iron golems drop iron ingots and the occasional poppy. Iron is the most useful bulk resource in the game – hoppers, rails, anvils, armor for alts – and it sells consistently because other players always need it. Golem farms need more space per spawner than skeleton farms and the kill mechanism has to handle a mob with 100 health points, so budget for a lava blade or a proper drop design.',
          'An [Iron Golem Spawner](/product/iron-golem-spawner) is $0.45 each, $0.43 from 25 and $0.40 from 100. They also sit in the Elite Mystery Box and Legendary Crate pools if you prefer a gamble.',
        ],
      },
      {
        heading: 'Blaze, creeper and zombie spawners',
        paragraphs: [
          '**Blaze spawners** ($0.89, $0.84 from 25) give blaze rods, which means blaze powder for brewing and eyes of ender, plus some of the best XP per kill on the server. Blazes set things on fire, so build the farm out of non-flammable blocks and keep your standing spot behind a wall.',
          '**Creeper spawners** ($0.69, $0.65 from 25) are the gunpowder source every elytra user eventually wants. Gunpowder turns into firework rockets, and a base hunter burns through stacks of them per session. Creepers need a room with no cats and a kill method that does not let them explode next to your hoppers.',
          '**Zombie spawners** ($0.39, $0.36 from 50) are the cheapest spawner we sell. Rotten flesh is nearly worthless to the shop but cleric villagers trade it for emeralds, and the XP is as good as a skeleton’s. If you want a cheap XP farm next to your enchanting setup, this is it.',
        ],
      },
      {
        heading: 'Payback math: when does a spawner pay for itself?',
        paragraphs: [
          'In real-money terms the question is simple: a skeleton spawner costs between $0.36 and $0.43, and 1M of in-game money costs $0.13 to $0.18. So one spawner is worth roughly 2.5M of bought money. If your farm sells for more than 2.5M per spawner over its lifetime – and a farm that runs for a few weeks does that comfortably – the spawner has paid for itself.',
          'In in-game terms, compare the auction house price of a spawner with what one spawner’s drops sell for per day in `/shop`. Sell prices change between seasons, so we will not quote one here; run a single spawner for a day, sell the output and multiply. Most players find that a well-built room pays back its spawner cost within one to two weeks of normal play.',
        ],
        list: [
          'Build the collection system before you place the spawners – lost drops are lost money.',
          'Stack spawners close together so a single standing spot keeps all of them active.',
          'Sell output daily rather than hoarding; prices rarely go up by waiting.',
        ],
      },
      {
        heading: 'Where to place a spawner farm',
        paragraphs: [
          'The number one way players lose spawner farms is not nerfs – it is other players finding the base. Build far from spawn, underground, and avoid straight tunnels that lead from the surface. Do not build directly under a surface structure you also use. Never share coordinates in public chat, even as a joke.',
          'If you want to skip the search entirely, the [Spawner Farm Bundle](/product/spawner-farm-bundle) ships 64 spawners and 10M at once, and our [base hunting guide](/guides/donutsmp-base-hunting-guide) explains exactly what hunters look for – read it, then build the opposite.',
        ],
      },
      {
        heading: 'Delivery of spawners',
        paragraphs: [
          'Spawners are handed over in-game by our staff: join DonutSMP with the username from your order, accept the teleport request from the delivery account and pick up the shulker. {{eta}} There is no bot. Have inventory space ready and be somewhere safe – nobody wants to receive 64 spawners in the middle of spawn.',
          'As with everything on this site: DonutSMP’s rules prohibit real-money trading, enforcement is the server’s call, and {{store}} is not affiliated with DonutSMP or Mojang. Buy at your own discretion.',
        ],
      },
    ],
    faq: [
      {
        q: 'Which spawner makes the most money on DonutSMP?',
        a: 'Per spawner, skeleton and iron golem spawners are the most consistent earners because their drops always sell. Blaze spawners are better for XP and brewing than for raw cash.',
      },
      {
        q: 'How many skeleton spawners do I need for a good farm?',
        a: 'Anything from 16 upwards is a real farm. 64 is the classic room size and the point where the bulk price drops to $0.40. Past 100–150 spawners, time spent standing at the farm becomes the bottleneck, not spawner count.',
      },
      {
        q: 'Can spawners be stolen?',
        a: 'Yes – anyone with a silk touch pickaxe who finds your base can mine them. Hidden base placement matters more than the spawner count.',
      },
      {
        q: 'Do you sell spawners in bulk?',
        a: 'Yes, up to 2,000 per line at the bulk rates above. For larger orders or spawner types not listed, ask on Discord for a quote.',
      },
    ],
    relatedProductIds: ['skeleton-spawner', 'iron-golem-spawner', 'blaze-spawner', 'spawner-farm-bundle'],
    relatedGuides: ['how-to-get-money-on-donutsmp', 'donutsmp-mystery-boxes-explained', 'donutsmp-base-hunting-guide'],
    updatedAt: UPDATED,
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Buying money safely
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'buying-donutsmp-money-safely',
    title: 'Is Buying DonutSMP Money Safe? Scams, Rules and How We Deliver',
    seoTitle: 'Is Buying DonutSMP Money Safe? Scams & Rules | {{store}}',
    metaDescription:
      'Before you buy DonutSMP money: the scams to avoid, what the server rules mean for you, and how a tracked order with manual staff delivery works at {{store}}.',
    intro:
      'Searching for “buy DonutSMP money” brings up dozens of Discord servers, marketplaces and stores, and some of them exist only to take your PayPal balance. This guide explains what actually goes wrong in real-money trades, what DonutSMP’s rules mean for you, and how our order flow is built so you can see every step – from order ID to the /pay in chat.',
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Buying DonutSMP money is safe from a scam point of view if you buy from a seller with stock, a record of your order and something to lose. It is never safe from a rules point of view: DonutSMP prohibits real-money trading, and only the server decides how to enforce that. Anyone who tells you otherwise is selling, not informing.',
          'The rest of this page deals with both halves separately, because they are different problems with different answers.',
        ],
      },
      {
        heading: 'The scams you will actually meet',
        paragraphs: ['Scams in the DonutSMP market are not clever. They work because the buyer wants the deal to be real. These are the patterns worth memorizing:'],
        list: [
          '**The vanishing seller.** You pay, the seller stops replying. Usually a fresh Discord account with copied vouches. Nothing to track, nothing to show anyone.',
          '**The impersonator.** Someone with the same name and avatar as a known store DMs you a “special price”. Real stores do not DM first and do not change their payment details mid-conversation.',
          '**The half delivery.** You get 10M of the 50M you paid for, then a story about stock. Splitting is fine when you agreed to it up front; surprise splits are the start of a disappearance.',
          '**The chargeback trap.** A seller asks you to pay Goods & Services “for your safety”, delivers, then claims you never paid. Or the reverse – a buyer charges back after delivery. Both make everyone in the market more suspicious.',
          '**The account grab.** A “delivery method” that needs your login, a session link or a mod download. Delivery is `/pay` or a teleport. Nothing else is ever required.',
        ],
      },
      {
        heading: 'The going-first problem',
        paragraphs: [
          'Every person-to-person trade has a moment where one side holds both the money and the goods. If you pay first, you trust the seller; if they deliver first, they trust you. Vouches are supposed to bridge that gap, but a vouch channel can be filled with alts in an afternoon, and middlemen add a third stranger rather than removing one.',
          'A store does not remove the going-first moment – you still pay before delivery – but it changes who you are trusting and what you hold while you wait. At {{store}} you hold an order ID, a timeline, your own payment reference and a published [refund policy](/refund-policy). A Discord DM gives you a screenshot.',
        ],
      },
      {
        heading: 'What DonutSMP’s rules say – and what that means for you',
        paragraphs: [
          'DonutSMP’s rules prohibit trading in-game items, money or accounts for real-world value. Enforcement can be anything from a warning to a balance reset or a ban, and it can change without notice. We cannot prevent it, insure against it or refund a delivered order because of it, and we do not pretend otherwise.',
          'What we do: deliver with ordinary player actions, spread deliveries across accounts and times, never mention the store or money in game chat, and ask you not to either. What we are not: affiliated with, endorsed by or connected to DonutSMP, Mojang or Microsoft in any way. Buying is your decision and your responsibility.',
        ],
      },
      {
        heading: 'How an order at {{store}} works, step by step',
        paragraphs: ['Here is the entire flow – nothing happens outside of it. Nobody is ever asked to DM, join a voice channel or install anything, and if someone claiming to be us asks for any of that, it is not us.'],
        list: [
          '**1. Cart and username.** Add money or items to the cart and enter your exact Minecraft username. We check it against Mojang so a typo is caught before you pay.',
          '**2. Order ID.** You get an order ID immediately, with the total locked in. Bookmark the order page – it is your record, and you can look it up any time at [/track](/track).',
          '**3. Payment.** Pay with the method you picked – PayPal Friends & Family, Litecoin, or whatever else is switched on at checkout – and put the order ID in the note where the method allows it.',
          '**4. Payment reference.** Paste the transaction ID or PayPal e-mail on your order page. That is what notifies our staff; a human checks it, there is no automated confirmation for manual methods.',
          '**5. Delivery.** A member of our staff logs into DonutSMP and runs `/pay` to your username, or teleports to you with the items. {{eta}} The order page switches to “delivered” and you can leave a review.',
        ],
      },
      {
        heading: 'How to protect yourself anywhere',
        paragraphs: ['These rules apply whether you buy from us, from another store or from a trader in a DM:'],
        list: [
          'Start small. A 10M order for $1.69 tells you more about a seller than a hundred vouches.',
          'Pay only to the details shown on the order page or the store’s own checkout – never to a “new address” sent in chat.',
          'Keep the order ID and payment reference until the order is delivered and you are happy.',
          'Use the Discord support channel for problems, quoting the order ID, rather than DMing whoever answers fastest.',
          'Read the refund policy before paying, not after.',
        ],
      },
      {
        heading: 'What a refund looks like',
        paragraphs: [
          'If we take a payment and cannot deliver – out of stock, staff unavailable for far longer than promised, a username that turns out not to exist – you get the money back, or store credit if you prefer. If we delivered to the username on the order, the order is complete: we cannot reverse a `/pay` and we cannot refund because of a later ban. The full wording is at [/refund-policy](/refund-policy).',
        ],
      },
    ],
    faq: [
      {
        q: 'Is it safe to buy DonutSMP money with PayPal Friends & Family?',
        a: 'It is the most common method because it has no fees and no holds, which is why prices can stay low. The trade-off is that Friends & Family cannot be charged back – so only use it with a seller that has an order record and a refund policy, like a store.',
      },
      {
        q: 'Why do you not deliver first?',
        a: 'Because chargebacks make it impossible for a store to deliver before payment. We keep the first step small instead: test us with a few million, then scale up.',
      },
      {
        q: 'Do you need my Minecraft password or account?',
        a: 'Never. Delivery is a /pay to your username or a teleport and item drop. Anyone asking for a password, session or launcher download is after your account.',
      },
      {
        q: 'My order still says awaiting payment after I paid – what now?',
        a: 'Make sure you submitted the payment reference on the order page – that is what alerts our staff. If it has been more than an hour, ping us on Discord with the order ID.',
      },
    ],
    relatedProductIds: ['money-10m', 'money-50m', 'money-100m', 'starter-bundle'],
    relatedGuides: ['donutsmp-irl-trading-discord', 'how-to-get-money-on-donutsmp', 'donutsmp-spawners-guide'],
    updatedAt: UPDATED,
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Mystery boxes
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-mystery-boxes-explained',
    title: 'DonutSMP Mystery Boxes: Odds, Drops and Which Box to Buy',
    seoTitle: 'Which DonutSMP Mystery Box Should You Buy? | {{store}}',
    metaDescription:
      'Every DonutSMP mystery box at {{store}} explained: price, rolls, full drop pool, real Elytra odds and whether the box beats buying the items directly.',
    intro:
      'Mystery boxes are the only thing in our store where you do not know exactly what you get, so they are worth understanding before you buy one. This guide lists every box with its price, rolls and drop pool, explains how the odds are calculated and gives an honest view of when a box is a good deal and when buying the items directly is smarter.',
    sections: [
      {
        heading: 'How a box is rolled',
        paragraphs: [
          'Every box has a public drop table – click “What’s inside?” on any box – where each line has a **weight**. The chance of a line on a single roll is its weight divided by the total weight of the pool. A box with three rolls draws three lines **without repeats**: once a line is drawn it is removed, so you never get the same line twice in one box.',
          'Lines marked guaranteed are always included and do not use up a roll. The quantity of an item is random within the range shown (1–32 netherite ingots, for example). Rolls happen on our server the moment you order, the result is written to your order page, and our staff hand over exactly what was rolled. There is no re-rolling and no staff discretion.',
          'Because rolls are drawn without repeats, the chance of seeing a specific line somewhere in the box is higher than the single-roll percentage. The per-box figures below come from simulating the exact roll logic our server uses.',
        ],
      },
      {
        heading: 'Coin Crate – $1.99, 1 roll, money only',
        paragraphs: [
          'The [Coin Crate](/product/coin-crate) is the simplest box: one roll, always money. 40% 5M, 30% 10M, 15% 15M, 9% 25M, 5% 50M and 1% 100M. The average payout works out to 13M.',
          '13M bought directly costs about $2.34 at the single-million rate, so the crate is roughly a fair price with a small premium for the 6% chance of 50M or more. It is a fun first purchase, not a money strategy – if you simply want money, the [money packs](/donutsmp-money) are cheaper per million.',
        ],
      },
      {
        heading: 'Spawner Crate – $2.99, 2 rolls',
        paragraphs: [
          'The [Spawner Crate](/product/spawner-crate) draws two lines from a spawner-only pool: 5–12 skeleton spawners (50% per roll), 13–24 skeleton spawners (20%), 4–10 zombie spawners (12%), 2–8 iron golem spawners (10%), 2–6 creeper spawners (5%) and 2–5 blaze spawners (3%). Across the two rolls, about 79% of crates contain the small skeleton line and roughly 8% contain blazes.',
          'Valued at our single-unit prices, the average crate holds more spawner value than it costs – around 16 skeleton spawners’ worth across both rolls. The catch is that you do not choose the type: if you specifically need golems or blazes, buy them directly.',
        ],
      },
      {
        heading: 'Mystery Box – $3.99, 3 rolls',
        paragraphs: [
          'The [Mystery Box](/product/mystery-box) is the general-purpose box with an 11-line pool: gilded blackstone, netherite ingots, a netherite block, skeleton spawners, dragon heads, enchanted golden apples, nether stars, deepslate emerald ore, totems, 10M money and an Elytra. The Elytra line carries 1 of 109 weight – about 0.9% per roll and roughly **3% per box**.',
          'Most boxes land on the common lines: around half contain gilded blackstone and just under half contain 1–15 skeleton spawners. Netherite ingots show up in about 38% of boxes, a netherite block in 18%, and the 10M money line in 15%. It is a good box if you like variety and a bad box if the only thing you want is the Elytra.',
        ],
      },
      {
        heading: 'Elite Mystery Box – $8.99, 4 rolls',
        paragraphs: [
          'The [Elite Mystery Box](/product/elite-mystery-box) drops the junk tiers and adds a fourth roll. The pool weights total 100, so the per-roll percentages read directly: Elytra 4%, netherite blocks 10%, netherite ingots 16%, gilded blackstone 16%, dragon heads 6%, nether stars 14%, enchanted golden apples 12%, emerald ore 10%, iron golem spawners 8% and 25M money 4%.',
          'Across four rolls without repeats, an Elytra appears in about **19% of boxes** and 25M money in another 19%. Netherite ingots or blocks turn up in most boxes. Compared with the $28.49 Elytra price, the Elite box is the cheapest way to take a real shot at one while getting useful items either way.',
        ],
      },
      {
        heading: 'God Mystery Box – $19.99, 5 rolls',
        paragraphs: [
          'The [God Mystery Box](/product/god-mystery-box) is where the Elytra becomes likely rather than lucky. The Elytra line holds 10 of 90 weight – 11% per roll – and with five rolls and no repeats it lands in roughly **55–60% of boxes**. The other lines are netherite blocks (1–5), gilded blackstone (16–128), emerald ore, netherite ingots (4–32), dragon heads (1–4), blaze spawners (2–6), 50M money and heavy cores.',
          'Every roll in this pool is something you would otherwise pay real money for – the cheapest line is a handful of emerald ore – so there is no dud outcome. The 50M money line shows up in about a third of boxes. At $19.99, one God box costs about the same as one Elytra bought directly; you trade certainty for four extra drops.',
        ],
      },
      {
        heading: 'Legendary Crate – $34.99, 2 guaranteed lines + 6 rolls',
        paragraphs: [
          'The [Legendary Crate](/product/legendary-crate) is the only box with guaranteed drops: an **Elytra and 50M money are always included**. The remaining six rolls come from a nine-line pool of dragon heads, netherite blocks, blaze spawners, iron golem spawners, heavy cores, totems, 100M money, a maxed netherite armor set and a mace. Because six of nine lines are drawn, you receive most of the pool every time.',
          'The 100M line has the lowest weight (4 of 100) and still appears in about a third of crates; a netherite armor set appears in more than half. The guaranteed Elytra and 50M alone list at $28.49 and $7.49, which is why this crate is priced the way it is.',
        ],
      },
      {
        heading: 'Which box should you buy?',
        paragraphs: [
          'Boxes are rolled server-side when you order and the result is on your order page as soon as your payment is confirmed – before anything is handed over. Delivery is the same as any item: our staff teleport to you in-game and drop the loot. {{eta}} DonutSMP’s rules on real-money trading apply to boxes like everything else, and {{store}} is not affiliated with the server. With that said, here is how we would choose:',
        ],
        list: [
          '**Want money, cheaply:** none of them – buy a money pack. The Coin Crate is for fun.',
          '**Want spawners and do not mind which:** Spawner Crate. Best average value per dollar in the store.',
          '**Want variety on a small budget:** Mystery Box.',
          '**Want a real Elytra chance under $15:** Elite Mystery Box (about 1 in 5).',
          '**Want an Elytra and a pile of loot:** God Mystery Box – or buy the [Elytra](/product/elytra) outright for $28.49 if you only want the wings.',
          '**Want everything guaranteed:** Legendary Crate.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can I get the same item twice from one box?',
        a: 'Not the same line – rolls are drawn without repeats. You can get similar items from different lines, for example netherite ingots and a netherite block in the same box.',
      },
      {
        q: 'Are the odds really public?',
        a: 'Yes. Every box shows its full table with percentages under “What’s inside?”, and the weights are the same ones our server uses to roll. The per-box figures in this guide are simulated from that logic.',
      },
      {
        q: 'What is the cheapest box with an Elytra chance?',
        a: 'The Mystery Box at $3.99, but at about 3% per box you would spend far more than the Elytra’s $28.49 price chasing it. The Elite box at $8.99 (about 19%) is the sensible gamble.',
      },
      {
        q: 'Can I choose what I get instead?',
        a: 'Yes – every item in the box pools is also sold individually or in a fixed kit. The investment boxes, for example, are fixed bundles with no randomness at all.',
      },
    ],
    relatedProductIds: ['mystery-box', 'elite-mystery-box', 'god-mystery-box', 'legendary-crate'],
    relatedGuides: ['donutsmp-elytra-guide', 'donutsmp-spawners-guide', 'buying-donutsmp-money-safely'],
    updatedAt: UPDATED,
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Elytra
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-elytra-guide',
    title: 'DonutSMP Elytra: How to Get One and What It Costs',
    seoTitle: 'DonutSMP Elytra Guide – How to Get One & Cost | {{store}}',
    metaDescription:
      'Every way to get an Elytra on DonutSMP – End cities, the auction house, mystery boxes or buying one for $28.49 – plus rockets, enchantments and base hunting.',
    intro:
      'An Elytra changes how you play DonutSMP. Without one you walk, boat and nether-tunnel; with one, the whole map is twenty minutes away and base hunting becomes possible. This guide covers every way to get an Elytra on the server, what each route costs in time or money, which enchantments matter, how to keep it fueled with rockets and what players actually do once they have wings.',
    sections: [
      {
        heading: 'Why the Elytra matters on DonutSMP',
        paragraphs: [
          'DonutSMP’s world is big and the valuable things – other players’ bases, untouched End cities, far-out spawner rooms – are far from spawn. An Elytra with a stack of rockets turns a two-hour trek into a short flight, and it is the only reliable way to leave a fight you are losing. It is also a status item: on a lifesteal server, the player who can leave at will is the player who keeps their hearts.',
          'That is why Elytras hold their value. They are rarely on the auction house for long and the price barely moves between seasons.',
        ],
      },
      {
        heading: 'Route 1: End cities (free, slow, dangerous)',
        paragraphs: [
          'The vanilla way. Kill the Ender Dragon or use an existing portal, find an End city with a ship, and take the Elytra from the item frame. On a busy public server the problem is not the shulkers – it is that every End city near the main island was looted months ago. Expect a long crossing over the void on end-stone bridges, several thousand blocks out, often alongside other players doing the same thing with worse intentions.',
          'If you do find one, bring shulker shells home too; a [shulker box](/product/shulker-box) is $0.29 in our store, which tells you roughly how players value them.',
        ],
      },
      {
        heading: 'Route 2: Auction house and player trades',
        paragraphs: [
          'Elytras appear on `/ah` and in trade channels fairly regularly, usually from base hunters who found more than one. In-game prices are high – it is one of the few items most players will pay a premium for – and you need to check durability and enchantments before buying. An unenchanted, half-broken Elytra is a very different item from a Mending one.',
        ],
      },
      {
        heading: 'Route 3: Mystery boxes',
        paragraphs: [
          'Several of our boxes have an Elytra in the pool. The [Elite Mystery Box](/product/elite-mystery-box) ($8.99) gives roughly a 19% chance per box, the [God Mystery Box](/product/god-mystery-box) ($19.99) about 55–60%, and the [Legendary Crate](/product/legendary-crate) ($34.99) includes one guaranteed alongside 50M and six more drops. Full odds and how they are calculated are in the [mystery box guide](/guides/donutsmp-mystery-boxes-explained).',
          'A box is the right choice if you want loot anyway and an Elytra would be a bonus. If the wings are the only thing you want, read on.',
        ],
      },
      {
        heading: 'Route 4: Buy it – $28.49',
        paragraphs: [
          'The [Elytra](/product/elytra) in our store is **$28.49** (down from $29.99) and comes with **Unbreaking III and Mending** already applied – the two enchantments that matter, because together they mean you never have to repair it as long as you pick up XP. Up to 20 per order.',
          'It is also in two bundles: the [Pro Bundle](/product/pro-bundle) ($40.99) adds 50M and 16 skeleton spawners and works out cheaper than buying the three separately, and the [Basehunter Bundle](/product/basehunter-bundle) ($37.99) pairs the Elytra with an Amethyst Pickaxe, 16 totems and 20M in one order – everything you need to go hunting on day one.',
          'Delivery is in-game by our staff: join DonutSMP with the username on your order, accept the teleport and take the drop. {{eta}} No bot, no account access – and, as with everything we sell, DonutSMP’s rules prohibit real-money trading, so the decision and the risk are yours. {{store}} is not affiliated with DonutSMP or Mojang.',
        ],
      },
      {
        heading: 'Keeping it in the air: rockets and gunpowder',
        paragraphs: [
          'An Elytra without rockets is a glider. Firework rockets are paper plus gunpowder, and a serious session burns through a stack or two. The sustainable answer is a [Creeper Spawner](/product/creeper-spawner) ($0.69, $0.65 from 25) – creepers drop gunpowder, and a small creeper farm keeps you flying indefinitely. Paper comes from the sugar cane farm you probably already have.',
          'Carry rockets in two stacks across the hotbar and never fly on your last few – the walk home from 10,000 blocks out is not fun.',
        ],
      },
      {
        heading: 'What to do with an Elytra',
        paragraphs: ['Once you have wings, the server opens up:'],
        list: [
          '**Base hunting.** Fly low over the surface looking for lit areas, unnatural shapes, tree-less patches and nether portals. The [base hunting guide](/guides/donutsmp-base-hunting-guide) goes deeper.',
          '**Escaping fights.** Rocket straight up and away. On a lifesteal server this is worth more hearts than any armor piece.',
          '**Reaching untouched End cities** and far nether fortresses for more loot.',
          '**Moving spawners and shulkers** between bases without a tunnel anyone can follow.',
          '**Selling it later.** An Elytra you no longer need sells fast on the auction house – it is one of the few purchases that is also an asset.',
        ],
      },
      {
        heading: 'Protecting the one you have',
        paragraphs: [
          'Keep Mending on it and keep your XP bar moving – the spawner farm you were going to build anyway takes care of that. Carry a [Totem of Undying](/product/totem-of-undying) ($0.25, $0.19 from 64) whenever you fly; most Elytra deaths are a rocket mistimed into a wall. And remember that your inventory drops on death: the Elytra is the first thing a killer picks up.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much does an Elytra cost on DonutSMP?',
        a: 'In our store, $28.49 with Unbreaking III and Mending. In-game prices on the auction house vary by season and are usually among the highest of any single item.',
      },
      {
        q: 'Is the Elytra enchanted?',
        a: 'Yes – Unbreaking III and Mending. You can add more yourself, but those two are the ones that keep it alive.',
      },
      {
        q: 'Can I lose it?',
        a: 'Yes. It drops on death like everything else in your inventory. Carry totems, keep Mending fed with XP, and avoid combat while flying.',
      },
      {
        q: 'What is cheaper – a God box or the Elytra?',
        a: 'They cost about the same ($19.99 vs $28.49). The box gives an Elytra in roughly 55–60% of cases plus four other drops; buying the Elytra gives it with certainty. Pick based on whether you want the other loot.',
      },
    ],
    relatedProductIds: ['elytra', 'creeper-spawner', 'pro-bundle', 'basehunter-bundle'],
    relatedGuides: ['donutsmp-base-hunting-guide', 'donutsmp-mystery-boxes-explained', 'donutsmp-spawners-guide'],
    updatedAt: UPDATED,
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Base hunting
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-base-hunting-guide',
    title: 'DonutSMP Base Hunting Guide: Amethyst Pickaxe, Elytra and Tactics',
    seoTitle: 'DonutSMP Base Hunting Guide – Gear & Tactics | {{store}}',
    metaDescription:
      'How base hunting works on DonutSMP: what hunters look for, the gear (Elytra, Amethyst Pickaxe, totems), honest odds and the Basehunter Bundle at $37.99.',
    intro:
      'Base hunting is the DonutSMP endgame for a lot of players: fly out, find somebody’s hidden base, and leave with their spawners, netherite and shulkers. It is also where most of the server’s drama comes from. This guide is an honest look at how hunting actually works – what you are looking for, the gear that makes a difference, the tactics that find bases, and the part nobody advertises: most sessions find nothing.',
    sections: [
      {
        heading: 'What base hunting is (and is not)',
        paragraphs: [
          'On DonutSMP players build bases in the wild and hide them, because raiding is part of the game. Base hunting is the search for those bases. It is allowed within the server’s rules – it is a survival server with PvP and griefing – which is more than can be said for most of what people argue about on Discord.',
          'What it is not is reliable income. A loaded base can set you up for a season; ten empty sessions in a row are normal. Treat it as a high-variance activity funded by your farm, not as the farm itself.',
        ],
      },
      {
        heading: 'The gear that matters',
        paragraphs: [
          'Six things separate a hunter from a tourist. If you want all of them at once, the [Basehunter Bundle](/product/basehunter-bundle) packages the Elytra, the Amethyst Pickaxe, 16 totems and 20M for rockets and supplies in a single $37.99 order – the quickest way to go from zero to a first hunting session.',
        ],
        list: [
          '**Elytra with Mending** – non-negotiable. You will cover tens of thousands of blocks per session. Ours is $28.49 with Unbreaking III and Mending ([Elytra](/product/elytra)).',
          '**Rockets – a lot.** Two or three stacks per session. A creeper spawner farm is the long-term supply.',
          '**Amethyst Pickaxe** – the [DonutSMP custom pickaxe](/product/amethyst-pickaxe) ($4.79) built for fast tunneling. When you find a base you want to be in and out before the owner logs on, and a normal maxed netherite pickaxe is slow by comparison.',
          '**Totems of Undying** – stack them. A hunter who dies loses the loot and the Elytra. $0.25 each, $0.19 from 64 ([Totems](/product/totem-of-undying)).',
          '**Shulker boxes** – empty, to carry what you find. $0.29 each, $0.25 from 27.',
          '**Decent armor** – a maxed [netherite set](/product/netherite-armor-set) ($4.99) or the [PvP Kit](/product/pvp-kit) ($8.49) if you expect a fight. Do not hunt in your best gear if you cannot afford to lose it.',
        ],
      },
      {
        heading: 'How hunters find bases',
        paragraphs: [
          'Bases are found because of what their owners leave on the surface. The amateur mistake is flying high and fast; good hunters fly low and slow in a grid, in one direction, and note the coordinates of anything suspicious to come back to later. Learn to spot these from the air:',
        ],
        list: [
          '**Light.** Torches, lanterns and glowstone in the middle of nowhere at night. Fly at night with brightness turned up.',
          '**Missing trees and broken terrain.** Players clear areas, take wood and dig straight down. A neat circle of missing trees is a flag.',
          '**Nether portals.** A portal far from spawn means somebody travels there. Follow the overworld side.',
          '**Straight lines.** Tunnels, cobblestone paths, water channels – nature does not make straight lines.',
          '**Signs of recent activity.** Harvested crops, trampled farmland, a boat left on a shore.',
          '**Nether tunnels.** Every block in the nether is eight in the overworld, and a long tunnel in the nether usually leads straight to a base entrance.',
        ],
      },
      {
        heading: 'Tactics once you find one',
        paragraphs: [
          'Do not rush in. Check the tab list for the owner and anyone who might be their friend. Enter from an unexpected side with the Amethyst Pickaxe rather than through their door. Take spawners first – they are the highest value per slot and the hardest to replace – then shulkers, then whatever netherite and totems are in chests.',
          'Load everything into shulkers as you go so a death does not scatter forty stacks on the floor. Leave the way you came, fly in a direction that is not toward your own base, and only head home after a detour. Players have lost their own base by flying straight back from a raid with a tail.',
        ],
      },
      {
        heading: 'Protecting your own base from hunters',
        paragraphs: [
          'Everything above works in reverse. Build underground with no surface light, no nearby portal, no cleared trees. Enter through a hidden water elevator or a piston door, never a straight tunnel. Keep your spawner room separate from your storage so one find does not cost you both. And never post coordinates, screenshots with coordinates, or a “come see my base” invite in public chat.',
        ],
      },
      {
        heading: 'The honest part: odds and cost',
        paragraphs: [
          'A full session – two hours of flying, two stacks of rockets, maybe a totem – has a real cost, and most sessions end with nothing but a few noted coordinates. The hunters who make money treat it like fishing: consistent routes, notes on everything, patience. If you are buying gear to hunt, buy it because you enjoy the search, not because a video showed a single lucky raid.',
          'Everything we sell for hunting is delivered in-game by our staff after payment. {{eta}} DonutSMP’s rules prohibit real-money trading, so the usual disclaimer applies: the risk of enforcement is yours, and {{store}} is not affiliated with the server or Mojang.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the Amethyst Pickaxe on DonutSMP?',
        a: 'A custom DonutSMP pickaxe that mines far faster than a standard maxed netherite pickaxe, which makes it the tool of choice for breaking into bases quickly. It is $4.79 in our store and part of the Basehunter Bundle.',
      },
      {
        q: 'Is base hunting against the rules?',
        a: 'Raiding and griefing are part of DonutSMP’s survival gameplay. What is against the rules is cheating – x-ray, hacked clients, freecam – which is also how most hunters who get banned got banned.',
      },
      {
        q: 'How far from spawn are most bases?',
        a: 'Far enough that walking is impractical – which is exactly why hunting needs an Elytra. Grid-search in bands at increasing distance from spawn rather than flying randomly.',
      },
      {
        q: 'What should I take first from a base?',
        a: 'Spawners, with a silk touch pickaxe. They are the most valuable items per inventory slot and the ones the owner cannot easily replace.',
      },
    ],
    relatedProductIds: ['basehunter-bundle', 'amethyst-pickaxe', 'elytra', 'totem'],
    relatedGuides: ['donutsmp-elytra-guide', 'donutsmp-spawners-guide', 'how-to-get-money-on-donutsmp'],
    updatedAt: UPDATED,
  },

  // ─────────────────────────────────────────────────────────────
  // 7. IRL trading on Discord
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-irl-trading-discord',
    title: 'DonutSMP IRL Trading on Discord: How to Not Get Scammed',
    seoTitle: 'IRL Trading on DonutSMP Discord – Stay Safe | {{store}}',
    metaDescription:
      'DonutSMP IRL trading on Discord: middleman myths, fake vouches, which payment methods protect you, and why a stocked store with order tracking is safer.',
    intro:
      'Most DonutSMP real-money trades happen in Discord: trading servers, DMs, “trusted seller” roles and vouch channels. It is where the deals are and where the scams are. This guide is about the Discord side specifically – what middlemen actually do, why vouches are weaker than they look, which payment methods protect which side, and the simple checks that keep your PayPal balance where it belongs.',
    sections: [
      {
        heading: 'How Discord IRL trading works',
        paragraphs: [
          'A typical trading server has a listings channel, a vouch channel and a middleman role. A buyer posts “buying 100M”, sellers DM with prices, the two agree on a method and someone goes first. The whole system runs on reputation, and reputation on Discord is a display name, a role and a list of messages – all of which can be created, bought or copied in an afternoon.',
          'This does not mean every trader is a scammer. Many are players with a surplus who want pocket money. It means the structure gives you nothing to fall back on when one of them is not.',
        ],
      },
      {
        heading: 'The middleman myth',
        paragraphs: [
          'A middleman holds the goods (or the money) while both sides complete their part. In theory it removes the going-first problem; in practice it adds a third stranger. The questions to ask: who chose the middleman, what stops them keeping both halves, and why does a “trusted” middleman charge a fee for something a store does for free with an order record?',
          'The most common middleman scam is the fake one: the seller’s friend joins the chat with an “MM” role copied from a real server, takes your payment to hold “in escrow”, and both accounts go quiet. If a seller insists on a middleman you did not pick, that is the moment to leave.',
        ],
      },
      {
        heading: 'Why vouches are not proof',
        paragraphs: [
          'Vouch channels fill up fast and look convincing. Then look closer: identical phrasing, accounts a week old, no order amounts, screenshots that could be from anyone. Real buying history is boring – different people, different dates, specific amounts, the occasional complaint that got resolved. A seller with 400 vouches and zero complaints is either a saint or writing their own.',
        ],
        list: [
          'Click the profiles of the people vouching. Account age and mutual servers tell you a lot.',
          'Ask someone who vouched to describe the amount and date of their trade. Scammers’ “customers” cannot.',
          'Remember that vouches are for the display name – the account behind it may have changed hands.',
        ],
      },
      {
        heading: 'Payment methods: who is protected by what',
        paragraphs: [
          'Every payment method protects one side more than the other, and traders exploit the gap. The pattern to notice: the methods strangers prefer are exactly the ones that leave you with no recourse, and that is not a coincidence.',
        ],
        list: [
          '**PayPal Friends & Family** – no fees, no holds, no chargebacks. Protects the seller completely and the buyer not at all. The default in this market, which is fine with a store that has an order record and useless with a stranger.',
          '**PayPal Goods & Services** – chargebacks possible. Protects the buyer, and a dishonest buyer can abuse it, which is why experienced sellers refuse it or add a fee.',
          '**Crypto (Litecoin, Bitcoin, USDT)** – irreversible, low fees, confirmed on the blockchain. Protects the seller; the buyer relies entirely on the seller’s reputation. Fine for stores, terrible with randoms.',
          '**Gift cards** – irreversible and untraceable. The payment method of choice for scammers. Only use them with a store that lists them officially, and expect a surcharge.',
          '**Card via Stripe or a similar checkout** – disputable, automatic confirmation. Only stores can offer it; nobody in a DM can.',
        ],
      },
      {
        heading: 'Red flags in a Discord trade',
        paragraphs: ['One of these is a reason to slow down. Two or more is a reason to leave:'],
        list: [
          'The seller DMed you first, especially right after you posted in a public channel.',
          'The price is far below everyone else’s – 100M for $5 does not exist.',
          'Payment details change during the conversation (“use this one instead, the other is limited”).',
          'They want the full amount up front for a large order but refuse to split the first delivery.',
          'Urgency: “only 5 minutes”, “someone else is buying”, “price goes up tonight”.',
          'Anything involving your Minecraft login, a session, a “trade plugin” or a download.',
        ],
      },
      {
        heading: 'Why a stocked store with order tracking is safer',
        paragraphs: [
          'A store is still a seller you pay first. The difference is structural. At {{store}} the money and items exist before you pay – stock levels on product pages are live. Every order has an ID, a locked price, a timeline and a payment reference you submitted yourself; you can open it at [/track](/track) any time without talking to anyone. Reviews can only be written from delivered orders and are tied to this domain rather than a Discord tag. And there is a published [refund policy](/refund-policy) that says what happens if we fail.',
          'Delivery is still done by real people – a staff member running `/pay` or teleporting to you with a shulker – but the record exists whether or not that person is online. {{eta}} If something goes wrong you have a page to show, not a DM thread with a deleted account.',
          'Prices are also simply lower than most Discord sellers once you include bulk tiers: 1M is $0.18 and falls to $0.13 per million at 1B, skeleton spawners are $0.43 falling to $0.36 at 250+, and carts over $15, $40 and $100 get 5%, 8% and 12% off automatically.',
        ],
      },
      {
        heading: 'The rules reminder',
        paragraphs: [
          'None of this makes real-money trading allowed on DonutSMP. The server’s rules prohibit it, enforcement is at the server’s discretion, and nobody – store or stranger – can promise you will not be punished. Buy only what you are willing to lose to a ban, keep it out of game chat, and understand that {{store}} is an independent store with no connection to DonutSMP, Mojang or Microsoft.',
        ],
      },
    ],
    faq: [
      {
        q: 'Should I use a middleman for a DonutSMP trade?',
        a: 'Only one you chose yourself from a server you trust, and even then you are adding a stranger. With a store you do not need one: the order record is the escrow.',
      },
      {
        q: 'What is the safest way to pay for DonutSMP money?',
        a: 'A disputable method at a store with an order record is the safest combination. Friends & Family or crypto are fine with a store that has a refund policy, and risky with anyone else.',
      },
      {
        q: 'Can I trust a seller with lots of vouches?',
        a: 'Vouches are a weak signal. Check the accounts behind them, ask for specifics and start with a small order no matter how many there are.',
      },
      {
        q: 'How do I know a message is really from {{store}}?',
        a: 'We never DM first and never ask you to pay anywhere except the details shown on your order page. If in doubt, open a ticket in our Discord and quote your order ID.',
      },
    ],
    relatedProductIds: ['money-1m', 'money-25m', 'skeleton-spawner', 'mystery-box'],
    relatedGuides: ['buying-donutsmp-money-safely', 'how-to-get-money-on-donutsmp', 'donutsmp-mystery-boxes-explained'],
    updatedAt: UPDATED,
  },
];

// ───────────────────────── helpers ─────────────────────────

/** Strip inline markup + placeholders so a string can be measured or shown as plain text. */
export function guidePlainText(text: string, vars: Record<string, string | number | undefined> = {}): string {
  return text
    .replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ''))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Words in intro + all section paragraphs and list items (FAQ excluded). */
export function guideWordCount(g: Pick<Guide, 'intro' | 'sections'>): number {
  const chunks = [g.intro, ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.list ?? [])])];
  return chunks.reduce((n, c) => n + guidePlainText(c).split(' ').filter(Boolean).length, 0);
}

/** Stable anchor id for a section heading ("Method 1: Spawner farms" → "method-1-spawner-farms"). */
export function sectionId(heading: string): string {
  return guidePlainText(heading)
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Short excerpt of the intro for cards / previews. */
export function guideExcerpt(g: Pick<Guide, 'intro'>, max = 150, vars?: Record<string, string | number | undefined>): string {
  const plain = guidePlainText(g.intro, vars);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 60)).replace(/[,;:–-]$/, '') + '…';
}

/** "2026-10-11" → "Oct 11, 2026" without timezone surprises. */
export function formatGuideDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const guides: Guide[] = raw.map((g) => ({ ...g, readingMinutes: Math.max(1, Math.round(guideWordCount(g) / 200)) }));

export function guideBySlug(slug: string | undefined): Guide | undefined {
  if (!slug) return undefined;
  return guides.find((g) => g.slug === slug.toLowerCase());
}
