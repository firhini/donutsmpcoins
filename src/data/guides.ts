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
/** guides touched by the November 2026 spawner/bundle repricing */
const REPRICED = '2026-11-02';
/** guides fact-checked against the post-June-2026 server state */
const FACTCHECKED = '2026-11-03';

const raw: GuideInput[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. How to get money on DonutSMP
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'how-to-get-money-on-donutsmp',
    title: 'How to Get Money on DonutSMP Fast (2026 Guide)',
    seoTitle: 'How to Get Money on DonutSMP Fast – 2026 Guide | {{store}}',
    metaDescription:
      'Legit ways to make money on DonutSMP – spawners, /sell and orders, auction flipping, base hunting – plus what buying DonutSMP money costs per 1M in 2026.',
    intro:
      'Money on DonutSMP buys the things that actually move you forward: spawners, god gear, netherite, a place on the balance top. This guide walks through the in-game methods that still work after the June 2026 update – spawners, selling with `/sell` and player orders, flipping the auction house and base hunting – with honest notes on how long each one takes. At the end we cover the shortcut: what buying DonutSMP money costs per million and how delivery works.',
    sections: [
      {
        heading: 'Why money matters on DonutSMP',
        paragraphs: [
          'DonutSMP is a semi-anarchy survival SMP with open PvP, no land claims and a player-driven economy. Almost everything you want is priced in in-game money: spawners from other players, netherite, elytras, totems. A player with a few hundred million can set up a farm in an evening; a player with nothing spends that evening mining.',
          'The methods below are ordered roughly from slowest-but-safest to fastest-but-riskiest. Most rich players use two or three of them at the same time, and every one of them gets easier once you have a little starting capital.',
        ],
      },
      {
        heading: 'Method 1: Spawner farms – the reliable grind',
        paragraphs: [
          'Spawners are the backbone of the DonutSMP economy, but they do not work like vanilla ones: no mobs spawn. A skeleton spawner fills an internal storage with bones and arrows, which you open like a chest and sell with `/sell` or into player orders for bones. One spawner’s output is pocket change; dozens stacked into a few blocks (sneak and right-click to stack) are a steady income with no kill room and no mob farm to build.',
          'Since the June 2026 update no new spawners enter the game – the server stopped selling them – so the only way to get one is from another player: a direct trade in-game, or a store like {{store}} where a [Skeleton Spawner](/product/skeleton-spawner) is $0.89 each and drops to $0.69 at 250+. We price it on what we see skellies trade for in our own deals – about 18M coins – but prices vary and public trackers often show different numbers. Iron golem spawners ($1.99) produce iron ingots, which sell well and never go out of fashion; blaze spawners ($0.89) produce blaze powder for brewing.',
          'The main cost is not the spawners – it is building a base that does not get found, because there are no claims to protect it. Keep the farm small at first, expand with the profit, and read our [spawners guide](/guides/donutsmp-spawners-guide) for the payback math.',
        ],
      },
      {
        heading: 'Method 2: Selling with /sell and player orders',
        paragraphs: [
          'DonutSMP buys common items through `/sell`, a drag-in menu that pays fixed server base prices – `/worth` shows the price of an item and `/sellhistory` your past sales. Sell multipliers were removed in June 2026 and base prices change with updates, so check `/worth` and the buy orders in `/orders` before you commit to anything. The principle stays the same: automate a farm for whatever currently pays best per hour of your time.',
          'Sugar cane, cactus, pumpkin and melon farms need no mobs and almost no attention. Villager-based setups (rotten flesh traded to cleric villagers, for example) turn junk into emeralds. The numbers per hour are lower than a big spawner room, but the startup cost is close to zero, which is why this is where most new players should begin.',
        ],
        list: [
          'Start with one crop farm that runs on its own and sell the output daily.',
          'Save up for a first skeleton spawner – in our own trading we see skellies go for around 18M, but prices vary, so check recent trades.',
          'Only build giant farms once you have a hidden base – a visible farm is a free farm for somebody else.',
        ],
      },
      {
        heading: 'Method 3: Auction house flipping',
        paragraphs: [
          'The auction house (`/ah`) is where impatient players sell to patient ones. People list netherite, elytras, shard tools and enchanted gear below market value because they want cash now. If you know the real value of items – and you will after a week of watching – you can buy low, relist, and keep the difference.',
          'Flipping scales with capital. With 5M you can flip a few cheap listings a day; with 200M you can clear out a whole category for an evening. It is also the method most exposed to risk: prices crash after big base raids, and a listing that looked cheap can sit unsold for days. Never put more than half your balance into flips.',
        ],
      },
      {
        heading: 'Method 4: Base hunting',
        paragraphs: [
          'Base hunting means finding other players’ bases and taking what is inside. It is the highest-variance method on the server: one loaded base can be worth more than a month of farming, and a hundred empty chunks are worth nothing. You need an elytra, stacks of rockets, totems and a lot of patience.',
          'It is also the method that makes you a target. Hunters get hunted, and the gear you bring is the gear you can lose. We cover routes, tools and the Shard Pickaxe (formerly the Amethyst Pickaxe) in the [base hunting guide](/guides/donutsmp-base-hunting-guide).',
        ],
      },
      {
        heading: 'Method 5: Just buy it – what DonutSMP money costs',
        paragraphs: [
          'Every method above costs time – anywhere from a few hours for a crop farm to weeks for a serious spawner setup. If you would rather spend the evening playing, buying DonutSMP money is the shortcut, and the prices are smaller than most people expect.',
          'At {{store}} the pick-your-amount option starts at **$0.05 per 1M** and drops automatically with volume: $0.04 from 100M and $0.03 from 1B. Fixed packs are a little cheaper for round amounts – a [50M pack](/product/50m-money) is $2.39 (just under $0.048 per million), [100M](/product/100m-money) is $3.79 and [1B](/product/1b-money) is $28.99. On top of that, carts over $15 get 5% off, over $40 get 8% and over $100 get 12%, and 5% of every delivered order comes back as store credit.',
          'Delivery is done by hand: a member of our staff logs in and runs `/pay` to the username on your order. {{eta}} There is no bot and no automation – slower in theory, more reliable in practice, because nothing breaks at 3am. You can follow the status on your order page.',
          'Two honest notes. DonutSMP’s rules prohibit trading in-game money for real currency; enforcement is the server’s decision, has included permanent bans and wipes, and buying is your own responsibility. And {{store}} is an independent player-run store, not affiliated with DonutSMP, Mojang or Microsoft.',
        ],
      },
      {
        heading: 'Which method fits you',
        paragraphs: [
          'Pick the row that sounds like you. The pattern is always the same: a small amount of money, invested in something that produces more money, compounds faster than any single grinding session.',
        ],
        list: [
          '**New player, no money:** crop farm plus `/sell` and orders, then your first skeleton spawners.',
          '**Some money, lots of time:** 32–64 spawners in a hidden base, emptying and selling their storage every day.',
          '**Some money, little time:** auction house flipping in the evenings.',
          '**Geared up and bored:** base hunting with an elytra and a friend on voice.',
          '**Want to skip the grind:** buy the spawners or the money directly, build the farm immediately and let it pay for itself.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the fastest legit way to get money on DonutSMP?',
        a: 'For most players it is skeleton spawners. Nothing else turns out sellable bones and arrows with so little effort – no mobs, no kill room, just open the storage and sell. Base hunting can be faster, but only on the sessions where you actually find something.',
      },
      {
        q: 'How much is 1M DonutSMP money worth in real money?',
        a: 'At {{store}} it is $0.05 for a single million and $0.03 per million at 1B on the flexible listing. Fixed packs are a little cheaper – a 100M pack works out to just under $0.038 per million and the 1B pack to about $0.029.',
      },
      {
        q: 'Can I get banned for buying DonutSMP money?',
        a: 'DonutSMP’s rules forbid real-money trading and the server can enforce that however it chooses – permanent bans and wipes have hit even top baltop players. We deliver with ordinary /pay commands and keep it discreet, but the risk is yours. Read the [safe buying guide](/guides/buying-donutsmp-money-safely) before you order anywhere.',
      },
      {
        q: 'Do I need to be online to receive money?',
        a: 'Usually not – a /pay reaches your balance either way – but we recommend being online so you see the confirmation in chat and can leave a review straight away.',
      },
    ],
    relatedProductIds: ['money-1m', 'money-50m', 'skeleton-spawner', 'starter-bundle'],
    relatedGuides: ['donutsmp-spawners-guide', 'buying-donutsmp-money-safely', 'donutsmp-base-hunting-guide'],
    updatedAt: FACTCHECKED,
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Spawners explained
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-spawners-guide',
    title: 'DonutSMP Spawners Explained: Skeleton, Iron Golem, Cow, Blaze & More',
    seoTitle: 'DonutSMP Spawners Guide – Types, Prices & Farms | {{store}}',
    metaDescription:
      'What every DonutSMP spawner produces, what it costs (skeleton spawners from $0.69 in bulk), how stacking works, payback math and safe placement.',
    intro:
      'Spawners are how money gets made on DonutSMP. Everything else – flipping, hunting, trading – moves money that somebody’s spawner farm created first. This guide explains what each spawner type actually produces, what it costs in our store, how the payback math works and where to put a farm so you get to keep it.',
    sections: [
      {
        heading: 'How spawners work on DonutSMP',
        paragraphs: [
          'DonutSMP spawners are not vanilla spawners. They **do not spawn mobs** – instead they generate the mob’s drops into an internal storage, which you open by right-clicking it like a chest. Sneak and right-click a placed spawner with another of the same type to stack them into one block. Output per stack has diminishing returns, so several separate stacks in different blocks beat one giant stack. Whether a stored-XP button exists and whether Silk Touch is needed to pick a spawner up are not confirmed by the community wikis – check in-game.',
          'Supply is what makes them an investment. Since the June 2026 update the server no longer sells spawners and no new ones enter the game, so every spawner changes hands between players – one fan wiki says they cannot be listed on `/ah`, so most deals are direct trades. DrDonut has declared Season 2 permanent, so a spawner you buy today keeps its resale value as long as nobody raids it. Money you spend on spawners is money you can get back; money you spend on rockets is gone.',
        ],
      },
      {
        heading: 'Skeleton spawners – the default choice',
        paragraphs: [
          'The skeleton spawner is the DonutSMP workhorse. It fills its storage with bones and arrows, and bones are in steady demand on `/orders`, so the output always sells. There is nothing to build: no dark room, no water streams, no kill chamber – a hidden room with your stacks and a chest is enough. Because almost every rich player owns skellies, there is always a buyer when you want to sell the spawners back.',
          'In our store a [Skeleton Spawner](/product/skeleton-spawner) is **$0.89** on its own, $0.84 from 25, $0.79 from 50, $0.74 from 100 and $0.69 from 250 spawners – in line with the roughly 18M coins we see skellies trade for in our own deals (prices vary, and public trackers often show different figures). A full 64-spawner room is $50.56 at the 50+ rate, or you can take the [Spawner Farm Bundle](/product/spawner-farm-bundle) – 64 skellies plus 10M for building materials – at $45.99.',
        ],
      },
      {
        heading: 'Iron golem spawners',
        paragraphs: [
          'An iron golem spawner fills its storage with iron ingots – no golems appear, so there is no 100-health mob to kill and no lava blade to build. Iron is the most useful bulk resource in the game – hoppers, rails, anvils, armor – and it sells consistently because other players always need it.',
          'An [Iron Golem Spawner](/product/iron-golem-spawner) is $1.99 each, $1.89 from 25 and $1.74 from 100, matching the roughly 41M coins we see in our own trading (prices vary). They also sit in the Elite Mystery Box and Legendary Crate pools if you prefer a gamble.',
        ],
      },
      {
        heading: 'Cow spawners – the premium pick',
        paragraphs: [
          'A cow spawner fills its storage with raw beef – **no leather**, according to the community wikis, so leather still has to come from a vanilla cow pen. Beef is a food supply you never have to think about again, and it sells through `/sell` and player orders. No cows spawn, so there is no pen, no lighting and no kill system to build.',
          'A [Cow Spawner](/product/cow-spawner) is one of the most sought-after spawners we trade – in our own deals it goes for around 100M coins, though prices vary – and costs $4.99 here, $4.69 from 10 and $4.39 from 50. It is also the epic line of the [Spawner Crate](/product/spawner-crate) and sits in the Legendary Crate pool.',
        ],
      },
      {
        heading: 'Blaze, creeper and zombie spawners',
        paragraphs: [
          '**Blaze spawners** ($0.89, $0.84 from 25) produce **blaze powder, not rods** – fuel for brewing stands, Strength potions and eyes of ender. Nothing spawns and nothing burns, so the spawner can sit in any room; the rod for a brewing stand itself still comes from a fortress blaze.',
          '**Creeper spawners** ($0.69, $0.65 from 25) are the gunpowder source every elytra user eventually wants. Gunpowder turns into firework rockets, and a base hunter burns through stacks of them per session. No creepers appear, so nothing explodes next to your storage.',
          '**Zombie spawners** ($0.39, $0.36 from 50) are the cheapest spawner we sell. They are not in the drop tables the community wikis agree on, so expect zombie loot – mostly rotten flesh – and check the storage in-game. Rotten flesh is nearly worthless to `/sell`, but cleric villagers trade it for emeralds.',
        ],
      },
      {
        heading: 'Payback math: when does a spawner pay for itself?',
        paragraphs: [
          'In real-money terms the comparison is simple, because our spawner prices follow the in-game value. A skeleton spawner is $0.89 and in our own trading a skelly goes for about 18M coins – and 18M money costs about the same at our $0.05 base rate. An iron golem spawner ($1.99) matches about 41M coins and a cow spawner ($4.99) around 100M in the same deals – prices vary, so treat these as our observations, not official values. Buying the spawner or buying the money to pay a player therefore costs roughly the same; the spawner has paid for itself once its drops have sold for more than its coin value – about 18M for a skelly. Whether that happens depends on sell prices and how long you keep the farm running.',
          'In in-game terms, compare what players currently pay for a spawner with what one spawner’s drops sell for per day through `/sell` or `/orders`. Base prices change with updates, so we will not quote one here; run a single spawner for a day, sell the output and divide its coin value by that number – the result is how many days it needs to earn itself back.',
        ],
        list: [
          'Open and empty the storage regularly, and check in-game what happens when it fills up – lost drops are lost money.',
          'Spread big counts over several stacks in separate blocks; one giant stack has diminishing returns. Whether you must stay nearby for spawners to produce is not documented, so test it.',
          'Sell output daily rather than hoarding; prices rarely go up by waiting.',
        ],
      },
      {
        heading: 'Where to place a spawner farm',
        paragraphs: [
          'The number one way players lose spawners is not nerfs – it is other players finding the base. There are no land claims, and bases near `/rtp` landing spots are usually found within days to weeks. Build far out, underground, and avoid straight tunnels that lead from the surface. Do not build directly under a surface structure you also use. Never share coordinates in public chat, even as a joke.',
          'If you want to skip the search entirely, the [Spawner Farm Bundle](/product/spawner-farm-bundle) ships 64 spawners and 10M at once, and our [base hunting guide](/guides/donutsmp-base-hunting-guide) explains exactly what hunters look for – read it, then build the opposite.',
        ],
      },
      {
        heading: 'Delivery of spawners',
        paragraphs: [
          'Spawners are handed over in-game by our staff: join DonutSMP with the username from your order, accept the teleport request from the delivery account and pick up the shulker. {{eta}} There is no bot. Have inventory space ready and be somewhere safe – nobody wants to receive 64 spawners in the middle of a crystal fight.',
          'As with everything on this site: DonutSMP’s rules prohibit real-money trading, enforcement is the server’s call, and {{store}} is not affiliated with DonutSMP or Mojang. Buy at your own discretion.',
        ],
      },
    ],
    faq: [
      {
        q: 'Which spawner makes the most money on DonutSMP?',
        a: 'Per spawner, skeleton and iron golem spawners are the most consistent earners because their drops always sell. Blaze spawners give blaze powder and are better for brewing than for raw cash.',
      },
      {
        q: 'How many skeleton spawners do I need for a good farm?',
        a: 'Anything from 16 upwards is a real farm. 64 is the classic room size, and from 50 spawners the bulk price drops to $0.79. Because output per stack has diminishing returns, spread large counts over several separate stacks.',
      },
      {
        q: 'Can spawners be stolen?',
        a: 'Yes. There are no land claims on DonutSMP, so anyone who finds your base can break and take them (whether Silk Touch is needed is not documented – assume it is no obstacle). Hidden base placement matters more than the spawner count.',
      },
      {
        q: 'Do you sell spawners in bulk?',
        a: 'Yes, up to 2,000 per line at the bulk rates above. For larger orders or spawner types not listed, ask on Discord for a quote.',
      },
    ],
    relatedProductIds: ['skeleton-spawner', 'iron-golem-spawner', 'blaze-spawner', 'spawner-farm-bundle'],
    relatedGuides: ['how-to-get-money-on-donutsmp', 'donutsmp-mystery-boxes-explained', 'donutsmp-base-hunting-guide'],
    updatedAt: FACTCHECKED,
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
          'DonutSMP’s rules prohibit trading in-game items, money or accounts for real-world value. Enforcement ranges from warnings to permanent bans and data wipes – several top baltop players have been banned for it – and it can change without notice. We cannot prevent it, insure against it or refund a delivered order because of it, and we do not pretend otherwise.',
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
          'Start small. A 10M order for $0.49 tells you more about a seller than a hundred vouches.',
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
    updatedAt: FACTCHECKED,
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Mystery boxes
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-mystery-boxes-explained',
    title: 'DonutSMP Mystery Boxes: Odds, Drops and Which Box to Buy',
    seoTitle: 'Which DonutSMP Mystery Box Should You Buy? | {{store}}',
    metaDescription:
      'Every DonutSMP mystery box at {{store}} explained: price, rolls, full drop pool, real Elytra odds – and why buying items directly is cheaper on average.',
    intro:
      'Mystery boxes are the only thing in our store where you do not know exactly what you get, so they are worth understanding before you buy one. This guide lists every box with its price, rolls and drop pool, explains how the odds are calculated and gives an honest view of when a box is a good deal and when buying the items directly is smarter.',
    sections: [
      {
        heading: 'How a box is rolled',
        paragraphs: [
          'Every box has a public drop table – click “What’s inside?” on any box – where each line has a **weight**. The chance of a line on a single roll is its weight divided by the total weight of the pool. A box with several drops draws its lines **without repeats**: once a line is drawn it is removed, so you never get the same line twice in one box.',
          'Lines marked guaranteed are always included and do not use up a roll. The quantity of an item is random within the range shown (2–4 zombie spawners, for example). Rolls happen on our server the moment you order, the result is written to your order page, and our staff hand over exactly what was rolled. There is no re-rolling and no staff discretion.',
          'Because rolls are drawn without repeats, the chance of seeing a specific line somewhere in the box is higher than the single-roll percentage. The per-box figures below come from simulating the exact roll logic our server uses.',
        ],
      },
      {
        heading: 'Money crates – Coin Crate $1.99 and Mega Coin Crate $9.99',
        paragraphs: [
          'The [Coin Crate](/product/coin-crate) is one money drop: 10M guaranteed, with 15M in about one crate in four, 25M in one in eight, 50M in one in 20, 100M in one in 25 and a 250M jackpot in roughly one in a hundred. The [Mega Coin Crate](/product/mega-coin-crate) is the big version: 60M guaranteed, 100M in about one crate in four, 200M in one in ten, 500M in one in 25 and a 1B jackpot in roughly one in a hundred.',
          'On average both pay far less than the same money bought as a [money pack](/donutsmp-money) – a Coin Crate averages about 21M (the 25M pack is $1.19) and a Mega Coin Crate about 110M (the 100M pack is $3.79). You pay for the chance of a big hit. They are a fun flutter, not a money strategy.',
        ],
      },
      {
        heading: 'Single-drop crates – Spawner, Netherite and Elytra',
        paragraphs: [
          'The [Spawner Crate](/product/spawner-crate) ($2.99) gives one spawner drop: 2–4 zombie spawners or a single skeleton spawner most of the time, creepers or a pair of skellies in about one crate in four, an iron golem spawner in about one in 12 and 2–3 blazes in about one in 20. The jackpots are a [Cow Spawner](/product/cow-spawner) in about one crate in 33 and 10 skeleton spawners in roughly one in a hundred.',
          'The [Netherite Crate](/product/netherite-crate) ($5.99) gives one netherite drop – debris, an ingot or a god sword usually, a full god armor set in about one crate in twelve and a netherite block in about one in 55. The [Elytra Crate](/product/elytra-crate) ($7.99) has the best Elytra odds per dollar: about **one crate in twelve** is an Elytra, the rest are totems, a god bow, a mace, a trident or a netherite armor set.',
        ],
      },
      {
        heading: 'Mystery Box – $3.99, 2 drops',
        paragraphs: [
          'The [Mystery Box](/product/mystery-box) draws two different lines from an 11-line pool. Gilded blackstone, a skeleton spawner, nether stars, golden apples, emerald ore and totems are the commons; a netherite ingot or 25M money show up in about one box in twenty, and a netherite block, dragon head or Elytra are rare jackpots (the Elytra is roughly one box in 200).',
        ],
      },
      {
        heading: 'Elite Mystery Box – $8.99, 2 drops',
        paragraphs: [
          'The [Elite Mystery Box](/product/elite-mystery-box) draws two lines from a stronger pool with bigger stacks: golden apples, emerald ore, iron golem spawners, heavy cores and gilded blackstone, with a netherite ingot in more than one box in five. 100M money (about one in 26), a netherite block, a dragon head and an Elytra (each roughly one in 70–100) are the jackpots.',
        ],
      },
      {
        heading: 'God Mystery Box – $19.99, 3 drops',
        paragraphs: [
          'The [God Mystery Box](/product/god-mystery-box) draws three of nine lines: blaze spawners, heavy cores, gilded blackstone, emerald ore and netherite ingots are the usual drops. 250M money and a netherite block each land in about one box in 19, an Elytra in about one in 22 and a dragon head in about one in 28.',
        ],
      },
      {
        heading: 'Legendary Crate – $34.99, 3 drops',
        paragraphs: [
          'The [Legendary Crate](/product/legendary-crate) draws three of eleven lines from our best pool – maces, god armor sets, iron golem and blaze spawners, totems, netherite ingots and a cow spawner (about one crate in six). It has the best jackpot odds in the shop: a netherite block in about one crate in ten, an Elytra in about one in eight, a dragon head in about one in 14 and 500M money in about one in 23.',
        ],
      },
      {
        heading: 'Which box should you buy?',
        paragraphs: [
          'Boxes are rolled server-side when you order and the result is on your order page as soon as your payment is confirmed – before anything is handed over. Delivery is the same as any item: our staff teleport to you in-game and drop the loot. {{eta}} DonutSMP’s rules on real-money trading apply to boxes like everything else, and {{store}} is not affiliated with the server. Be honest with yourself: on average every box pays out **less** than buying the same items directly – you pay for the fun and the chance of a big pull. With that said:',
        ],
        list: [
          '**Want something specific:** buy it directly. It is always cheaper on average.',
          '**Want a cheap Elytra shot:** Elytra Crate – about 1 in 12 for $7.99.',
          '**Want money with upside:** Coin Crate for fun, Mega Coin Crate for the 1B chance – a plain money pack is always cheaper per million.',
          '**Want variety on a small budget:** Mystery Box.',
          '**Want the best jackpot odds overall:** Legendary Crate.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can I get the same item twice from one box?',
        a: 'Not the same line – multi-drop boxes draw without repeats. Single-drop crates give exactly one item.',
      },
      {
        q: 'Are the odds really public?',
        a: 'Yes. Every box shows its full table with percentages under “What’s inside?”, and the weights are the same ones our server uses to roll. The per-box figures in this guide are simulated from that logic.',
      },
      {
        q: 'What is the cheapest way to try for an Elytra?',
        a: 'The Elytra Crate: about one crate in twelve is an Elytra for $7.99. If you want one for certain, the Elytra costs $28.49 on its own.',
      },
      {
        q: 'Can I choose what I get instead?',
        a: 'Yes – every item in the box pools is also sold individually or in a fixed kit. The investment boxes, for example, are fixed bundles with no randomness at all.',
      },
    ],
    relatedProductIds: ['elytra-crate', 'mystery-box', 'mega-coin-crate', 'legendary-crate'],
    relatedGuides: ['donutsmp-elytra-guide', 'donutsmp-spawners-guide', 'buying-donutsmp-money-safely'],
    updatedAt: REPRICED,
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
      'An Elytra changes how you play DonutSMP. Without one you walk, boat and nether-tunnel; with one, distant regions are a short flight away and base hunting becomes possible. This guide covers every way to get an Elytra on the server, what each route costs in time or money, which enchantments matter, how to keep it fueled with rockets and what players actually do once they have wings.',
    sections: [
      {
        heading: 'Why the Elytra matters on DonutSMP',
        paragraphs: [
          'DonutSMP’s world is big – the overworld border sits around ±225,000 blocks – and the valuable things – other players’ bases, untouched End cities, far-out spawner rooms – are far from the busy `/rtp` areas. An Elytra with a stack of rockets turns a two-hour trek into a short flight, and it is the only reliable way to leave a fight you are losing. It is also a status item: on a semi-anarchy server with open PvP, the player who can leave at will is the player who keeps their gear.',
          'That is why Elytras hold their value. They only come from the End, so the supply inside the border is finite; they rarely sit on the auction house for long, and fan trackers put them at several hundred million coins in autumn 2026.',
        ],
      },
      {
        heading: 'Route 1: End cities (free, slow, dangerous)',
        paragraphs: [
          'The vanilla way. On DonutSMP the End is hosted only on the NA East region; travel through a stronghold portal, find an End city with a ship, and take the Elytra from the item frame. On a busy public server the problem is not the shulkers – it is that every End city near the main island was looted months ago. Expect a long crossing over the void on end-stone bridges, several thousand blocks out, often alongside other players doing the same thing with worse intentions.',
          'If you do find one, bring shulker shells home too; a [shulker box](/product/shulker-box) is $0.29 in our store, which tells you roughly how players value them.',
        ],
      },
      {
        heading: 'Route 2: Auction house and player trades',
        paragraphs: [
          'Elytras appear on `/ah` and in trade channels fairly regularly, usually from base hunters who found more than one. In-game prices are high – it is the top investment item on the server – and you need to check durability and enchantments before buying. An unenchanted, half-broken Elytra is a very different item from a Mending one.',
        ],
      },
      {
        heading: 'Route 3: Mystery boxes',
        paragraphs: [
          'Several of our boxes have an Elytra in the pool. The [Elytra Crate](/product/elytra-crate) ($7.99) gives one in about every 12 crates, the [God Mystery Box](/product/god-mystery-box) ($19.99) about 1 in 22 and the [Legendary Crate](/product/legendary-crate) ($34.99) about 1 in 8 – still gambles compared with buying it directly. Full odds and how they are calculated are in the [mystery box guide](/guides/donutsmp-mystery-boxes-explained).',
          'A box is the right choice if you want loot anyway and an Elytra would be a bonus. If the wings are the only thing you want, read on.',
        ],
      },
      {
        heading: 'Route 4: Buy it – $28.49',
        paragraphs: [
          'The [Elytra](/product/elytra) in our store is **$28.49** (down from $29.99) and comes with **Unbreaking III and Mending** already applied – the two enchantments that matter, because together they mean you never have to repair it as long as you pick up XP. Up to 20 per order.',
          'It is also in two bundles: the [Pro Bundle](/product/pro-bundle) ($40.99) adds 50M and 16 skeleton spawners in one order and one handover, and the [Basehunter Bundle](/product/basehunter-bundle) ($33.99) pairs the Elytra with an Amethyst (Shard) Pickaxe, 16 totems and 20M in one order – everything you need to go hunting on day one.',
          'Delivery is in-game by our staff: join DonutSMP with the username on your order, accept the teleport and take the drop. {{eta}} No bot, no account access – and, as with everything we sell, DonutSMP’s rules prohibit real-money trading, so the decision and the risk are yours. {{store}} is not affiliated with DonutSMP or Mojang.',
        ],
      },
      {
        heading: 'Keeping it in the air: rockets and gunpowder',
        paragraphs: [
          'An Elytra without rockets is a glider. Firework rockets are paper plus gunpowder, and a serious session burns through a stack or two. The sustainable answer is a [Creeper Spawner](/product/creeper-spawner) ($0.69, $0.65 from 25) – it fills its storage with gunpowder without spawning a single creeper, and a small stack keeps you flying indefinitely. Paper comes from the sugar cane farm you probably already have.',
          'Carry rockets in two stacks across the hotbar and never fly on your last few – the walk home from 10,000 blocks out is not fun.',
        ],
      },
      {
        heading: 'What to do with an Elytra',
        paragraphs: ['Once you have wings, the server opens up:'],
        list: [
          '**Base hunting.** Fly low over the surface looking for lit areas, unnatural shapes, tree-less patches and nether portals. The [base hunting guide](/guides/donutsmp-base-hunting-guide) goes deeper.',
          '**Escaping fights.** Rocket straight up and away. In a fight you cannot win, this is worth more than any armor piece.',
          '**Reaching untouched End cities** and far nether fortresses for more loot.',
          '**Moving spawners and shulkers** between bases without a tunnel anyone can follow.',
          '**Selling it later.** An Elytra you no longer need sells fast on the auction house – it is one of the few purchases that is also an asset.',
        ],
      },
      {
        heading: 'Protecting the one you have',
        paragraphs: [
          'Keep Mending on it and keep your XP bar moving – a vanilla XP farm or a stack of bottles o’ enchanting takes care of that. Carry a [Totem of Undying](/product/totem-of-undying) ($0.25, $0.19 from 64) whenever you fly; most Elytra deaths are a rocket mistimed into a wall. And remember that your inventory drops on death: the Elytra is the first thing a killer picks up.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much does an Elytra cost on DonutSMP?',
        a: 'In our store, $28.49 with Unbreaking III and Mending. In-game prices move a lot – in our own trading an Elytra goes for around 700M coins (November 2026), fan trackers listed less a few months earlier – and they are usually the highest of any single item.',
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
        a: 'The box is cheaper ($19.99 vs $28.49), but it only contains an Elytra in about one box in 22 – the other drops are blaze spawners, heavy cores, netherite and the like. Buying the Elytra gives it with certainty. Pick based on whether you want the other loot.',
      },
    ],
    relatedProductIds: ['elytra', 'creeper-spawner', 'pro-bundle', 'basehunter-bundle'],
    relatedGuides: ['donutsmp-base-hunting-guide', 'donutsmp-mystery-boxes-explained', 'donutsmp-spawners-guide'],
    updatedAt: FACTCHECKED,
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Base hunting
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'donutsmp-base-hunting-guide',
    title: 'DonutSMP Base Hunting Guide: Shard Pickaxe, Elytra and Tactics',
    seoTitle: 'DonutSMP Base Hunting Guide – Gear & Tactics | {{store}}',
    metaDescription:
      'How base hunting works on DonutSMP: what hunters look for, the gear (Elytra, Shard Pickaxe, totems), honest odds and the Basehunter Bundle at $33.99.',
    intro:
      'Base hunting is the DonutSMP endgame for a lot of players: fly out, find somebody’s hidden base, and leave with their spawners, netherite and shulkers. It is also where most of the server’s drama comes from. This guide is an honest look at how hunting actually works – what you are looking for, the gear that makes a difference, the tactics that find bases, and the part nobody advertises: most sessions find nothing.',
    sections: [
      {
        heading: 'What base hunting is (and is not)',
        paragraphs: [
          'On DonutSMP players build bases in the wild and hide them, because raiding is part of the game. Base hunting is the search for those bases. It is allowed within the server’s rules – DonutSMP is a semi-anarchy survival server with open PvP and no land claims, and raiding and stealing are part of the culture – which is more than can be said for most of what people argue about on Discord.',
          'What it is not is reliable income. A loaded base can set you up for months; ten empty sessions in a row are normal. Treat it as a high-variance activity funded by your farm, not as the farm itself.',
        ],
      },
      {
        heading: 'The gear that matters',
        paragraphs: [
          'Six things separate a hunter from a tourist. If you want all of them at once, the [Basehunter Bundle](/product/basehunter-bundle) packages the Elytra, the Amethyst (Shard) Pickaxe, 16 totems and 20M for rockets and supplies in a single $33.99 order – the quickest way to go from zero to a first hunting session.',
        ],
        list: [
          '**Elytra with Mending** – non-negotiable. You will cover tens of thousands of blocks per session. Ours is $28.49 with Unbreaking III and Mending ([Elytra](/product/elytra)).',
          '**Rockets – a lot.** Two or three stacks per session. A creeper spawner farm is the long-term supply.',
          '**Shard Pickaxe** – the [DonutSMP custom pickaxe](/product/amethyst-pickaxe) ($4.79), formerly called the Amethyst Pickaxe and nicknamed “the drill”. It mines a 3×3 area at max-netherite speed, so you are in and out before the owner logs on. It carries a self-destruct timer (one day, according to the community wikis), so use it soon after you get it.',
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
          '**Nether portals.** A lone portal in the wild means somebody travels there. Follow the overworld side.',
          '**Straight lines.** Tunnels, cobblestone paths, water channels – nature does not make straight lines.',
          '**Signs of recent activity.** Harvested crops, trampled farmland, a boat left on a shore.',
          '**Nether tunnels.** Every block in the nether is eight in the overworld, and a long tunnel in the nether usually leads straight to a base entrance.',
        ],
      },
      {
        heading: 'Tactics once you find one',
        paragraphs: [
          'Do not rush in. Check the tab list for the owner and anyone who might be their friend. Enter from an unexpected side with the Shard Pickaxe rather than through their door. Take spawners first – they are the highest value per slot and the hardest to replace – then shulkers, then whatever netherite and totems are in chests.',
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
        a: 'The old name of the Shard Pickaxe (“the drill”): a custom DonutSMP pickaxe that mines 3×3 at max-netherite speed and self-destructs after a timer (one day per the community wikis). In-game it comes from the Shard Shop; it is $4.79 in our store and part of the Basehunter Bundle.',
      },
      {
        q: 'Is base hunting against the rules?',
        a: 'Raiding and griefing are part of DonutSMP’s survival gameplay. What is against the rules is cheating – x-ray, hacked clients, freecam, seed finding – which is also how most hunters who get banned got banned.',
      },
      {
        q: 'How far out are most bases?',
        a: 'Far enough that walking is impractical – the overworld border is around ±225,000 blocks, and bases near `/rtp` landing spots tend to be found within days or weeks. Grid-search in bands at increasing distance from the RTP areas rather than flying randomly.',
      },
      {
        q: 'What should I take first from a base?',
        a: 'Spawners – bring a Silk Touch pickaxe to be safe, since how they drop is not documented. They are the most valuable items per inventory slot and the ones the owner cannot easily replace.',
      },
    ],
    relatedProductIds: ['basehunter-bundle', 'amethyst-pickaxe', 'elytra', 'totem'],
    relatedGuides: ['donutsmp-elytra-guide', 'donutsmp-spawners-guide', 'how-to-get-money-on-donutsmp'],
    updatedAt: FACTCHECKED,
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
          'The price is far below every established store’s – a deal that looks too good to be real is bait.',
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
          'Prices are also published and tiered: 1M is $0.05 and falls to $0.03 per million at 1B, spawners are priced on what we see them trade for in-game (a skeleton spawner is $0.89, falling to $0.69 at 250+), and carts over $15, $40 and $100 get 5%, 8% and 12% off automatically.',
        ],
      },
      {
        heading: 'The rules reminder',
        paragraphs: [
          'None of this makes real-money trading allowed on DonutSMP. The server’s rules prohibit it, enforcement is at the server’s discretion and has included permanent bans and data wipes, and nobody – store or stranger – can promise you will not be punished. Buy only what you are willing to lose to a ban, keep it out of game chat, and understand that {{store}} is an independent store with no connection to DonutSMP, Mojang or Microsoft.',
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
    updatedAt: FACTCHECKED,
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
