/**
 * SEO product copy – ORIGINAL English text for every product in catalog.ts.
 *
 * Keyed by product id. Prices, bulk tiers, box contents and odds quoted here
 * mirror the DEFAULT catalog (src/data/catalog.ts) and the default spending
 * tiers in settings.ts ($15 → 5%, $40 → 8%, $100 → 12%). If the admin
 * changes a price, update the matching entry here as well.
 *
 * Honesty rules baked into the copy: delivery is manual by our staff (no bot),
 * usually within 5–30 minutes while online; the store is not affiliated with
 * DonutSMP or Mojang; DonutSMP's rules prohibit real-money trading and buying
 * is the customer's own responsibility. No fake stats, no fake reviews.
 *
 * `description` paragraphs are separated by "\n\n".
 */

export interface ProductCopy {
  /** <title> – aim for ≤ 60 characters */
  seoTitle: string;
  /** meta description – 120–155 characters */
  metaDescription: string;
  /** 2–3 short paragraphs separated by \n\n (90–160 words) */
  description: string;
  /** 3–5 short selling points */
  bullets: string[];
  /** 2–3 product-specific questions (also usable as FAQPage JSON-LD) */
  faq: { q: string; a: string }[];
}

export const productCopy: Record<string, ProductCopy> = {
  // ───────────── MONEY ─────────────
  'money-1m': {
    seoTitle: 'DonutSMP Money – Any Amount, $0.13–0.18 per 1M | DonutCoins',
    metaDescription:
      'Buy DonutSMP money at $0.18 per million, dropping to $0.13 per 1M on bulk orders. Pick any amount; staff pay it to your balance with /pay within minutes.',
    description:
      'This is the flexible way to buy DonutSMP money: the quantity you enter is the number of millions, so 50 means 50M and 1000 means 1B. The base rate is $0.18 per 1M and bulk tiers kick in automatically – $0.17 from 50M, $0.16 from 100M, $0.15 from 250M, $0.14 from 500M and $0.13 from 1B. The lower rate applies to every million in the line, not just the ones above the threshold.\n\n' +
      'Money is what moves on DonutSMP. It buys spawners from other players, pays claim costs, funds shop slots and settles the odd ransom. Earning a few hundred million by hand takes days of farming; ordering it takes a couple of minutes.',
    bullets: [
      'Any amount from 1M to 5B in a single line',
      'Bulk tiers from $0.17 down to $0.13 per 1M',
      'Paid straight to your balance with /pay',
      'No bot, no password – a real person delivers',
      'Price locked at checkout, even if rates move',
    ],
    faq: [
      {
        q: 'How is DonutSMP money delivered?',
        a: 'By hand, through the server\'s /pay command. Our staff send the amount to the exact Minecraft username on your order; you do not need to meet anyone or accept a teleport. Stay online if you want to watch the confirmation in chat.',
      },
      {
        q: 'Is pick-your-amount cheaper than the fixed packs?',
        a: 'For round amounts the fixed packs are slightly cheaper (50M is $7.49 as a pack versus $8.50 here at the 50M tier). For odd amounts like 37M or 320M this listing is the better deal, because the bulk tier applies to every million.',
      },
      {
        q: 'Can I get banned for buying DonutSMP money?',
        a: 'DonutSMP\'s rules prohibit real-money trading and enforcement is the server\'s call, so buying is your own responsibility. We deliver with ordinary player actions, keep it discreet and never ask for your account details. DonutCoins is not affiliated with DonutSMP or Mojang.',
      },
    ],
  },

  'money-10m': {
    seoTitle: 'Buy 10M DonutSMP Money – $1.69 | DonutCoins',
    metaDescription:
      '10M DonutSMP money for $1.69 – about $0.17 per million, under the base rate. Paid to your balance with /pay by our staff, usually within minutes.',
    description:
      'The 10M Money Pack is the cheapest way to try DonutCoins. For $1.69 you get ten million DonutSMP coins, which works out to roughly $0.17 per 1M – a little under the $0.18 base rate of the pick-your-amount listing, where 10M would cost $1.80.\n\n' +
      'Ten million is a sensible first order: enough for a handful of skeleton spawners from the player market, a few claim blocks or a start on a shop, and small enough to test how fast we deliver before you commit to a bigger pack.\n\n' +
      'After payment, one of our staff sends the 10M to your username with /pay – usually within 5–30 minutes while we are online. No teleport, no meeting point; the money simply lands on your balance and the order page updates to delivered.',
    bullets: [
      '10,000,000 DonutSMP money for $1.69',
      'About $0.17 per 1M – below the base rate',
      'Delivered via /pay to your exact username',
      'Ideal first order to test our delivery',
    ],
    faq: [
      {
        q: 'How long does a 10M order take?',
        a: 'Small money orders are the quickest thing we deliver. Once your payment is confirmed, expect the /pay within 5–30 minutes whenever our staff are online; the Discord status shows if someone is on.',
      },
      {
        q: 'Can I buy several 10M packs at once?',
        a: 'Yes. Two 10M packs cost $3.38, though the 25M pack at $3.99 gives you more money for only a little extra. For sizes in between, use the pick-your-amount listing.',
      },
    ],
  },

  'money-25m': {
    seoTitle: 'Buy 25M DonutSMP Money – $3.99 | DonutCoins',
    metaDescription:
      '25M DonutSMP money for $3.99 – under $0.16 per million, 11% below the base rate. Enough for a first spawner farm. Delivered by /pay within minutes.',
    description:
      'Twenty-five million DonutSMP money for $3.99 comes to just under $0.16 per 1M. Buying the same amount at the $0.18 base rate would be $4.50, so the pack saves you about 11% without needing to reach a bulk tier.\n\n' +
      '25M is the amount most players spend setting up their first real income: a row of skeleton spawners, hoppers and chests, plus a cushion for claims. It is also a common ask in player trades, which makes it a convenient pack to have ready.\n\n' +
      'Staff deliver by hand with /pay to the username on your order, typically within 5–30 minutes while we are online. There is nothing to pick up – the balance update and the server\'s chat confirmation are your receipt, and the order page shows the delivered status.',
    bullets: [
      '25,000,000 DonutSMP money for $3.99',
      'Under $0.16 per 1M – 11% below base rate',
      'Enough to fund a first spawner farm',
      'Hand-delivered with /pay, no teleport needed',
    ],
    faq: [
      {
        q: 'Is 25M enough to start a spawner farm on DonutSMP?',
        a: 'For a modest one, yes. Player prices for spawners vary, but 25M usually covers a handful of skeleton spawners plus hoppers and chests. If you want the spawners themselves, our Skeleton Spawner listing starts at $0.43 each.',
      },
      {
        q: 'Do I need to be online to receive 25M?',
        a: 'Usually not – /pay normally reaches an offline balance – but we recommend being online so you can see the confirmation in chat and report any issue right away.',
      },
    ],
  },

  'money-50m': {
    seoTitle: 'Buy 50M DonutSMP Money – $7.49 | DonutCoins',
    metaDescription:
      '50M DonutSMP money for $7.49 – about $0.15 per million, 17% below the base rate. Our most popular pack, paid to your balance with /pay within minutes.',
    description:
      'The 50M Money Pack is the sweet spot for most DonutSMP players: $7.49 for fifty million, which is roughly $0.15 per 1M. At the $0.18 base rate the same amount would cost $9.00, and even the 50M bulk tier on pick-your-amount comes to $8.50, so this pack is the cheapest way to get exactly 50M.\n\n' +
      'Fifty million is enough to go from fresh spawn to a working base: spawners, a claim, an elytra from a player shop and change left over for armor. It is the amount we recommend to anyone who wants a real head start rather than a top-up.\n\n' +
      'Like every money order, it is delivered manually by our staff with /pay to the username you enter at checkout, usually within 5–30 minutes while we are online. The order page updates to delivered as soon as the payment has gone through in-game.',
    bullets: [
      '50,000,000 DonutSMP money for $7.49',
      'About $0.15 per 1M – cheaper than the 50M bulk tier',
      'Our most popular money pack',
      'Delivered to your balance by /pay',
    ],
    faq: [
      {
        q: 'Why is the 50M pack cheaper than 50 × 1M?',
        a: 'Fixed packs are our round-number deals. The pick-your-amount listing charges $0.17 per 1M at the 50M tier ($8.50), while this pack is $7.49. For odd amounts the flexible listing still wins because its tiers apply to every million.',
      },
      {
        q: 'Can you split 50M across two usernames?',
        a: 'No – money goes to the single username on the order. If you want to fund an alt as well, place a second order under that name.',
      },
      {
        q: 'What happens if the rate changes after I order?',
        a: 'Nothing. The price you pay at checkout is locked; later changes to the catalog do not affect a paid order.',
      },
    ],
  },

  'money-100m': {
    seoTitle: 'Buy 100M DonutSMP Money – $13.99 | DonutCoins',
    metaDescription:
      '100M DonutSMP money for $13.99 – $0.14 per million, 22% below the base rate. Hand-delivered to your balance with /pay by staff, usually within minutes.',
    description:
      'One hundred million DonutSMP money for $13.99 works out to $0.14 per 1M – 22% less than the $0.18 base rate, where 100M would be $18.00. It also beats the 100M bulk tier of the flexible listing ($0.16 per 1M, or $16.00), so if you want a round hundred, this is the pack to pick.\n\n' +
      '100M changes how you play. It covers a full spawner farm with room to expand, a maxed netherite set from a player shop and a comfortable reserve for claims and trades, and it puts you on the /baltop radar without weeks of grinding.',
    bullets: [
      '100,000,000 DonutSMP money for $13.99',
      '$0.14 per 1M – 22% below the base rate',
      'Beats the flexible listing\'s 100M tier ($16.00)',
      'Paid to your balance with /pay by real staff',
      'Add a Mace ($1.49) and the cart passes $15 for 5% off',
    ],
    faq: [
      {
        q: 'How is 100M DonutSMP money delivered?',
        a: 'Through /pay, by one of our staff, to the exact username on the order. You can be online to watch it arrive, but the payment normally goes through even if you are offline. The order page shows the delivered status afterwards.',
      },
      {
        q: 'Is 100M safe to receive in one go?',
        a: 'Technically yes – /pay handles it fine. If you prefer to stay under the radar we can send it in two or three portions; just say so in the order note or on Discord. Keep in mind DonutSMP\'s rules forbid real-money trading, so buying is at your own risk.',
      },
      {
        q: 'Do spending discounts apply to this pack?',
        a: 'Carts of $15 or more get 5% off automatically, $40 gets 8% and $100 gets 12% (default tiers). On its own this pack is just under the first threshold; adding any small item pushes it over.',
      },
    ],
  },

  'money-250m': {
    seoTitle: 'Buy 250M DonutSMP Money – $32.99 | DonutCoins',
    metaDescription:
      '250M DonutSMP money for $32.99 – about $0.13 per million, 27% below the base rate. Delivered by staff with /pay, split into discreet portions on request.',
    description:
      'A quarter billion DonutSMP money for $32.99 is roughly $0.13 per 1M. The same 250M would be $45.00 at the base rate and $37.50 on the flexible listing\'s 250M tier, so the pack saves you between $4.50 and $12 depending on what you compare it to.\n\n' +
      '250M is where the economy opens up: buying out a player\'s spawner stock, flipping items in /ah, funding a group base or simply sitting near the top of the balance board. It also pushes a single order past the $15 spending threshold, so 5% comes off automatically at checkout.\n\n' +
      'Our staff deliver it manually with /pay to your username – usually within 5–30 minutes while we are online. Amounts this size are often sent in two or three payments to keep the transfer discreet; every step shows on your order page, and the total is always the full 250M.',
    bullets: [
      '250,000,000 DonutSMP money for $32.99',
      'About $0.13 per 1M – 27% below the base rate',
      'Automatically earns the 5% spending discount',
      'Delivered by /pay, split on request',
    ],
    faq: [
      {
        q: 'Will 250M arrive as one payment?',
        a: 'Often two or three. Staff decide based on how busy the server is and what keeps the transfer discreet; the order page lists each payment, and you always receive the full amount.',
      },
      {
        q: 'How much does the 250M pack cost after discounts?',
        a: 'With the default 5% spending discount on carts of $15+, 250M on its own comes to about $31.34 before any coupon. A welcome or spin coupon can stack on top (one coupon per order).',
      },
      {
        q: 'Is buying this much DonutSMP money risky?',
        a: 'The server\'s rules prohibit real-money trading, and the decision to buy is yours. We use ordinary /pay transfers from established accounts, never advertise in-game and never need your login.',
      },
    ],
  },

  'money-500m': {
    seoTitle: 'Buy 500M DonutSMP Money – $61.99 | DonutCoins',
    metaDescription:
      '500M DonutSMP money for $61.99 – about $0.12 per million, 31% below the base rate. Delivered manually with /pay in discreet portions by our staff.',
    description:
      'Half a billion DonutSMP money for $61.99 comes to about $0.12 per 1M – 31% below the $0.18 base rate (where 500M is $90.00) and well under the flexible listing\'s 500M tier of $70.00. At this size the order also qualifies for the 8% spending discount on carts of $40 or more.\n\n' +
      'Players buy 500M to skip the grind entirely: a fully stocked base, a spawner farm that prints money on its own, maxed gear for the whole group and a balance that holds its own in any trade. It is also the pack shop owners use to restock.',
    bullets: [
      '500,000,000 DonutSMP money for $61.99',
      'About $0.12 per 1M – 31% below the base rate',
      'Qualifies for the 8% spending discount ($40+)',
      'Sent in discreet portions by real staff',
      'Delivery schedule of your choice',
    ],
    faq: [
      {
        q: 'How is 500M delivered on DonutSMP?',
        a: 'By hand with /pay, usually in several payments rather than one lump. You do not need to be online, but we suggest being around for the first transfer so you can confirm it landed.',
      },
      {
        q: 'What is the final price with the spending discount?',
        a: 'With the default 8% tier applied to carts of $40 or more, 500M comes to roughly $57.03 before any coupon. Store credit from referrals can be applied on top.',
      },
      {
        q: 'Can I pay for 500M with crypto?',
        a: 'Yes – Litecoin is enabled by default and other coins when switched on. Send the exact amount shown at checkout and paste the transaction hash on your order page; we confirm after the network does.',
      },
    ],
  },

  'money-1b': {
    seoTitle: 'Buy 1B DonutSMP Money – $114.99 | DonutCoins',
    metaDescription:
      'One billion DonutSMP money for $114.99 – about $0.115 per million, 36% below the base rate, plus the 12% spending discount. Hand-delivered by staff.',
    description:
      'One billion DonutSMP money – 1,000,000,000 – for $114.99. That is about $0.115 per 1M, 36% under the $0.18 base rate (1B would be $180.00 there) and cheaper than the flexible listing\'s top tier of $0.13, which prices 1B at $130.00. Carts of $100 or more also get the 12% spending discount.\n\n' +
      'A billion is the whale pack. It is bought by players who want to dominate the balance board in one go, by groups pooling money for a mega-base, and by shop owners who need deep liquidity to buy up spawners and rare items at scale.',
    bullets: [
      '1,000,000,000 DonutSMP money for $114.99',
      'About $0.115 per 1M – our lowest rate',
      '12% spending discount applies automatically',
      'Delivered in multiple /pay transfers by staff',
      'Custom delivery schedule on request',
    ],
    faq: [
      {
        q: 'How is 1B DonutSMP money delivered?',
        a: 'In several /pay transfers from our staff accounts to the username on your order. We can send everything in one sitting or spread it over days – tell us in the order note or on Discord. The order page tracks each transfer.',
      },
      {
        q: 'What does 1B cost after the spending discount?',
        a: 'With the default 12% tier for carts of $100+, the pack comes to about $101.19 before coupons. That is roughly $0.10 per million.',
      },
      {
        q: 'Need more than 1B?',
        a: 'Order several packs, or message us on Discord – we quote custom prices for very large or regular orders.',
      },
    ],
  },

  // ───────────── SPAWNERS & ITEMS ─────────────
  'skeleton-spawner': {
    seoTitle: 'DonutSMP Skeleton Spawner – $0.43 each | DonutCoins',
    metaDescription:
      'Buy DonutSMP skeleton spawners for $0.43 each, down to $0.36 at 250+. Bones, arrows and XP on autopilot. Handed over in-game by staff within minutes.',
    description:
      'The skeleton spawner – the \'skelly\' – is the backbone of the DonutSMP economy. Skeletons drop bones and arrows that sell for steady money, and a stacked spawner room is one of the best XP sources on the server. Our skeleton spawner price starts at $0.43 each and drops with quantity: $0.42 from 25, $0.40 from 50, $0.38 from 100 and $0.36 from 250, up to 2,000 per line.\n\n' +
      'Players buy skellies to build or expand a farm without spending days hunting for naturally generated spawners or overpaying in /ah. A row of 64 is a common starting goal; serious farms run several hundred.\n\n' +
      'Spawners are physical items, so delivery happens in-game: join DonutSMP with the username on your order, accept the teleport from our delivery account and pick up the drop – bigger orders come packed in shulker boxes. Staff usually hand over within 5–30 minutes while online.',
    bullets: [
      '$0.43 each, down to $0.36 at 250+',
      'Up to 2,000 spawners per line',
      'Bones, arrows and XP that sell for steady money',
      'Handed over in-game, shulkered for big orders',
    ],
    faq: [
      {
        q: 'What is the DonutSMP skeleton spawner price right now?',
        a: '$0.43 each at single quantity. Bulk tiers apply automatically: 25+ at $0.42, 50+ at $0.40, 100+ at $0.38 and 250+ at $0.36 per spawner. A full stack of 64 costs $25.60.',
      },
      {
        q: 'How are spawners delivered?',
        a: 'By hand. Be online on DonutSMP with the order username, accept the teleport request from our staff account and collect the items. Keep inventory space free – large orders arrive in shulker boxes.',
      },
      {
        q: 'Do you sell a spawner-only bundle?',
        a: 'Yes – the Spawner Farm Bundle has 64 skeleton spawners plus 10M for $25.99, and the Spawner Crate rolls two random spawner drops for $2.99.',
      },
    ],
  },

  'iron-golem-spawner': {
    seoTitle: 'DonutSMP Iron Golem Spawner – $0.45 | DonutCoins',
    metaDescription:
      'Iron golem spawners for DonutSMP at $0.45 each – $0.43 from 25, $0.40 from 100. Iron ingots and poppies on autopilot, delivered in-game by our staff.',
    description:
      'Iron golem spawners turn a dark room into an iron factory. Each golem drops iron ingots and poppies, and because iron sells reliably and is used for everything from hoppers to anvils, a golem farm is one of the most dependable earners on DonutSMP. Price: $0.45 each, $0.43 from 25 and $0.40 from 100, up to 2,000 per line.\n\n' +
      'Many players run golems next to their skeleton farm so the money keeps coming while they are off hunting bases. Golems are tough, so the kill area needs to be built right – but once it is, the output is hard to match with any manual method.',
    bullets: [
      '$0.45 each, $0.40 at 100+',
      'Iron ingots and poppies that always sell',
      'Pairs well with a skeleton farm',
      'Delivered in-game by staff, shulkered for bulk',
    ],
    faq: [
      {
        q: 'Iron golem or skeleton spawner – which earns more?',
        a: 'Skeletons are cheaper and give XP; golems produce iron, which holds its sell value well. Most players run both. If you are starting out, grab skellies first and add golems once your farm is set up.',
      },
      {
        q: 'How many golem spawners do I need for a real farm?',
        a: 'Even 8–16 produce a noticeable stream of iron. The bulk tier at 25 brings the price to $0.43, and 100 or more cost $0.40 each.',
      },
    ],
  },

  'zombie-spawner': {
    seoTitle: 'DonutSMP Zombie Spawner – $0.39 each | DonutCoins',
    metaDescription:
      'Zombie spawners for DonutSMP at $0.39 each, $0.36 from 50. Cheap XP and rotten flesh for cleric trades. Handed over in-game by our staff within minutes.',
    description:
      'The zombie spawner is the budget XP machine. At $0.39 each – $0.36 from 50 – it is the cheapest spawner in our DonutSMP shop, and zombies are easy to farm with a simple drop-and-kill setup. Rotten flesh feeds cleric villagers for emeralds, and the occasional iron ingot, carrot and potato come as a bonus.\n\n' +
      'Zombie farms are the usual first step for new players who want enchanting XP without buying bottles, and a cheap way to bulk out an existing spawner room. Up to 2,000 per line if you want a wall of them.\n\n' +
      'Spawners are delivered in-game by our staff: be online on DonutSMP with the username on your order, accept the teleport request and collect the items. Large orders arrive in shulker boxes. Usually within 5–30 minutes while we are online.',
    bullets: [
      'Cheapest spawner: $0.39, $0.36 at 50+',
      'Fast XP and rotten flesh for villager trades',
      'Simple to farm – no special kill chamber',
      'In-game handover by staff',
    ],
    faq: [
      {
        q: 'Why buy zombie spawners instead of skeletons?',
        a: 'Price and simplicity. Zombies are melee only, so a basic drop chute works, and the spawner costs less. Skeletons earn more per hour from bones and arrows, which is why most farms end up with both.',
      },
      {
        q: 'What is the minimum order?',
        a: 'One spawner. The bulk price of $0.36 starts at 50, so 50 zombie spawners cost $18.00.',
      },
    ],
  },

  'creeper-spawner': {
    seoTitle: 'DonutSMP Creeper Spawner – $0.69 each | DonutCoins',
    metaDescription:
      'Creeper spawners for DonutSMP at $0.69 each, $0.65 from 25. Gunpowder for firework rockets – the perfect partner for an elytra. Delivered in-game.',
    description:
      'Creeper spawners exist for one reason on DonutSMP: gunpowder. Every creeper you farm is a step toward stacks of firework rockets, and if you fly an elytra for base hunting you burn through rockets fast. Gunpowder also sells well to other fliers. Price: $0.69 per spawner, $0.65 from 25, up to 1,000 per line.\n\n' +
      'Creeper farms need a cat or a careful kill setup so nothing explodes, but once built they run unattended. A handful of spawners is enough for personal use; a few dozen will supply a whole group or a rocket shop.\n\n' +
      'Like all items, these are handed over in-game by our staff. Join DonutSMP with the username on your order, accept the teleport from our delivery account and pick up the spawners – usually within 5–30 minutes while we are online.',
    bullets: [
      '$0.69 each, $0.65 at 25+',
      'Gunpowder for rockets – fuel for your elytra',
      'Gunpowder sells well to other players',
      'Handed over in-game, usually within minutes',
    ],
    faq: [
      {
        q: 'How many creeper spawners do I need for rockets?',
        a: 'For your own flying, 4–8 keep you stocked. If you plan to sell gunpowder or supply a group, 25 or more brings the price down to $0.65 each.',
      },
      {
        q: 'Do you also sell the elytra?',
        a: 'Yes – our DonutSMP Elytra with Unbreaking III and Mending is $28.49, and the Basehunter Bundle pairs an elytra with an Amethyst Pickaxe, 16 totems and 20M.',
      },
    ],
  },

  'blaze-spawner': {
    seoTitle: 'DonutSMP Blaze Spawner – $0.89 each | DonutCoins',
    metaDescription:
      'Blaze spawners for DonutSMP at $0.89 each, $0.84 from 25. Blaze rods for brewing and the best XP on the server. Delivered in-game by staff within minutes.',
    description:
      'Blaze spawners are the premium XP source on DonutSMP. Blazes give more experience per kill than any overworld mob and drop blaze rods, which feed brewing stands, fuel and the potion market. Each spawner is $0.89, or $0.84 from 25, with up to 1,000 per line.\n\n' +
      'Players buy blaze spawners to level enchantments quickly, to mass-produce potions for PvP and to sell rods to brewers. Because blazes shoot fireballs, the farm needs a proper kill chamber, but the payoff is some of the fastest XP you can get without leaving your base.\n\n' +
      'Spawners are handed over in-game by our staff: be online on DonutSMP with the username from your order, accept the teleport request and pick up the items. Larger quantities arrive in shulker boxes. Usually within 5–30 minutes while we are online.',
    bullets: [
      '$0.89 each, $0.84 at 25+',
      'Top-tier XP per kill',
      'Blaze rods for brewing and resale',
      'In-game handover by real staff',
    ],
    faq: [
      {
        q: 'Are blaze spawners worth it over skeletons?',
        a: 'For XP, yes – blazes give far more per kill. For money, skeletons are cheaper and their drops sell more steadily. If enchanting is your goal, blazes are the better buy.',
      },
      {
        q: 'Do blaze spawners work outside the Nether?',
        a: 'They are standard spawner items and spawn blazes wherever you place them in the dark. Build the chamber with fire resistance in mind.',
      },
    ],
  },

  elytra: {
    seoTitle: 'DonutSMP Elytra Item – Mending, $28.49 | DonutCoins',
    metaDescription:
      'Buy a DonutSMP elytra with Unbreaking III and Mending for $28.49. Fly to bases, escape fights, skip the End grind – handed over in-game within minutes.',
    description:
      'The elytra is the most wanted item on DonutSMP, and for good reason: it turns hours of walking into minutes of flight, makes base hunting practical and gets you out of fights nobody else can escape. Ours comes with Unbreaking III and Mending for $28.49, so it repairs itself as you collect XP and will last as long as you do.\n\n' +
      'Elytras are rare on the server because the End is picked clean and every ship has been looted. That scarcity is why player shops charge a fortune in coins – buying one here is often cheaper than grinding the money to pay a player.',
    bullets: [
      'Unbreaking III + Mending – self-repairing',
      '$28.49, usually cheaper than the player market',
      'Up to 20 per order',
      'Handed over in-game by real staff',
    ],
    faq: [
      {
        q: 'Which enchantments does the DonutSMP elytra have?',
        a: 'Unbreaking III and Mending. That is the ideal combination: Mending repairs it with XP and Unbreaking III slows durability loss while you fly.',
      },
      {
        q: 'How is the elytra delivered?',
        a: 'By hand, in-game. Be online with the username from your order, accept the teleport request from our delivery account and take the item from the drop. The order page switches to delivered once you have it.',
      },
      {
        q: 'Can I get an elytra cheaper?',
        a: 'The Mystery Box, Elite Mystery Box and God Mystery Box all have an elytra in their drop pools, and the Legendary Crate guarantees one plus 50M for $34.99. Those are gambles or bigger spends; the standalone listing is the sure thing.',
      },
    ],
  },

  'shulker-box': {
    seoTitle: 'DonutSMP Shulker Box – $0.29 each | DonutCoins',
    metaDescription:
      'Empty shulker boxes for DonutSMP at $0.29 each, $0.25 from 27. Portable storage for base hunting, trading and your vault. Delivered in-game by staff.',
    description:
      'A shulker box is the item that makes everything else on DonutSMP manageable: 27 slots that travel with you, survive being broken and stack into a tidy vault. We sell empty shulker boxes for $0.29 each, or $0.25 from 27 (a full shulker of shulkers), up to 500 per line.\n\n' +
      'Base hunters carry them to haul loot home, traders use them to hand over bulk stock in one drop, and anyone with a spawner farm needs a wall of them to store bones and arrows. Going to the End to farm shulkers yourself is slow and risky; buying a stack takes a minute.',
    bullets: [
      '$0.29 each, $0.25 at 27+',
      '27 slots of portable storage',
      'Up to 500 per line',
      'Handed over in-game, usually within minutes',
    ],
    faq: [
      {
        q: 'Are these empty or filled?',
        a: 'Empty, undyed shulker boxes. Our armor and tool \'shulker\' listings are the filled ones – 27 helmets, 27 pickaxes and so on.',
      },
      {
        q: 'How many shulker boxes should I buy?',
        a: '27 is the practical minimum because it fills one shulker and unlocks the $0.25 price ($6.75 total). Most active players keep a few dozen.',
      },
    ],
  },

  totem: {
    seoTitle: 'DonutSMP Totem of Undying – $0.25 each | DonutCoins',
    metaDescription:
      'Totems of Undying for DonutSMP at $0.25 each – $0.22 from 16, $0.19 for a stack of 64. Cheat death in PvP and base hunting. Delivered in-game by staff.',
    description:
      'A Totem of Undying is the cheapest insurance on DonutSMP. Hold one in your off-hand and the next thing that would kill you – a mace crit, lava, a fall from an elytra – gets cancelled instead. Ours cost $0.25 each, $0.22 from 16 and $0.19 from 64, up to 640 per line.\n\n' +
      'PvP players go through totems fast, and so do base hunters flying over unknown terrain. Raiding woodland mansions for them is slow, and player shops charge a premium. Buying a stack means you never fight without one.\n\n' +
      'Totems are handed over in-game by our staff: be online on DonutSMP with the username from your order, accept the teleport and collect them. A stack of 64 costs $12.16; larger orders arrive in shulker boxes. Usually within 5–30 minutes while we are online.',
    bullets: [
      '$0.25 each, $0.19 for a stack of 64',
      'Cancels one death – PvP and base-hunting essential',
      'Up to 640 per line',
      'In-game handover by staff within minutes',
    ],
    faq: [
      {
        q: 'How much is a stack of totems?',
        a: '64 totems cost $12.16 at the 64+ tier of $0.19 each. 16 totems are $3.52 at the $0.22 tier.',
      },
      {
        q: 'Do totems come with the PvP Kit?',
        a: 'Yes, the PvP Kit ($8.49) includes 8 totems alongside a maxed netherite set, sword and pickaxe. The Basehunter Bundle includes 16.',
      },
    ],
  },

  // ───────────── MYSTERY BOXES ─────────────
  'coin-crate': {
    seoTitle: 'DonutSMP Coin Crate – $1.99, Win 5M to 100M | DonutCoins',
    metaDescription:
      'Coin Crate: a $1.99 DonutSMP mystery box that always pays money – 5M guaranteed, up to 100M. Public odds, rolled when you order, paid with /pay.',
    description:
      'The Coin Crate is a DonutSMP mystery box that only contains money. For $1.99 you roll one result from a public table: 5M (40%), 10M (30%), 15M (15%), 25M (9%), 50M (5%) or 100M (1%). The worst case is still 5M. On average a crate pays about 13M, which is close to the straight-money rate – the small premium buys you the 6% shot at 50M or 100M.\n\n' +
      'It is popular with players who like a bit of chance without the risk of getting an item they do not need: every outcome is coins on your balance. Buy up to 50 crates in one order if you want to roll a batch at once.\n\n' +
      'Drops are rolled server-side the moment you place the order and shown on your order page once your payment is confirmed – no hidden re-rolls. After payment our staff send the rolled amount to your username with /pay, usually within 5–30 minutes while we are online.',
    bullets: [
      'Money only – every roll pays out',
      '5M guaranteed, 100M top prize (1%)',
      'Odds published, drops rolled at order time',
      'Paid to your balance with /pay',
    ],
    faq: [
      {
        q: 'What are the Coin Crate odds?',
        a: '5M 40%, 10M 30%, 15M 15%, 25M 9%, 50M 5%, 100M 1%. One roll per crate. The same table is shown under \'What\'s inside?\' on the product page.',
      },
      {
        q: 'When do I see what I won?',
        a: 'Immediately. The roll happens when the order is created and the result appears on your order page. Payment then triggers delivery of that exact amount.',
      },
      {
        q: 'Is the Coin Crate better value than a money pack?',
        a: 'On average, no – it pays around 13M per $1.99 crate, slightly under what the fixed packs give you. You buy it for the chance at 25M, 50M or 100M, not for the floor.',
      },
    ],
  },

  'spawner-crate': {
    seoTitle: 'DonutSMP Spawner Crate – $2.99 | DonutCoins',
    metaDescription:
      'Spawner Crate: $2.99 for two random spawner drops on DonutSMP – mostly skeleton spawners, with iron golem, creeper and blaze spawners in the pool.',
    description:
      'The Spawner Crate is a DonutSMP mystery box filled only with spawners. Each crate rolls two different lines from this table: 5–12 Skeleton Spawners (50%), 13–24 Skeleton Spawners (20%), 4–10 Zombie Spawners (12%), 2–8 Iron Golem Spawners (10%), 2–6 Creeper Spawners (5%) and 2–5 Blaze Spawners (3%). The two drops are rolled without repeats, so you never get the same line twice.\n\n' +
      'At $2.99 most rolls are worth more than the price: the common 5–12 skelly line alone is $2.15 to $5.16 at single prices, and you get a second line on top. The two-roll format is also a cheap way to add golems, creepers or blazes to an existing farm.\n\n' +
      'Drops are rolled server-side when the order is placed and listed on your order page once the payment is confirmed. After that, staff hand the spawners over in-game: join DonutSMP with your order username, accept the teleport and collect them. Usually within 5–30 minutes while online.',
    bullets: [
      'Two spawner drops per crate, no repeats',
      'Two skeleton lines make up 70% of the table',
      'Blaze, creeper and iron golem spawners in the pool',
      'Odds public, rolled at order time',
    ],
    faq: [
      {
        q: 'How many spawners will I get?',
        a: 'Two rolled lines, each with its own range – for example 5–12 skeleton spawners plus 2–8 iron golem spawners. The exact quantities are rolled with the lines and shown on your order page.',
      },
      {
        q: 'Can both rolls be skeleton spawners?',
        a: 'Yes, if the 5–12 line and the 13–24 line are both drawn – that is the best common outcome, up to 36 skellies. A line is never drawn twice.',
      },
      {
        q: 'How are the spawners delivered?',
        a: 'In-game, by hand. Be online on DonutSMP with the username on your order, accept the teleport from our staff account and pick up the spawners.',
      },
    ],
  },

  'mystery-box': {
    seoTitle: 'DonutSMP Mystery Box – $3.99, 3 Random Drops | DonutCoins',
    metaDescription:
      'DonutSMP Mystery Box: $3.99 for three random drops – netherite, skeleton spawners, dragon heads, 10M money or an elytra. Public odds, rolled on order.',
    description:
      'Our standard DonutSMP mystery box rolls three different lines from an eleven-line pool: Gilded Blackstone 1–32, Netherite Ingot 1–32, Netherite Block 1–2, Skeleton Spawner 1–15, Dragon Head 1–2, Enchanted Golden Apple 1–16, Nether Star 1–32, Deepslate Emerald Ore 1–20, Totem of Undying 1–8, 10M Money and a single Elytra. Price: $3.99 for three drops.\n\n' +
      'The commons are useful rather than filler – skeleton spawners (about 16.5% per roll) and netherite ingots (12.8%) are things you would buy anyway. The rare end is where the fun is: a Dragon Head at about 2.8%, 10M money at 4.6% and the Elytra at roughly 0.9% per roll.\n\n' +
      'Every drop is rolled server-side when you place the order and listed on your order page after payment – what you see there is what you get. After payment, staff hand the items over in-game: log on with your order username, accept the teleport and collect. Usually within 5–30 minutes while we are online.',
    bullets: [
      'Three different drops per box',
      'Skeleton spawners, netherite, dragon heads, 10M, elytra',
      'Elytra odds about 0.9% per roll',
      'Rolled on order, shown before delivery',
      'Up to 50 boxes per order',
    ],
    faq: [
      {
        q: 'What can I get from the DonutSMP Mystery Box?',
        a: 'One of eleven lines per roll, three rolls: gilded blackstone, netherite ingots or blocks, skeleton spawners, dragon heads, enchanted golden apples, nether stars, deepslate emerald ore, totems, 10M money or an elytra. The full odds are under \'What\'s inside?\'.',
      },
      {
        q: 'Can I get the same item twice in one box?',
        a: 'No. The three rolls are drawn without replacement, so each box contains three different lines. Buy several boxes if you want more rolls.',
      },
      {
        q: 'How is a mystery box delivered?',
        a: 'Items are handed over in-game by staff after payment; a money line is sent with /pay. Join DonutSMP with the username on your order, accept the teleport and collect the drop.',
      },
    ],
  },

  'elite-mystery-box': {
    seoTitle: 'DonutSMP Elite Mystery Box – $8.99, 4 Drops | DonutCoins',
    metaDescription:
      'Elite Mystery Box for DonutSMP: $8.99 for four drops with 4% elytra odds per roll, netherite blocks, dragon heads and 25M money. Rolled when you order.',
    description:
      'The Elite Mystery Box steps up both the number of rolls and the odds. For $8.99 you get four different drops from a ten-line pool: Elytra (4%), Netherite Block 1–3 (10%), Netherite Ingot 1–20 (16%), Gilded Blackstone 1–45 (16%), Dragon Head 1–3 (6%), Nether Star 1–32 (14%), Enchanted Golden Apple 1–32 (12%), Deepslate Emerald Ore 1–20 (10%), Iron Golem Spawner 2–10 (8%) and 25M Money (4%).\n\n' +
      'Compared with the standard Mystery Box, the elytra chance per roll is about four times higher, the money line is 25M instead of 10M, and the item ranges are wider – up to 45 gilded blackstone or 32 enchanted golden apples in a single line. There is no low-value filler line in this pool.\n\n' +
      'Drops are rolled server-side when the order is created and printed on your order page once it is paid. Staff then deliver in-game – teleport, drop, done – and send a money line with /pay. Usually within 5–30 minutes while we are online.',
    bullets: [
      'Four different drops per box',
      'Elytra at 4% per roll, 25M money at 4%',
      'Netherite blocks, dragon heads, golem spawners in the pool',
      'Odds public, rolled on order',
    ],
    faq: [
      {
        q: 'What are the elytra odds in the Elite Mystery Box?',
        a: '4% per roll, and the box rolls four times without repeats – so the box-wide chance is noticeably higher than the per-roll figure. The standard Mystery Box sits at about 0.9% per roll.',
      },
      {
        q: 'Elite or God box?',
        a: 'The God Mystery Box ($19.99) rolls five lines with elytra at about 11% per roll and bigger ranges, but costs more than two Elite boxes. If you want more total rolls for the money, two Elite boxes give eight drops for $17.98.',
      },
      {
        q: 'How are the drops delivered?',
        a: 'In-game by our staff after payment: be online with your order username on DonutSMP, accept the teleport and pick up the items. A 25M money roll is sent with /pay.',
      },
    ],
  },

  'god-mystery-box': {
    seoTitle: 'DonutSMP God Mystery Box – $19.99, 5 Drops | DonutCoins',
    metaDescription:
      'God Mystery Box for DonutSMP: $19.99 for five drops – elytra at about 11% per roll, 50M money, dragon heads, netherite blocks and blaze spawners.',
    description:
      'The God Mystery Box is our highest-odds box short of a guarantee. For $19.99 it rolls five different lines from nine: Elytra (about 11%), Netherite Block 1–5 (15.6%), Gilded Blackstone 16–128 (15.6%), Deepslate Emerald Ore 4–20 (13.3%), Netherite Ingot 4–32 (15.6%), Dragon Head 1–4 (8.9%), Blaze Spawner 2–6 (6.7%), 50M Money (5.6%) and Heavy Core 1–2 (7.8%).\n\n' +
      'Because five of the nine lines are drawn without repeats and only three of them are common or uncommon, at least two of your five drops are always rare or better. The minimum quantities are high too – no single gilded blackstone here, the line starts at 16 and the ingot line at 4.\n\n' +
      'Like all our boxes, the drops are rolled server-side when you order and shown on your order page after payment, before delivery. Staff hand the items over in-game and send a 50M roll with /pay, usually within 5–30 minutes while we are online. Up to 25 boxes per order.',
    bullets: [
      'Five different drops per box',
      'Elytra at about 11% per roll – highest of any random box',
      'At least two drops are rare or better',
      '50M money, dragon heads, blaze spawners in the pool',
      'Rolled on order, visible before delivery',
    ],
    faq: [
      {
        q: 'What are the elytra odds in the God Mystery Box?',
        a: 'About 11% on each of the five rolls (weight 10 of 90), drawn without repeats. If you want a certain elytra, the Legendary Crate ($34.99) guarantees one plus 50M.',
      },
      {
        q: 'Is at least one rare drop really guaranteed?',
        a: 'Yes. The pool has nine lines and only three are common or uncommon (gilded blackstone, deepslate emerald ore, netherite ingot). Five lines are drawn with no repeats, so at least two of them must be rare, epic or legendary.',
      },
      {
        q: 'How do I receive the drops?',
        a: 'After payment our staff deliver in-game: join DonutSMP with your order username, accept the teleport and collect the items. Money lines go to your balance with /pay. Everything is listed on the order page first.',
      },
    ],
  },

  'legendary-crate': {
    seoTitle: 'DonutSMP Legendary Crate – $34.99 | DonutCoins',
    metaDescription:
      'Legendary Crate: $34.99 for a guaranteed DonutSMP elytra and 50M money plus six more drops – dragon heads, netherite blocks, maxed armor or 100M.',
    description:
      'The Legendary Crate is the only DonutSMP mystery box with no bad outcome. Every crate guarantees an Elytra and 50M Money, then rolls six different lines from a nine-line pool: Dragon Head 1–5 (14%), Netherite Block 2–8 (16%), Blaze Spawner 4–12 (10%), Iron Golem Spawner 8–24 (14%), Heavy Core 1–4 (10%), Totem of Undying 8–32 (14%), 100M Money (4%), a maxed Netherite Armor Set (8%) and a Mace (10%).\n\n' +
      'The elytra alone is $28.49 in our shop and 50M is $7.49, so $35.98 of the $34.99 is locked in before a single roll. The other six drops come from the top pool only – no filler lines.\n\n' +
      'Rolls happen server-side when you order and the full list appears on your order page. After payment, staff hand the items over in-game and pay the money lines with /pay – usually within 5–30 minutes while online. Max 10 crates per order.',
    bullets: [
      'Elytra + 50M guaranteed in every crate',
      'Six more drops from a top-tier pool, no filler',
      '100M money at 4%, maxed netherite set at 8% per roll',
      'Eight lines per crate in total',
      'Max 10 per order',
    ],
    faq: [
      {
        q: 'What exactly is guaranteed in the Legendary Crate?',
        a: 'An Elytra and 50M money, in every crate, no roll involved. The other six lines are random, drawn without repeats from the nine-line pool.',
      },
      {
        q: 'How many drops do I get in total?',
        a: 'Eight: the two guaranteed lines plus six rolled lines. Each rolled line has its own quantity range – for example 8–24 iron golem spawners or 8–32 totems – and the exact numbers are rolled with the line.',
      },
      {
        q: 'How is the crate delivered?',
        a: 'Items in-game by our staff (teleport, drop, collect), money by /pay to the username on your order. Everything is listed on the order page before delivery so you know what to expect.',
      },
    ],
  },

  // ───────────── INVESTMENTS ─────────────
  'enchanted-golden-apple': {
    seoTitle: 'DonutSMP Enchanted Golden Apple – $0.47 | DonutCoins',
    metaDescription:
      'Enchanted golden apples for DonutSMP at $0.47 each – $0.44 from 16, $0.40 for a stack of 64. PvP essential and a stable investment. Delivered in-game.',
    description:
      'The enchanted golden apple – the god apple – is the strongest consumable in the game: Absorption IV, Regeneration II, Fire Resistance and Resistance for long enough to turn a fight. On DonutSMP they cannot be crafted, which keeps the price high and makes them one of the safest items to hold. We sell them at $0.47 each, $0.44 from 16 and $0.40 from 64, up to 640 per line.\n\n' +
      'PvP players eat them, traders stockpile them, and both groups keep a steady demand going that rarely dips. That is why they sit in our Investments category: a stack bought today still sells tomorrow.',
    bullets: [
      '$0.47 each, $0.40 at 64+',
      'Absorption IV, Regen II, Resistance, Fire Resistance',
      'Uncraftable on DonutSMP – holds value',
      'Handed over in-game by staff',
    ],
    faq: [
      {
        q: 'Why are god apples in the Investments category?',
        a: 'Because they cannot be crafted and are consumed in every serious fight, their value on the player market stays stable. Many players buy stacks to resell or to hold.',
      },
      {
        q: 'How much is a stack of enchanted golden apples?',
        a: '64 apples cost $25.60 at the 64+ tier ($0.40 each). 16 apples are $7.04 at the $0.44 tier.',
      },
    ],
  },

  'gilded-blackstone': {
    seoTitle: 'DonutSMP Gilded Blackstone – $0.72 | DonutCoins',
    metaDescription:
      'Gilded blackstone for DonutSMP at $0.72 each, $0.68 from 32. A rare block that players hoard and trade as an investment. Handed over in-game by staff.',
    description:
      'Gilded blackstone is one of the rarest naturally generated blocks in the game, found only in bastion remnants, and on DonutSMP it has become a status block – used for showcase builds and traded as a store of value. We sell it at $0.72 per block, $0.68 from 32, up to 640 per line.\n\n' +
      'Because it cannot be crafted and the Nether has been thoroughly looted, supply only shrinks. Investors buy it the way they buy netherite: something that holds its price and sells quickly when they need coins. It also appears in our Mystery Box, Elite and God box pools.\n\n' +
      'Blocks are handed over in-game by our staff: join DonutSMP with the username on your order, accept the teleport request and collect them. Larger orders arrive in shulker boxes. Usually within 5–30 minutes while we are online.',
    bullets: [
      '$0.72 each, $0.68 at 32+',
      'Uncraftable, bastion-only block',
      'Popular trade and investment item',
      'In-game handover, shulkered for bulk',
    ],
    faq: [
      {
        q: 'What is gilded blackstone used for on DonutSMP?',
        a: 'Mostly for showing off and trading. It is a rare decorative block, so builders pay for it and investors hold it. It has no functional use beyond looking expensive.',
      },
      {
        q: 'How much is a stack?',
        a: '32 blocks cost $21.76 at the $0.68 tier; a full stack of 64 is $43.52.',
      },
    ],
  },

  'nether-star': {
    seoTitle: 'DonutSMP Nether Star – $0.19 each | DonutCoins',
    metaDescription:
      'Nether stars for DonutSMP at $0.19 each – $0.17 from 32, $0.15 from 128. Beacons for your base or bulk stock to trade. Delivered in-game by our staff.',
    description:
      'Nether stars power beacons, and beacons – Haste II for mining, Speed for base runs, Regeneration for the fight – are standard kit for any serious DonutSMP base. Killing the Wither for each one is slow and dangerous; buying them is $0.19 each, $0.17 from 32 and $0.15 from 128, with up to 1,280 per line.\n\n' +
      'They are also a popular bulk trade item: stars are compact, always in demand and hold a steady price, which is why they sit in our Investments category and appear in several mystery box pools.',
    bullets: [
      '$0.19 each, down to $0.15 at 128+',
      'One star per beacon',
      'Compact, in-demand trade item',
      'Up to 1,280 per line',
    ],
    faq: [
      {
        q: 'How many nether stars do I need?',
        a: 'One per beacon. Most bases run two to four beacons, but players who trade buy by the stack: 64 stars cost $10.88 and 128 cost $19.20.',
      },
      {
        q: 'How are nether stars delivered?',
        a: 'In-game, by hand. Join DonutSMP with your order username, accept the teleport from our delivery account and collect the items.',
      },
    ],
  },

  'deepslate-emerald-ore': {
    seoTitle: 'DonutSMP Deepslate Emerald Ore – $0.57 | DonutCoins',
    metaDescription:
      'Deepslate emerald ore for DonutSMP at $0.57 each, $0.52 from 32. A silk-touch-only block that builders and investors collect. Handed over in-game.',
    description:
      'Deepslate emerald ore is the rarest ore block in the game and can only be collected with Silk Touch, which makes it a collector\'s block on DonutSMP – used for vault displays, rich-looking builds and as a trade item that holds value. We sell it at $0.57 per block, $0.52 from 32, up to 640 per line.\n\n' +
      'Players buy it for the same reason they buy gilded blackstone: supply is tiny, it cannot be crafted and demand from builders is constant. It also shows up in the Mystery Box, Elite and God box pools, so a few spare blocks are useful for completing a display.\n\n' +
      'Blocks are delivered in-game by our staff: log on to DonutSMP with the username on your order, accept the teleport request and collect them. Larger orders arrive in shulker boxes, usually within 5–30 minutes while we are online.',
    bullets: [
      '$0.57 each, $0.52 at 32+',
      'Rarest ore block – silk touch only',
      'Display and investment block',
      'In-game handover by staff',
    ],
    faq: [
      {
        q: 'Is this the ore block or emeralds?',
        a: 'The ore block – deepslate emerald ore, as mined with Silk Touch. It is bought as a rare block, not as a source of emeralds.',
      },
      {
        q: 'How much is a stack of 64?',
        a: 'At the $0.52 bulk tier (32+), 64 blocks cost $33.28.',
      },
    ],
  },

  'ancient-debris': {
    seoTitle: 'DonutSMP Ancient Debris – $0.57 each | DonutCoins',
    metaDescription:
      'Ancient debris for DonutSMP at $0.57 each, $0.52 from 32. Smelt it for netherite scrap or hold it as an investment. Delivered in-game by our staff.',
    description:
      'Ancient debris is the raw material behind every piece of netherite on DonutSMP. Four pieces smelt into four scrap, which with four gold ingots make one netherite ingot. We sell debris at $0.57 each, $0.52 from 32, up to 640 per line – a cheap route to ingots if you have gold and furnaces to spare.\n\n' +
      'Players also keep debris as an investment: it is finite, mining it takes hours of bed-bombing, and the price tracks netherite closely. Holding debris rather than ingots gives you the option of selling either the block or the finished product later.',
    bullets: [
      '$0.57 each, $0.52 at 32+',
      'Four debris = one netherite ingot (with gold)',
      'Cheaper per ingot than buying ingots',
      'Handed over in-game, shulkered for bulk',
    ],
    faq: [
      {
        q: 'Is debris cheaper than buying netherite ingots?',
        a: 'Per ingot, yes: four debris cost $2.28 at single price (or $2.08 at the 32+ tier) versus $3.29 for a finished ingot. You need four gold ingots and a furnace per ingot, though.',
      },
      {
        q: 'How is ancient debris delivered?',
        a: 'By hand, in-game. Be online with your order username, accept the teleport from our staff account and collect the items.',
      },
    ],
  },

  'heavy-core': {
    seoTitle: 'DonutSMP Heavy Core – $1.29 | DonutCoins',
    metaDescription:
      'Heavy cores for DonutSMP at $1.29 each – the trial chamber vault drop needed to craft a mace. Buy one to craft or several to hold. Delivered in-game.',
    description:
      'The heavy core is the rarest crafting ingredient in the game: it only comes from ominous vaults in trial chambers, and one core plus a breeze rod makes a mace. On DonutSMP, where maces decide fights, the core is both a crafting item and a trade item with a stable value. Price: $1.29 each, up to 64 per order.\n\n' +
      'Players buy heavy cores to craft their own mace with the enchantments they want, to hold as an investment, or to resell to PvP players who do not want to run trial chambers. It appears in the God Mystery Box and Legendary Crate pools too.',
    bullets: [
      '$1.29 each, up to 64 per order',
      'Ominous vault drop – crafts a mace',
      'Stable trade and investment value',
      'Handed over in-game by staff',
    ],
    faq: [
      {
        q: 'Should I buy a heavy core or a mace?',
        a: 'If you want a weapon to use, buy the Mace ($1.49) – it comes with Density V, Wind Burst III, Mending and Unbreaking III. Buy the core if you want to craft or enchant it yourself, or to hold as an investment.',
      },
      {
        q: 'How is the heavy core delivered?',
        a: 'In-game by hand: log on with the username on your order, accept the teleport from our delivery account and take the item.',
      },
    ],
  },

  'netherite-ingot': {
    seoTitle: 'DonutSMP Netherite Ingot – $3.29 | DonutCoins',
    metaDescription:
      'Netherite ingots for DonutSMP at $3.29 each – $3.09 from 9, $2.89 from 36. Upgrade your gear or stack ingots as a store of value. Delivered in-game.',
    description:
      'Netherite ingots are DonutSMP\'s hard currency: every maxed armor piece and god tool needs one, and ingots are the standard unit for large player trades. We sell them at $3.29 each, $3.09 from 9 (enough to craft one block) and $2.89 from 36, with up to 640 per line.\n\n' +
      'Players buy ingots to upgrade diamond gear, to craft netherite blocks for a vault, or simply to hold – netherite keeps its value better than coins when the economy inflates. If you only need blocks, our Netherite Block listing at $14.49 is cheaper than nine single ingots.\n\n' +
      'Ingots are handed over in-game by our staff. Be online on DonutSMP with the username from your order, accept the teleport request and collect them; larger orders come in shulker boxes. Usually within 5–30 minutes while we are online.',
    bullets: [
      '$3.29 each, $2.89 at 36+',
      'One ingot per armor piece or tool upgrade',
      'Standard unit for big player trades',
      'Shulkered delivery for bulk orders',
    ],
    faq: [
      {
        q: 'How many ingots for a full netherite set?',
        a: 'Four – one per armor piece – plus one each for a sword and pickaxe, so six ingots ($19.74) upgrade a full diamond kit. If you just want the armor, the finished Netherite Armor Set is $4.99.',
      },
      {
        q: 'Ingots or blocks?',
        a: 'A netherite block is nine ingots. At $14.49 the block costs less than nine single ingots ($29.61) and less than nine at the $3.09 tier ($27.81), so buy blocks if you want ingots in bulk and can uncraft them.',
      },
    ],
  },

  'netherite-block': {
    seoTitle: 'DonutSMP Netherite Block – $14.49 | DonutCoins',
    metaDescription:
      'Netherite blocks for DonutSMP at $14.49 each, $13.49 from 4. Nine ingots in one block – far cheaper than buying ingots separately. Delivered in-game.',
    description:
      'A netherite block is nine ingots in one slot, and on DonutSMP it is the standard way to hold and trade large amounts of netherite. Our price is $14.49 per block, or $13.49 from 4, up to 128 per order. Nine single ingots would cost $29.61, so blocks are by far the cheapest way to buy netherite from us.\n\n' +
      'Players buy blocks to build beacon bases (netherite is a valid beacon block), to stack a vault with something that keeps its value, and to uncraft into ingots for gear. They are also a top-pool line in the Mystery Box, Elite, God and Legendary pools.\n\n' +
      'Blocks are delivered in-game by our staff: join DonutSMP with the username on your order, accept the teleport request and collect them. Usually within 5–30 minutes while we are online.',
    bullets: [
      '$14.49 each, $13.49 at 4+',
      'Nine ingots per block – about half the price of singles',
      'Beacon base and vault staple',
      'Up to 128 per order',
    ],
    faq: [
      {
        q: 'Is a netherite block cheaper than nine ingots?',
        a: 'Yes, by a lot: $14.49 versus $29.61 for nine ingots at single price. Buy blocks and uncraft them if you need ingots.',
      },
      {
        q: 'How many blocks for a full beacon pyramid?',
        a: 'A full four-layer pyramid is 164 blocks, which is above the 128 per-order cap – place two orders or mix in another beacon-valid block. A single-layer base needs 9.',
      },
      {
        q: 'How is the block delivered?',
        a: 'In-game by hand: be online with the order username, accept the teleport and collect the items.',
      },
    ],
  },

  'dragon-head': {
    seoTitle: 'DonutSMP Dragon Head – $18.99 | DonutCoins',
    metaDescription:
      'Dragon heads for DonutSMP at $18.99 each. The trophy block from End ships – rare, uncraftable and a top-tier flex. Handed over in-game by our staff.',
    description:
      'The dragon head is the ultimate trophy block: it only generates on End ships, one per ship, and cannot be crafted. On DonutSMP, where the End was stripped long ago, a dragon head on your base or in your vault says you have money. We sell them at $18.99 each, up to 64 per order.\n\n' +
      'Beyond the flex, dragon heads are a serious investment item – rare, compact and always wanted by builders – and they feature as the epic line in our Mystery Box, Elite, God and Legendary pools. Placed and powered by redstone, the jaw animates – a classic base decoration.',
    bullets: [
      '$18.99 each, up to 64 per order',
      'End-ship-only trophy block, uncraftable',
      'Investment item that builders always want',
      'In-game handover by staff',
    ],
    faq: [
      {
        q: 'Why are dragon heads so expensive on DonutSMP?',
        a: 'Each End ship holds exactly one and ships cannot be regenerated, so the supply is fixed and shrinking. That scarcity is what you pay for.',
      },
      {
        q: 'How is a dragon head delivered?',
        a: 'In-game by hand: be online with your order username, accept the teleport from our staff account and take the item. The order page updates to delivered afterwards.',
      },
    ],
  },

  'starter-investment-box': {
    seoTitle: 'DonutSMP Starter Investment Box – $9.49 | DonutCoins',
    metaDescription:
      'Starter Investment Box for DonutSMP: a fixed kit with a netherite ingot, gilded blackstone, nether stars, god apples and emerald ore for $9.49.',
    description:
      'The Starter Investment Box is a fixed kit, not a mystery box: every box contains exactly 1 Netherite Ingot, 4 Gilded Blackstone, 8 Nether Stars, 4 Enchanted Golden Apples and 4 Deepslate Emerald Ore. At single-item prices those add up to about $11.85; the box is $9.49.\n\n' +
      'It is built for players who want a first portfolio of items that hold value on DonutSMP without picking them one by one – a mix of the rare blocks collectors want, the consumables PvP players burn through and a netherite ingot to anchor it. Everything inside can be resold on the player market or held.',
    bullets: [
      'Fixed contents – you know exactly what you get',
      'About $11.85 of items for $9.49',
      'Netherite, gilded blackstone, nether stars, god apples, emerald ore',
      'Up to 20 per order',
    ],
    faq: [
      {
        q: 'Is the Starter Investment Box random?',
        a: 'No. It is a kit with fixed contents listed on the product page. The only random products we sell are the mystery boxes and crates.',
      },
      {
        q: 'Why buy the box instead of the items?',
        a: 'Convenience and price: the same five lines bought separately cost about $11.85 at single prices, the box is $9.49 and arrives in one handover.',
      },
    ],
  },

  'value-investment-box': {
    seoTitle: 'DonutSMP Value Investment Box – $37.99 | DonutCoins',
    metaDescription:
      'Value Investment Box for DonutSMP: netherite block, 4 ingots, 16 gilded blackstone, 32 nether stars, 16 god apples and a heavy core for $37.99.',
    description:
      'The Value Investment Box is a fixed kit for players building a real vault. Every box contains 1 Netherite Block, 4 Netherite Ingots, 16 Gilded Blackstone, 32 Nether Stars, 16 Enchanted Golden Apples and 1 Heavy Core. Bought separately those lines come to roughly $53 even with our bulk tiers applied; the box is $37.99.\n\n' +
      'It covers the three things DonutSMP investors actually hold – netherite, rare blocks and god apples – plus a heavy core, which is the hardest mace ingredient to source. Nothing is rolled or random; the contents are the same in every box.\n\n' +
      'Staff deliver the kit in-game: be online on DonutSMP with the username on your order, accept the teleport request and collect the items, which arrive packed for easy pickup. Usually within 5–30 minutes while we are online. Up to 20 boxes per order.',
    bullets: [
      'Fixed contents, no gambling',
      'Roughly $53 of items for $37.99',
      'Netherite block, 4 ingots, heavy core and more',
      'Qualifies for the 5% spending discount ($15+)',
    ],
    faq: [
      {
        q: 'What is in the Value Investment Box?',
        a: '1 Netherite Block, 4 Netherite Ingots, 16 Gilded Blackstone, 32 Nether Stars, 16 Enchanted Golden Apples and 1 Heavy Core. Same list every time.',
      },
      {
        q: 'How is a kit delivered?',
        a: 'In-game by hand. Join DonutSMP with your order username, accept the teleport from our delivery account and pick up the items. The order page lists every line so you can check the handover.',
      },
    ],
  },

  'elite-investment-box': {
    seoTitle: 'DonutSMP Elite Investment Box – $47.99 | DonutCoins',
    metaDescription:
      'Elite Investment Box for DonutSMP: dragon head, netherite block, 6 ingots, 32 gilded blackstone, 32 god apples and 2 heavy cores for $47.99.',
    description:
      'The Elite Investment Box is our biggest fixed kit. Every box contains 1 Dragon Head, 1 Netherite Block, 6 Netherite Ingots, 32 Gilded Blackstone, 32 Enchanted Golden Apples and 2 Heavy Cores. At catalog prices with bulk tiers those lines total around $92; the box is $47.99, and carts of $40 or more also get the 8% spending discount.\n\n' +
      'This is the vault starter for players who want to hold value rather than coins: a dragon head and a netherite block as the anchors, enough ingots for a full gear upgrade, 32 each of the blocks and apples traders want, and two heavy cores for maces. Fixed contents – nothing is rolled.',
    bullets: [
      'Dragon head + netherite block in every box',
      'Around $92 of items for $47.99',
      'Fixed contents – the same in every box',
      '8% spending discount applies at $40+',
    ],
    faq: [
      {
        q: 'What is in the Elite Investment Box?',
        a: '1 Dragon Head, 1 Netherite Block, 6 Netherite Ingots, 32 Gilded Blackstone, 32 Enchanted Golden Apples and 2 Heavy Cores. Fixed list, no random rolls.',
      },
      {
        q: 'Is the $92 comparison real?',
        a: 'Yes – it is the sum of the current single-item prices with bulk tiers applied (6 ingots at $3.29, 32 gilded blackstone at $0.68, 32 apples at $0.44, and so on). Prices can change, but at the time of writing the kit sits well below its parts.',
      },
      {
        q: 'How is it delivered?',
        a: 'In-game by hand after payment – teleport, drop, collect. Money is not part of this kit, so there is no /pay step.',
      },
    ],
  },

  // ───────────── ARMOR ─────────────
  'diamond-armor-shulker': {
    seoTitle: 'DonutSMP Diamond Armor Shulker – $0.49 | DonutCoins',
    metaDescription:
      'Diamond Armor Shulker for DonutSMP: six full diamond sets with Protection IV, Unbreaking III and Mending for $0.49. Gear a whole team for under a dollar.',
    description:
      'The Diamond Armor Shulker is the cheapest full-gear deal in our DonutSMP shop: six complete diamond sets – 6 helmets, 6 chestplates, 6 leggings and 6 boots, 24 pieces in total – each with Protection IV, Unbreaking III and Mending, packed in one shulker box for $0.49.\n\n' +
      'It is the kit players buy when they keep dying: spare sets for base-hunting trips, armor for new recruits, or backup gear to stash in an ender chest so a bad fight costs nothing. Diamond with Protection IV is still very solid on DonutSMP, and Mending keeps every piece alive.',
    bullets: [
      '6 full diamond sets (24 pieces) for $0.49',
      'Protection IV, Unbreaking III, Mending on every piece',
      'Comes in a shulker box, ready to stash',
      'Up to 100 per order',
    ],
    faq: [
      {
        q: 'What enchantments are on the diamond armor?',
        a: 'Protection IV, Unbreaking III and Mending on every piece. If you want Blast Protection on leggings and boots, see the single-piece Diamond Leggings and Boots Shulkers.',
      },
      {
        q: 'How is the shulker delivered?',
        a: 'In-game by hand. Log on with your order username, accept the teleport from our delivery account and pick up the shulker box with the armor inside.',
      },
    ],
  },

  'diamond-helmet-shulker': {
    seoTitle: 'DonutSMP Diamond Helmet Shulker – $1.39 | DonutCoins',
    metaDescription:
      'A shulker of 27 diamond helmets with Protection IV, Unbreaking III and Mending for DonutSMP – $1.39, about 5 cents a helmet. Delivered in-game by staff.',
    description:
      'This shulker box holds 27 diamond helmets, each enchanted with Protection IV, Unbreaking III and Mending, for $1.39 – a little over five cents per helmet. It is the single-slot way to stock a base, a shop or a PvP crew with head armor that is already maxed.\n\n' +
      'Helmets are the piece most often lost on DonutSMP – swapped for a turtle shell, left in a death chest, handed to a friend – so a full shulker of spares saves endless trips to the enchanting table. Shop owners also resell them individually for coins.',
    bullets: [
      '27 maxed diamond helmets in one shulker',
      'Protection IV, Unbreaking III, Mending',
      '$1.39 – about 5 cents per helmet',
      'Resell-ready stock for shop owners',
    ],
    faq: [
      {
        q: 'Can I get a mix of pieces instead of 27 helmets?',
        a: 'Use the Diamond Armor Shulker for six complete sets at $0.49, or combine the helmet, chestplate, leggings and boots shulkers for 27 full sets at $5.56.',
      },
      {
        q: 'How is it delivered?',
        a: 'In-game by hand: be online with the order username, accept the teleport and collect the shulker box.',
      },
    ],
  },

  'diamond-chestplate-shulker': {
    seoTitle: 'DonutSMP Diamond Chestplate Shulker – $1.39 | DonutCoins',
    metaDescription:
      'A shulker of 27 diamond chestplates with Protection IV, Unbreaking III and Mending for DonutSMP – $1.39. The piece that matters most, in bulk.',
    description:
      'Twenty-seven diamond chestplates, each with Protection IV, Unbreaking III and Mending, packed in one shulker box for $1.39. The chestplate carries the biggest share of your armor points, so it is the piece where a maxed enchantment matters most – and this is the cheapest way to own a lot of them.\n\n' +
      'On DonutSMP a shulker of chestplates is usually bought for one of three reasons: outfitting a group before a raid, stocking a player shop, or keeping backups so an elytra swap never leaves you without body armor. At about five cents each, the spare is always worth carrying.',
    bullets: [
      '27 maxed diamond chestplates in one shulker',
      'Protection IV, Unbreaking III, Mending',
      '$1.39 for the whole box',
      'Backups for elytra swaps and raids',
    ],
    faq: [
      {
        q: 'Are these the same chestplates as in the Diamond Armor Shulker?',
        a: 'Yes – Protection IV, Unbreaking III and Mending. The difference is quantity: 27 chestplates here versus six full sets there.',
      },
      {
        q: 'How is the shulker delivered?',
        a: 'In-game by hand. Join DonutSMP with your order username, accept the teleport from our delivery account and take the box.',
      },
    ],
  },

  'diamond-leggings-shulker': {
    seoTitle: 'DonutSMP Diamond Leggings Shulker – $1.39 | DonutCoins',
    metaDescription:
      'A shulker of 27 diamond leggings with Blast Protection IV, Unbreaking III and Mending for DonutSMP – $1.39. Built for crystal, TNT and creeper fights.',
    description:
      'This shulker holds 27 diamond leggings enchanted with Blast Protection IV, Unbreaking III and Mending for $1.39. Blast Protection is the deliberate choice: on DonutSMP most sudden deaths come from end crystals, TNT traps and creepers, and Blast Protection IV on leggings and boots takes a huge bite out of that damage.\n\n' +
      'Crystal PvP players mix Blast Protection pieces with Protection IV pieces to balance explosion and melee damage, and shop owners stock these because the mix is hard to enchant at scale. A full shulker means every set in the base gets the right legs.',
    bullets: [
      '27 diamond leggings in one shulker',
      'Blast Protection IV, Unbreaking III, Mending',
      'Made for crystal, TNT and creeper damage',
      '$1.39, up to 50 shulkers per order',
    ],
    faq: [
      {
        q: 'Why Blast Protection instead of Protection?',
        a: 'Because explosions are what kill geared players on DonutSMP. Blast Protection IV reduces explosion damage far more than Protection IV does; pair these leggings with a Protection IV helmet and chestplate for a balanced set.',
      },
      {
        q: 'How are they delivered?',
        a: 'In-game by hand: be online with your order username, accept the teleport from our staff account and collect the box.',
      },
    ],
  },

  'diamond-boots-shulker': {
    seoTitle: 'DonutSMP Diamond Boots Shulker – $1.39 | DonutCoins',
    metaDescription:
      'A shulker of 27 diamond boots with Blast Protection IV, Unbreaking III and Mending for DonutSMP – $1.39. Blast-proof boots in bulk, delivered in-game.',
    description:
      'Twenty-seven diamond boots with Blast Protection IV, Unbreaking III and Mending, in a single shulker box for $1.39. Boots are the second explosion-facing slot, and with Blast Protection IV on both leggings and boots a crystal or TNT hit that would have ended a fight becomes survivable.\n\n' +
      'Players buy the boots shulker alongside the leggings shulker to complete the blast half of a mixed set, or on its own to replace boots lost to lava and void deaths while base hunting. At about five cents a pair, nobody on your team needs to run barefoot.',
    bullets: [
      '27 diamond boots in one shulker',
      'Blast Protection IV, Unbreaking III, Mending',
      'Completes a blast-protected lower half',
      '$1.39 per shulker',
    ],
    faq: [
      {
        q: 'Do the boots have Feather Falling or Depth Strider?',
        a: 'No – they come with Blast Protection IV, Unbreaking III and Mending only. You can add Feather Falling or Depth Strider yourself at an anvil.',
      },
      {
        q: 'How is the shulker delivered?',
        a: 'In-game by hand. Join DonutSMP with your order username, accept the teleport and take the box from the drop.',
      },
    ],
  },

  'netherite-armor-set': {
    seoTitle: 'DonutSMP Netherite Armor Set (God) – $4.99 | DonutCoins',
    metaDescription:
      'Full maxed netherite armor set for DonutSMP – Protection IV, Unbreaking III, Mending and Thorns III on all four pieces for $4.99. Handed over in-game.',
    description:
      'One complete god-tier netherite set: helmet, chestplate, leggings and boots, each with Protection IV, Unbreaking III, Mending and Thorns III, for $4.99. It is the armor every serious DonutSMP player ends up in, without the hours of mining debris, smelting and enchanting.\n\n' +
      'Netherite gives knockback resistance and the highest base armor in the game; Protection IV takes it to the cap, Mending keeps it repaired from the XP you pick up anyway, and Thorns III punishes anyone who melees you. Buying the set is also cheaper than the four ingots it would take to upgrade a diamond kit ($13.16).',
    bullets: [
      'Full 4-piece netherite set for $4.99',
      'Protection IV, Unbreaking III, Mending, Thorns III',
      'Cheaper than the four ingots to craft it',
      'In-game handover by staff',
    ],
    faq: [
      {
        q: 'What enchantments are on the netherite armor set?',
        a: 'Protection IV, Unbreaking III, Mending and Thorns III on all four pieces. There is no Blast Protection variant in this listing.',
      },
      {
        q: 'Do I need to be online to receive armor?',
        a: 'Yes – items are handed over in person. Join DonutSMP with the username on your order, accept the teleport from our delivery account and collect the pieces.',
      },
      {
        q: 'Is there a bulk option?',
        a: 'The Netherite Armor Shulker holds six full sets for $18.99, and the PvP Kit adds a maxed sword, pickaxe and 8 totems to one set for $8.49.',
      },
    ],
  },

  'pvp-kit': {
    seoTitle: 'DonutSMP PvP Kit (Full Netherite) – $8.49 | DonutCoins',
    metaDescription:
      'DonutSMP PvP Kit for $8.49: maxed netherite armor set, god sword, god pickaxe and 8 totems of undying in one handover. Delivered in-game by our staff.',
    description:
      'The PvP Kit is a complete loadout in one order: a maxed netherite armor set (Protection IV, Unbreaking III, Mending, Thorns III), a maxed netherite sword, a maxed netherite pickaxe and 8 Totems of Undying, for $8.49. Spawn in, gear up, fight.\n\n' +
      'It exists because most players who lose a fight on DonutSMP lose everything at once – armor, weapon, totems – and rebuying piece by piece is tedious. The kit is also what people grab after joining a new group or coming back from a break: one checkout and you are no longer the weak link.',
    bullets: [
      'Maxed netherite set + sword + pickaxe + 8 totems',
      'Protection IV, Thorns III, Mending on the armor',
      'One handover, ready to fight',
      '$8.49, up to 50 per order',
    ],
    faq: [
      {
        q: 'What enchantments are on the PvP Kit sword and pickaxe?',
        a: 'They match our standalone Netherite Sword (God) and Netherite Pickaxe (God): the sword with Sharpness V, Unbreaking III, Mending, Fire Aspect II and Looting III; the pickaxe with Efficiency V, Unbreaking III, Mending and Fortune III.',
      },
      {
        q: 'Is the kit cheaper than buying the parts?',
        a: 'Yes, slightly – the set, sword, pickaxe and 8 totems come to about $8.97 bought separately, and the kit is $8.49. On top of the saving you get one order line, one handover and no risk of forgetting a piece.',
      },
      {
        q: 'How is the PvP Kit delivered?',
        a: 'In-game by hand after payment: join DonutSMP with the order username, accept the teleport and pick up the drop. Keep at least 14 inventory slots free – totems do not stack.',
      },
    ],
  },

  'netherite-armor-shulker': {
    seoTitle: 'Netherite Armor Shulker – 6 God Sets, $18.99 | DonutCoins',
    metaDescription:
      'Netherite Armor Shulker for DonutSMP: six maxed netherite sets – Protection IV, Unbreaking III, Mending, Thorns III – for $18.99 instead of $29.94.',
    description:
      'Six complete god-tier netherite sets in one shulker box for $18.99. Every one of the 24 pieces carries Protection IV, Unbreaking III, Mending and Thorns III – the same spec as our single Netherite Armor Set, which costs $4.99, so the shulker saves you about $11 against six singles ($29.94).\n\n' +
      'This is the group buy: gear a whole faction before a war, stock a player shop with sets that sell for coins, or keep five spares so a death on DonutSMP never slows you down. Orders of $15 or more also get the 5% spending discount at checkout.',
    bullets: [
      '6 maxed netherite sets (24 pieces) in one shulker',
      'Protection IV, Unbreaking III, Mending, Thorns III',
      '$18.99 vs $29.94 for six single sets',
      '5% spending discount applies',
    ],
    faq: [
      {
        q: 'Is this the same armor as the single Netherite Armor Set?',
        a: 'Yes, identical enchantments – Protection IV, Unbreaking III, Mending and Thorns III. You simply get six sets in a shulker for less than four singles would cost.',
      },
      {
        q: 'How is the shulker delivered?',
        a: 'In-game by hand. Join DonutSMP with your order username, accept the teleport from our delivery account and take the shulker. One free inventory slot is enough.',
      },
    ],
  },

  // ───────────── TOOLS & WEAPONS ─────────────
  'netherite-sword': {
    seoTitle: 'DonutSMP Netherite Sword (God) – $0.99 | DonutCoins',
    metaDescription:
      'God netherite sword for DonutSMP – Sharpness V, Unbreaking III, Mending, Fire Aspect II, Looting III – for $0.99. Ready for PvP and mob farms.',
    description:
      'A fully enchanted netherite sword for under a dollar: Sharpness V, Unbreaking III, Mending, Fire Aspect II and Looting III, for $0.99. It is the standard PvP blade on DonutSMP and the best tool for farming spawners, where Looting III multiplies the bones, rods and iron you sell.\n\n' +
      'Players buy it to replace a sword lost in a fight, to equip a new alt or recruit, or in multiples because at this price it is cheaper than the XP and books to enchant one. Fire Aspect II also makes it a solid choice for killing golems and skeletons quickly in a farm.',
    bullets: [
      'Sharpness V, Unbreaking III, Mending, Fire Aspect II, Looting III',
      '$0.99 – cheaper than enchanting it yourself',
      'PvP blade and spawner-farm tool in one',
      'Up to 100 per order',
    ],
    faq: [
      {
        q: 'Is this sword good for PvP on DonutSMP?',
        a: 'Yes – Sharpness V is the damage cap and Fire Aspect II adds burn damage. Some players prefer a sword without Fire Aspect for certain fights; this one has it.',
      },
      {
        q: 'Need a stack of them?',
        a: 'The Netherite Swords Shulker holds 27 maxed swords for $21.99, which is cheaper than 27 singles ($26.73).',
      },
    ],
  },

  'netherite-pickaxe': {
    seoTitle: 'DonutSMP Netherite Pickaxe (God) – $0.99 | DonutCoins',
    metaDescription:
      'God netherite pickaxe for DonutSMP – Efficiency V, Unbreaking III, Mending and Fortune III – for $0.99. Mine faster, never repair. Delivered in-game.',
    description:
      'The god pickaxe: Efficiency V, Unbreaking III, Mending and Fortune III on netherite, for $0.99. Efficiency V with a Haste beacon lets you instant-mine stone, Fortune III multiplies diamonds, emeralds and other ore drops, and Mending means you never see an anvil again.\n\n' +
      'On DonutSMP a pickaxe like this pays for itself in one diamond trip. It is also the tool for building spawner rooms and raiding bases quickly – and because it is cheap, players keep a spare in their ender chest for when a death takes the main one.',
    bullets: [
      'Efficiency V, Unbreaking III, Mending, Fortune III',
      '$0.99 each, up to 100 per order',
      'Fortune III for diamonds and emeralds',
      'In-game handover by staff',
    ],
    faq: [
      {
        q: 'Does the pickaxe have Silk Touch?',
        a: 'No – it has Fortune III, which cannot be combined with Silk Touch. If you need Silk Touch for ore blocks, enchant a second pickaxe.',
      },
      {
        q: 'Is there a bulk pickaxe option?',
        a: 'The Netherite Pickaxes Shulker gives you 27 maxed pickaxes for $18.99 instead of $26.73 as singles.',
      },
    ],
  },

  'god-bow': {
    seoTitle: 'DonutSMP God Bow – $0.89 | DonutCoins',
    metaDescription:
      'God bow for DonutSMP – Power V, Punch II, Flame, Infinity and Unbreaking III – for $0.89. Infinite arrows, max damage and knockback. Delivered in-game.',
    description:
      'A fully enchanted bow for $0.89: Power V for maximum arrow damage, Punch II to knock attackers off ledges and out of range, Flame to set them burning, Infinity so a single arrow lasts forever and Unbreaking III for durability. There is no Mending – Infinity and Mending do not stack – which is the standard trade-off on a god bow.\n\n' +
      'On DonutSMP a bow is how you open a fight, finish a runner or keep a mace user at distance. Punch II is especially nasty near cliffs and in the End. Base hunters also use it to clear mobs from range before landing with an elytra.',
    bullets: [
      'Power V, Punch II, Flame, Infinity, Unbreaking III',
      'One arrow, infinite shots',
      '$0.89, up to 100 per order',
      'Handed over in-game by staff',
    ],
    faq: [
      {
        q: 'Why no Mending on the god bow?',
        a: 'Because Infinity and Mending are mutually exclusive. We chose Infinity so you never run out of arrows; Unbreaking III gives the bow a long life, and at $0.89 a replacement is cheap.',
      },
      {
        q: 'Does Infinity work with tipped arrows?',
        a: 'No – Infinity only applies to regular arrows. Keep a few tipped arrows in your inventory if you want them.',
      },
    ],
  },

  mace: {
    seoTitle: 'DonutSMP Mace (Maxed) – $1.49 | DonutCoins',
    metaDescription:
      'Maxed mace for DonutSMP – Density V, Wind Burst III, Mending, Unbreaking III – for $1.49. The one-hit weapon that rules PvP. Delivered in-game.',
    description:
      'The mace changed PvP on DonutSMP: fall from height, land a hit and the smash damage scales with the drop, enough to one-shot full netherite. Ours comes fully enchanted – Density V for extra damage per block fallen, Wind Burst III to launch yourself back up for the next hit, plus Mending and Unbreaking III – for $1.49.\n\n' +
      'Crafting one yourself means finding a heavy core in an ominous trial chamber vault, then enchanting a weapon that only takes books from the same chambers. Buying the finished mace is faster – the core alone is $1.29 and still needs a breeze rod and crafting.',
    bullets: [
      'Density V, Wind Burst III, Mending, Unbreaking III',
      'One-shot potential against full netherite',
      '$1.49 – less than a heavy core',
      'Up to 64 per order',
    ],
    faq: [
      {
        q: 'What enchantments does the DonutSMP mace have?',
        a: 'Density V, Wind Burst III, Mending and Unbreaking III, exactly as listed in the catalog. Breach is not on it – Minecraft does not allow Breach and Density on the same mace. Wind Burst III is the one that makes repeated smash attacks possible.',
      },
      {
        q: 'How do I get the most out of a mace?',
        a: 'Height. Smash damage grows with every block you fall, so combine it with Wind Burst, an elytra or a pillar. Totems of Undying are your counter when facing one – we sell those at $0.25.',
      },
      {
        q: 'How is it delivered?',
        a: 'In-game by hand: log on with your order username, accept the teleport and collect the weapon.',
      },
    ],
  },

  trident: {
    seoTitle: 'DonutSMP Trident (Loyalty, Channeling) – $1.89 | DonutCoins',
    metaDescription:
      'Maxed trident for DonutSMP – Loyalty III, Channeling, Impaling V and Mending – for $1.89. Throw it, summon lightning, get it back. Delivered in-game.',
    description:
      'A maxed trident for $1.89: Loyalty III returns it to your hand after every throw, Channeling calls lightning down on whatever you hit during a storm, Impaling V adds heavy damage against aquatic mobs, and Mending keeps it repaired. Tridents only drop from drowned, and enchanted ones are rare – buying beats fishing for one.\n\n' +
      'On DonutSMP the trident is part weapon, part toy: ranged poke in PvP, and with Channeling the way to make charged creepers, whose explosions drop zombie, skeleton and creeper heads for trophies. This is a Loyalty trident, not Riptide, so it works on dry land.',
    bullets: [
      'Loyalty III, Channeling, Impaling V, Mending',
      'Returns to your hand after every throw',
      'Lightning on hit during storms – charged creepers, mob heads',
      '$1.89, up to 64 per order',
    ],
    faq: [
      {
        q: 'Is this a Riptide trident?',
        a: 'No. Loyalty and Riptide cannot be on the same trident; this one has Loyalty III so it comes back after a throw. Riptide tridents are for water and rain travel only.',
      },
      {
        q: 'How is the trident delivered?',
        a: 'In-game by hand. Join DonutSMP with your order username, accept the teleport from our delivery account and take the item.',
      },
    ],
  },

  'amethyst-pickaxe': {
    seoTitle: 'DonutSMP Amethyst Pickaxe – $4.79 | DonutCoins',
    metaDescription:
      'The DonutSMP Amethyst Pickaxe – the server\'s custom ultra-fast pickaxe for base hunting and mining – for $4.79. Rare in-game, handed over by our staff.',
    description:
      'The Amethyst Pickaxe is a DonutSMP-exclusive item – a custom pickaxe that mines far faster than any vanilla tool. It is the base hunter\'s weapon of choice: tunneling through walls, stripping obsidian vaults and digging out hidden stashes in a fraction of the time a netherite pickaxe needs. We sell it for $4.79.\n\n' +
      'Because it is a server custom item it cannot be crafted and only enters the economy through limited in-game sources, which is why it carries a \'Rare\' tag here and a steep price in coins on the player market. Many buyers pair it with an elytra and totems – which is exactly what the Basehunter Bundle does.',
    bullets: [
      'DonutSMP custom pickaxe – ultra-fast mining',
      'Base hunter\'s essential',
      'Cannot be crafted – rare on the player market',
      '$4.79, up to 32 per order',
    ],
    faq: [
      {
        q: 'What does the Amethyst Pickaxe do on DonutSMP?',
        a: 'It is a server-custom pickaxe that mines dramatically faster than a maxed netherite pickaxe. Players use it mainly for base hunting – breaking into claims, vaults and tunnels quickly.',
      },
      {
        q: 'Is it enchanted?',
        a: 'It comes as the server issues it; the speed is built into the item rather than coming from Efficiency. Ask on Discord if you need the exact current stats before buying.',
      },
      {
        q: 'How is it delivered?',
        a: 'In-game by hand: join DonutSMP with your order username, accept the teleport and collect it.',
      },
    ],
  },

  'netherite-pickaxes-27': {
    seoTitle: 'DonutSMP Netherite Pickaxes Shulker – $18.99 | DonutCoins',
    metaDescription:
      'A shulker of 27 maxed netherite pickaxes for DonutSMP – Efficiency V, Unbreaking III, Mending, Fortune III – for $18.99 instead of $26.73 as singles.',
    description:
      'Twenty-seven god netherite pickaxes – Efficiency V, Unbreaking III, Mending and Fortune III – in one shulker box for $18.99. Bought one at a time they would be $26.73, so the shulker saves about $7.74, and carts of $15 or more get a further 5% off automatically.\n\n' +
      'Who needs 27 pickaxes? Player shops that sell tools for coins, groups kitting out everyone before a mining trip or base raid, and anyone running a reseller business on DonutSMP. A pickaxe is also a popular giveaway item for Discord events and recruitment.',
    bullets: [
      '27 maxed netherite pickaxes in one shulker',
      'Efficiency V, Unbreaking III, Mending, Fortune III',
      '$18.99 vs $26.73 for singles',
      'Shop and group stock',
    ],
    faq: [
      {
        q: 'Are these the same as the single Netherite Pickaxe (God)?',
        a: 'Yes – Efficiency V, Unbreaking III, Mending and Fortune III. The shulker is simply the bulk pack.',
      },
      {
        q: 'How is it delivered?',
        a: 'In-game by hand. Join DonutSMP with the order username, accept the teleport from our delivery account and take the shulker box.',
      },
    ],
  },

  'netherite-swords-27': {
    seoTitle: 'DonutSMP Netherite Swords Shulker – $21.99 | DonutCoins',
    metaDescription:
      'A shulker of 27 maxed netherite swords for DonutSMP – Sharpness V, Fire Aspect II, Looting III, Mending – for $21.99 instead of $26.73 as singles.',
    description:
      'Twenty-seven god netherite swords in one shulker box for $21.99. Each sword carries Sharpness V, Unbreaking III, Mending, Fire Aspect II and Looting III – the same spec as our $0.99 single – so the shulker saves about $4.74 against 27 singles and qualifies for the 5% spending discount on carts of $15 or more.\n\n' +
      'Swords in bulk are bought by player shops, by factions arming up for a war on DonutSMP, and by farm owners who hand out Looting III blades to everyone grinding their spawners. Twenty-seven is a full shulker, which also makes it the neat unit for reselling.',
    bullets: [
      '27 maxed netherite swords in one shulker',
      'Sharpness V, Fire Aspect II, Looting III, Mending, Unbreaking III',
      '$21.99 vs $26.73 for singles',
      'Faction and shop stock',
    ],
    faq: [
      {
        q: 'Are the swords identical to the single Netherite Sword (God)?',
        a: 'Yes – same five enchantments. The shulker is the bulk pack with a lower per-sword price (about $0.81 each).',
      },
      {
        q: 'How is it delivered?',
        a: 'In-game by hand: be online with your order username, accept the teleport and collect the shulker box.',
      },
    ],
  },

  // ───────────── BUNDLES ─────────────
  'starter-bundle': {
    seoTitle: 'DonutSMP Starter Bundle – $9.49 | DonutCoins',
    metaDescription:
      'DonutSMP Starter Bundle for $9.49: 20M money, 15 skeleton spawners and six diamond armor sets – about $10.54 separately. Money by /pay, items in-game.',
    description:
      'The Starter Bundle is the fastest way to go from fresh spawn to self-sufficient on DonutSMP: 20M money, 15 Skeleton Spawners and a Diamond Armor Shulker (six full Protection IV sets) for $9.49. Bought separately those three lines cost about $10.54.\n\n' +
      'The idea is simple. The spawners become your first farm and income, the money covers a claim, hoppers and chests to build it, and the armor keeps you alive while you set up. Fifteen skellies is enough to produce real bones-and-arrows money from day one, and the 20M gives you room to buy more from players as you grow.',
    bullets: [
      '20M money + 15 skeleton spawners + 6 diamond sets',
      '$9.49 – about $10.54 separately',
      'Everything a new player needs on day one',
      'Money by /pay, items handed over in-game',
    ],
    faq: [
      {
        q: 'How is the Starter Bundle delivered?',
        a: 'In two steps by the same staff member: the 20M goes to your balance with /pay, then you accept a teleport in-game and pick up the 15 spawners and the armor shulker. Both show on your order page.',
      },
      {
        q: 'Can I swap the spawners for a different type?',
        a: 'Not in the bundle itself – the contents are fixed. Add zombie, iron golem or blaze spawners as separate lines; they are priced from $0.39 each.',
      },
      {
        q: 'Is this bundle a good first order?',
        a: 'Yes – it is what we recommend to anyone starting out, and at $9.49 it is a low-risk way to test our delivery before a bigger money pack.',
      },
    ],
  },

  'spawner-farm-bundle': {
    seoTitle: 'DonutSMP Spawner Farm Bundle – $25.99 | DonutCoins',
    metaDescription:
      'Spawner Farm Bundle for DonutSMP: 64 skeleton spawners plus 10M money to build the farm, for $25.99 in one order. Spawners in-game, money by /pay.',
    description:
      'A full stack of 64 Skeleton Spawners plus 10M money, for $25.99. Sixty-four skellies is the classic DonutSMP farm size – one big spawner room, a drop chute, a kill platform – and the 10M pays for the hoppers, chests, water and claim blocks to build it.\n\n' +
      'Players buy this bundle when they are done with small farms and want an income that runs while they are offline. Bones sell steadily, arrows sell steadily, and the XP from 64 stacked spawners keeps every Mending tool and armor piece topped up. It is also the bundle to grab when a base raid wipes your old farm.',
    bullets: [
      '64 skeleton spawners – a full stack',
      '10M money to build the farm',
      '5% spending discount applies at checkout',
      'Spawners shulkered, money by /pay',
    ],
    faq: [
      {
        q: 'How is the Spawner Farm Bundle delivered?',
        a: 'The 10M is sent to your balance with /pay; the 64 spawners come in a shulker box handed over in-game after you accept the teleport from our staff account. Both steps are listed on the order page.',
      },
      {
        q: 'Is the bundle cheaper than buying the parts?',
        a: 'At current prices it is roughly on par: 64 skellies at the 50+ tier plus 10M come to about $27.40 as separate lines, versus $25.99 here. The bundle comes in under the price of the parts, and the 5% spending discount applies either way.',
      },
      {
        q: 'How much money does a 64-spawner farm make?',
        a: 'It depends on sell prices and how long you let it run, but a stacked 64-skelly farm is one of the standard money makers on DonutSMP. We do not quote earnings per hour because they change with the server economy.',
      },
    ],
  },

  'pro-bundle': {
    seoTitle: 'DonutSMP Pro Bundle – $40.99 | DonutCoins',
    metaDescription:
      'Pro Bundle for DonutSMP: 50M money, an elytra with Unbreaking III and Mending and 16 skeleton spawners for $40.99 – with the 8% spending discount.',
    description:
      'The Pro Bundle packs the three things an established DonutSMP player wants into one order: 50M money, an Elytra (Unbreaking III + Mending) and 16 Skeleton Spawners, for $40.99. As separate lines – the 50M pack, the elytra and 16 skellies – that is about $42.86, and because the cart passes $40 the 8% spending discount comes off automatically at checkout.\n\n' +
      'It is the upgrade path after a starter farm: the elytra opens up base hunting and fast travel, the spawners double a small farm, and 50M is enough to buy maxed gear, a bigger claim or whatever the player market has on offer that week.',
    bullets: [
      '50M money + elytra + 16 skeleton spawners',
      'Elytra with Unbreaking III and Mending',
      '8% spending discount at checkout',
      '$40.99 – about $42.86 as separate lines',
    ],
    faq: [
      {
        q: 'How is the Pro Bundle delivered?',
        a: 'Money first with /pay to your balance, then an in-game teleport from our staff account to hand over the elytra and the spawners. Everything is tracked on your order page.',
      },
      {
        q: 'What does it cost with the spending discount?',
        a: 'With the default 8% tier for carts of $40+, the bundle comes to about $37.71 before any coupon.',
      },
      {
        q: 'Do I need to be online for the whole delivery?',
        a: 'For the items, yes – they are handed over in person. The money part can go through while you are offline, but we deliver both together whenever you are on.',
      },
    ],
  },

  'basehunter-bundle': {
    seoTitle: 'DonutSMP Basehunter Bundle – $37.99 | DonutCoins',
    metaDescription:
      'Basehunter Bundle for DonutSMP: elytra, Amethyst Pickaxe, 16 totems and 20M money for $37.99 – the full base-hunting loadout, delivered by our staff.',
    description:
      'Base hunting on DonutSMP needs four things: a way to get there, a way to get in, a way to survive and money to make the trip worth it. The Basehunter Bundle has all four – an Elytra (Unbreaking III + Mending), the server-custom Amethyst Pickaxe, 16 Totems of Undying and 20M money – for $37.99. On its own that sits in the 5% spending tier ($36.09 at checkout); add any $2 item to pass $40 and get 8% off the whole cart.\n\n' +
      'The elytra covers thousands of blocks in minutes, the Amethyst Pickaxe chews through walls and vaults faster than any netherite tool, sixteen totems mean traps and ambushes do not end the run, and the 20M buys rockets, food and whatever you cannot loot.',
    bullets: [
      'Elytra + Amethyst Pickaxe + 16 totems + 20M',
      'Complete base-hunting loadout',
      '5% spending discount at checkout (8% from $40)',
      'Items in-game, money by /pay',
    ],
    faq: [
      {
        q: 'How is the Basehunter Bundle delivered?',
        a: 'The 20M arrives via /pay; the elytra, Amethyst Pickaxe and 16 totems are handed over in-game after you accept a teleport from our staff account. Keep at least 18 inventory slots free – totems do not stack.',
      },
      {
        q: 'What does the Amethyst Pickaxe do?',
        a: 'It is a DonutSMP-exclusive pickaxe that mines far faster than a maxed netherite one, which is why base hunters use it to break into vaults and tunnels quickly.',
      },
      {
        q: 'Do I need rockets?',
        a: 'Yes, and they are not included – use part of the 20M to buy them from a player shop, or add a Creeper Spawner ($0.69) to farm gunpowder for your own.',
      },
    ],
  },

  'rich-bundle': {
    seoTitle: 'DonutSMP Rich Bundle – $79.99 | DonutCoins',
    metaDescription:
      'Rich Bundle for DonutSMP: 250M money, a God Mystery Box, an elytra and the full PvP Kit for $79.99 – about $89.96 separately, with 8% off at checkout.',
    description:
      'The Rich Bundle is the whale order: 250M money, a God Mystery Box (five drops with roughly 11% elytra odds per roll), a guaranteed Elytra and the complete PvP Kit – maxed netherite set, sword, pickaxe and 8 totems – for $79.99. Bought as separate lines that is about $89.96, and the 8% spending discount for carts over $40 comes off on top.\n\n' +
      'It is built for players who want to arrive on DonutSMP, or come back to it, already at the top: a balance that competes on /baltop, the gear to hold it, flight, and a box roll that can add a second elytra, dragon heads or another 50M.',
    bullets: [
      '250M + God Mystery Box + elytra + PvP Kit',
      '$79.99 – about $89.96 as separate lines',
      '8% spending discount at checkout',
      'Box drops rolled on order, visible on the order page',
      'Delivered in stages by real staff',
    ],
    faq: [
      {
        q: 'What is the final price after discounts?',
        a: 'With the default 8% tier for carts of $40 or more, the bundle comes to about $73.59 before any coupon. Referral credit and one coupon can be applied on top.',
      },
      {
        q: 'Is the elytra in the bundle separate from the box?',
        a: 'Yes. The elytra is a guaranteed line; the God Mystery Box is rolled on top of it, so a lucky box can give you a second one.',
      },
      {
        q: 'How is the Rich Bundle delivered?',
        a: '250M via /pay (usually split into a few transfers), the items in one or two in-game handovers after you accept a teleport. Keep plenty of inventory space – the PvP Kit alone is 14 slots because totems do not stack.',
      },
    ],
  },

  // ───────────── BASES ─────────────
  'starter-base': {
    seoTitle: 'DonutSMP Starter Base (Coordinates) – $4.99 | DonutCoins',
    metaDescription:
      'Buy a ready-made DonutSMP starter base for $4.99: a hidden base with chests, a farm and a spawner room. Coordinates sent by Discord ticket. Limited stock.',
    description:
      'A Starter Base is a small, hidden base on DonutSMP that we have already built and stocked: storage chests, a basic crop farm and a spawner room, in a quiet spot away from spawn. For $4.99 you skip the first evening of digging and start playing from a place that is actually safe.\n\n' +
      'Bases are different from everything else in our DonutSMP shop because they cannot be handed over as items. After payment you open a ticket on our Discord with your order ID and we send you the coordinates and any notes about the layout. From then on it is yours – claim it, expand it, or strip it.\n\n' +
      'Because every base is a real build on the live server, stock is limited and the listing shows as sold out whenever none are ready. One base per order; check back or ask on Discord if you want to be told when the next one is available.',
    bullets: [
      'Pre-built hidden base with chests, farm and spawner room',
      'Coordinates delivered by Discord ticket',
      '$4.99, one per order',
      'Limited stock – real builds on the live server',
    ],
    faq: [
      {
        q: 'How do I receive a base?',
        a: 'Not in-game. After your payment is confirmed, open a ticket on our Discord with your order ID and we send the coordinates plus a short description of what is there. Claim the area as soon as you arrive.',
      },
      {
        q: 'Why is the Starter Base sold out?',
        a: 'Each base is built by hand on DonutSMP, so we only list what exists right now. When the listing shows no stock, none are ready – ask on Discord to be notified.',
      },
      {
        q: 'Is the base guaranteed to be untouched?',
        a: 'We never resell the same coordinates twice. Once they are yours, keeping the base secret and claimed is up to you – claim it on arrival.',
      },
    ],
  },

  'loaded-base': {
    seoTitle: 'DonutSMP Loaded Base (Coordinates) – $14.99 | DonutCoins',
    metaDescription:
      'Buy an established DonutSMP base for $14.99: stocked storage, a working spawner farm and room to expand. Coordinates sent by Discord ticket. Limited stock.',
    description:
      'A Loaded Base is an established DonutSMP base we have built up over time and are handing over complete: stocked storage, a working spawner farm that is already producing, and the infrastructure around it. For $14.99 you take over a base that would take weeks to build and fill yourself.\n\n' +
      'It suits players who are returning after a break, moving to the server from elsewhere, or simply done with the early grind. Everything inside is yours to keep, use or sell – farm the spawners, empty the chests into your own vault, or run it as your main base.\n\n' +
      'Delivery is by coordinates: after your payment is confirmed, open a ticket on our Discord with your order ID and we send the location and a short rundown of what is there. Stock is limited to the bases that actually exist, so the listing shows as sold out between builds. One base per order.',
    bullets: [
      'Established base with stocked storage',
      'Working spawner farm included',
      'Coordinates by Discord ticket after payment',
      '$14.99, one per order, limited stock',
    ],
    faq: [
      {
        q: 'What exactly is in a Loaded Base?',
        a: 'A built base with storage that has stock in it and a spawner farm that works. Exact contents vary from base to base – ask on Discord before buying if you want details on the one currently listed.',
      },
      {
        q: 'How is a Loaded Base delivered?',
        a: 'By coordinates in a Discord ticket, not in-game. Open the ticket with your order ID after paying; we reply with the location and notes. Claim it as soon as you arrive.',
      },
      {
        q: 'Can I get a refund if I do not like the base?',
        a: 'Coordinates cannot be taken back once sent, so ask about the contents before you buy. Delivered orders are final under our refund policy, which also covers the exceptions.',
      },
    ],
  },
};

/** Copy for a product id, or undefined for unknown/custom (admin-created) products. */
export function copyFor(id: string): ProductCopy | undefined {
  return Object.prototype.hasOwnProperty.call(productCopy, id) ? productCopy[id] : undefined;
}
