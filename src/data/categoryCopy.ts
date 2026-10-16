import type { CategoryId } from '../shared/types';

/**
 * SEO copy for the category pages (/shop/:category) and the shop index (/shop).
 *
 * ORIGINAL English text. Every price, bulk tier and box figure quoted here
 * mirrors the DEFAULT catalog in src/data/catalog.ts and the default spending
 * tiers in settings.ts ($15 → 5%, $40 → 8%, $100 → 12%). If the admin changes
 * a price, update the matching sentence here too.
 *
 * Honesty rules: delivery is manual by our staff (no bot), usually within
 * 5–30 minutes while online; DonutCoins is not affiliated with DonutSMP,
 * Mojang or Microsoft; DonutSMP's rules prohibit real-money trading and buying
 * is the customer's own responsibility. No invented stats or reviews.
 *
 * Layout hint for the integrator: `intro` goes under the category title,
 * `body` paragraphs + `faq` below the product grid (faq can feed FAQPage JSON-LD).
 */
export interface CategoryCopy {
  /** <title> – ≤ 60 characters, main keyword first */
  seoTitle: string;
  /** meta description – 120–155 characters */
  metaDescription: string;
  /** 60–100 words, shown under the category title */
  intro: string;
  /** 2–4 paragraphs of 50–90 words, shown below the product grid */
  body: string[];
  /** 3–4 questions, shown below the body (and usable as FAQPage structured data) */
  faq: { q: string; a: string }[];
}

export const categoryCopy: Record<CategoryId, CategoryCopy> = {
  // ───────────── MONEY ─────────────
  money: {
    seoTitle: 'DonutSMP Money Packs 10M–1B & Bulk Prices | DonutCoins',
    metaDescription:
      'Buy DonutSMP money from $0.18 per 1M, down to $0.13 in bulk, or fixed packs from 10M to 1B. Paid to your balance with /pay by real staff within minutes.',
    intro:
      'Buy DonutSMP money without the grind. Pick any amount in millions or grab a fixed pack from 10M to 1B, pay with PayPal, crypto or card, and our staff send the coins to your in-game balance with /pay. The base rate is $0.18 per 1M and drops automatically to $0.13 per 1M on large orders; the fixed packs are even cheaper per million at round numbers. No bots, no account access – just your username, an order ID and a payment confirmation in chat.',
    body: [
      'Money is the engine of the DonutSMP player economy. Spawners on the auction house, netherite, totems, claim blocks and shop slots are all priced in it, and the balance top is the server\'s scoreboard. Farming a few hundred million by hand takes days of AFK time; ordering it takes a couple of minutes at checkout. Most customers buy money first and spawners second, because the money funds the farm that keeps paying afterwards.',
      'Prices work two ways. The pick-your-amount product charges $0.18 per 1M and steps down to $0.17 from 50M, $0.16 from 100M, $0.15 from 250M, $0.14 from 500M and $0.13 from 1B – the lower rate applies to every million in the line. Fixed packs are cheaper still at their size: 50M is $7.49, 100M is $13.99, 250M is $32.99 and 1B is $114.99, which works out to about $0.115 per million.',
      'On top of that, carts over $15 get 5% off, over $40 get 8% and over $100 get 12%, applied automatically. You can add one coupon per order – the welcome code when it is enabled, a daily spin prize or a referral discount – and store credit on top. The total discount is capped at 60%, which you only reach by stacking a big spin coupon on a large order.',
      'Delivery is manual. After you pay and report the reference, a member of our staff logs on to DonutSMP and runs /pay to the exact username on your order – usually within 5–30 minutes while we are online, as shown by our Discord status. You see the server\'s own confirmation in chat and the order page switches to delivered. Very large amounts may arrive in several payments to keep things discreet. Nothing is automated and nobody asks for your password.',
    ],
    faq: [
      {
        q: 'How much does DonutSMP money cost?',
        a: '$0.18 per million for any amount, falling to $0.13 per 1M from 1B upward. The fixed packs are the cheapest per million: 100M for $13.99, 500M for $61.99 and 1B for $114.99. Spending discounts of 5–12% come off on top of those prices.',
      },
      {
        q: 'Do I need to be online to receive DonutSMP money?',
        a: 'Usually not – a /pay reaches an offline balance on most setups. We still recommend staying online so you can watch the confirmation in chat and leave a review straight away. Items, unlike money, always need you online for the hand-off.',
      },
      {
        q: 'Can I buy an odd amount like 37M?',
        a: 'Yes. On the pick-your-amount product the quantity is the number of millions, so 37 means 37M and costs 37 × $0.18 = $6.66. Bulk tiers apply automatically once a line reaches 50M, 100M, 250M, 500M or 1B.',
      },
      {
        q: 'Is buying DonutSMP money against the rules?',
        a: 'DonutSMP\'s rules prohibit trading in-game money for real currency, and enforcement is the server\'s decision. We deliver with a normal /pay, keep it discreet and never ask for your account, but the risk is yours. DonutCoins is not affiliated with DonutSMP or Mojang.',
      },
    ],
  },

  // ───────────── SPAWNERS & ITEMS ─────────────
  spawners: {
    seoTitle: 'Buy DonutSMP Spawners – Skeleton from $0.36 | DonutCoins',
    metaDescription:
      'DonutSMP spawners delivered in-game by hand: skeleton spawners from $0.36, iron golem from $0.40, blaze from $0.84, plus Elytra, shulker boxes and totems.',
    intro:
      'Spawners are the best long-term buy on DonutSMP: a skeleton spawner farm pays you every hour you are online. This category has the five spawner types players actually use – skeleton, iron golem, zombie, creeper and blaze – plus the items that go with them: the Elytra (Unbreaking III + Mending), shulker boxes and totems of undying. Skeleton spawners start at $0.43 each and drop to $0.36 at 250 or more. Everything is handed over in-game by our staff, usually within minutes.',
    body: [
      'A skeleton spawner is the DonutSMP standard for a reason: bones, arrows and XP with nothing to feed, and it stacks cleanly into farms that sell to the server shop while you AFK. Iron golem spawners give iron for the shop and for builds, zombies are the cheap XP option, creepers turn into rocket fuel for your Elytra, and blaze spawners cover brewing and some of the fastest XP on the server.',
      'Prices depend on quantity. Skeleton spawners are $0.43 each, $0.42 at 25+, $0.40 at 50+, $0.38 at 100+ and $0.36 at 250+. Iron golem spawners are $0.45 ($0.40 at 100+), zombies $0.39 ($0.36 at 50+), creepers $0.69 ($0.65 at 25+) and blazes $0.89 ($0.84 at 25+). An Elytra is $28.49, a shulker box $0.29 and a totem of undying $0.25, with 64 totems at $0.19 each.',
      'Items cannot be sent with a command, so delivery is a hand-off. Join DonutSMP with the username on your order, accept the teleport request from our delivery account and pick up the drop – spawners come in shulker boxes for larger orders. Make sure you have inventory space and are somewhere safe. Our staff do this manually, usually within 5–30 minutes while online, and the order page shows every step.',
      'Watch the tier edges: 45 skeleton spawners cost $18.90 but 50 cost $20.00 – five more spawners for $1.10. The Spawner Farm Bundle pairs 64 skeleton spawners with 10M for the build, and the Pro Bundle adds an Elytra. Spawners can be mined back with a silk touch pickaxe on DonutSMP, so a hidden farm is a movable asset – and also what base hunters look for, so place it carefully.',
    ],
    faq: [
      {
        q: 'How much is a skeleton spawner on DonutSMP?',
        a: 'In our store a skeleton spawner is $0.43, dropping to $0.42 at 25+, $0.40 at 50+, $0.38 at 100+ and $0.36 at 250+. A full 64-spawner room is therefore $25.60 at the 50+ tier, before the 5% spending discount for carts over $15 (8% from $40).',
      },
      {
        q: 'How are spawners delivered?',
        a: 'By hand, in-game. Be online on DonutSMP with your order username, accept the teleport from our delivery account and pick up the drop; big orders arrive in shulker boxes. There is no bot – a member of our staff does it, usually within 5–30 minutes while we are online.',
      },
      {
        q: 'Which spawner is best for making money on DonutSMP?',
        a: 'Skeleton spawners are the safe default: cheap, easy to farm and always sellable on the auction house. Iron golem spawners earn well when iron sells high, and blaze spawners give the best XP. Server shop prices change between seasons, so check /shop before you commit to one type.',
      },
      {
        q: 'Do the bulk prices combine across spawner types?',
        a: 'No – tiers apply per product line, so 30 skeleton and 30 zombie spawners are two lines at their own tiers. The whole cart still counts toward the spending discount: 5% over $15, 8% over $40 and 12% over $100.',
      },
    ],
  },

  // ───────────── MYSTERY BOXES ─────────────
  mystery: {
    seoTitle: 'DonutSMP Mystery Boxes & Crates – Shop All 6 | DonutCoins',
    metaDescription:
      'DonutSMP mystery boxes from $2.49 with public odds: Coin Crate (5M–100M), Elite and God boxes with Elytra chances, Legendary Crate with guaranteed Elytra.',
    intro:
      'Mystery boxes are the fun way to shop for DonutSMP loot: every box has a public drop table, the rolls happen on our server the moment you order, and the result is listed on your order page before it is handed over in-game. Six boxes cover every budget – from the $2.49 Coin Crate that always pays between 5M and 100M to the $49.99 Legendary Crate with a guaranteed Elytra and 50M. The exact odds are shown under "What\'s inside?" on each box.',
    body: [
      'Each line in a box has a weight; its chance on a single roll is that weight divided by the pool total. Boxes with several rolls draw without repeats, so a three-roll box always contains three different lines and the box-wide chance of any line is higher than the per-roll figure. Guaranteed lines are included in every box. There is no re-rolling and no hidden pool – what the page shows is what the server rolls.',
      'The Coin Crate ($2.49) is money only and averages about 13M per crate. The Spawner Crate ($3.99) draws two spawner lines and contains skeleton spawners in roughly 79% of crates. The Mystery Box ($5.69) rolls three times with an Elytra in about 3% of boxes, the Elite Mystery Box ($12.49) four times at roughly 19%, and the God Mystery Box ($28.99) five times with an Elytra in well over half of all boxes.',
      'The Legendary Crate ($49.99) skips the gamble on the headline items: an Elytra and 50M are guaranteed, then six more lines are drawn from a pool of dragon heads, netherite blocks, blaze and iron golem spawners, heavy cores, totems, a maxed netherite armor set, a mace and a 100M money line. All box contents are delivered like normal items – teleport, drop, done – and money lines are paid to your balance with /pay.',
      'Treat boxes as entertainment with a floor, not as a discount. If you simply want money, the money packs are cheaper per million than the Coin Crate; if you simply want an Elytra, buying it outright for $28.49 beats every random box. Boxes make sense when you would be happy with most lines in the pool – and the Elite and God pools contain no filler lines at all.',
    ],
    faq: [
      {
        q: 'Are DonutSMP mystery box odds real?',
        a: 'Yes. The weights are public on every box, the roll happens on our server when the order is created, and the rolled contents are written to your order page before delivery. You receive exactly what was rolled – no re-rolls, no hidden pool.',
      },
      {
        q: 'Which mystery box has the best Elytra odds?',
        a: 'The Legendary Crate ($49.99) includes an Elytra every time. Among random boxes the God Mystery Box ($28.99) lands one in well over half of all boxes, the Elite Mystery Box ($12.49) in roughly 19% and the standard Mystery Box ($5.69) in about 3%.',
      },
      {
        q: 'Can I get the same item twice in one box?',
        a: 'No. Rolls within one box are drawn without repeats, so every line in your result is different. If you want more rolls on the same pool, order several boxes – you can add up to 50 of most boxes to one order.',
      },
      {
        q: 'How are mystery box drops delivered?',
        a: 'Items are handed over in-game by our staff: accept the teleport from our delivery account and pick up the drop, usually within 5–30 minutes while we are online. Money drops such as the Coin Crate payout are sent to your balance with /pay.',
      },
    ],
  },

  // ───────────── INVESTMENTS ─────────────
  investments: {
    seoTitle: 'Buy DonutSMP Netherite & Investment Items | DonutCoins',
    metaDescription:
      'DonutSMP investment items at bulk prices: nether stars from $0.15, enchanted golden apples from $0.40, netherite ingots from $2.89, blocks, dragon heads.',
    intro:
      'Investments on DonutSMP are the items players hoard because they hold value between seasons: netherite, gilded blackstone, nether stars, enchanted golden apples, deepslate emerald ore, ancient debris, heavy cores and dragon heads. They are the currency of big trades and the backing of a serious balance. This category sells them individually at bulk tiers and in three fixed portfolio boxes with no random element – you see every item before you pay. Delivered in-game by our staff, usually within minutes.',
    body: [
      'Why these items? Money on DonutSMP can inflate when farms get cheaper, but rare blocks and drops are limited by how hard they are to obtain. Netherite blocks and dragon heads are the classic stores of value, gilded blackstone and emerald ore are flex blocks for bases, and enchanted golden apples and nether stars are consumed in fights and beacons, which keeps demand steady. Many players simply want a stash that looks impressive in a trade.',
      'Nether stars are $0.19 each ($0.15 at 128+), enchanted golden apples $0.47 ($0.40 at 64+), gilded blackstone $0.72 ($0.68 at 32+), deepslate emerald ore and ancient debris $0.57 ($0.52 at 32+), heavy cores $1.29, netherite ingots $3.29 ($2.89 at 36+), netherite blocks $14.49 ($13.49 at 4+) and dragon heads $18.99. Every tier applies to the whole line, not only to the units above the threshold.',
      'The three Investment Boxes are kits, not gambles. The Starter box ($9.49) holds a netherite ingot, 4 gilded blackstone, 8 nether stars, 4 enchanted golden apples and 4 deepslate emerald ore. The Value box ($37.99) adds a netherite block, a heavy core and 32 nether stars; the Elite box ($47.99) tops it with a dragon head, 6 ingots and 32 each of gilded blackstone and enchanted golden apples.',
      'Everything is handed over in-game: accept the teleport from our delivery account and collect the drop, shulkered for bigger orders. Keep valuables in an Ender Chest or a claimed, hidden base – we cannot replace items lost to a raid after delivery. Honest note: DonutSMP\'s rules prohibit real-money trading; we deliver through normal player actions and keep it discreet, but the risk is yours.',
    ],
    faq: [
      {
        q: 'Which DonutSMP item holds its value best?',
        a: 'Nothing is guaranteed – the economy moves with every season. Netherite blocks and dragon heads are the items most players treat as long-term stores of value because they are hard to farm, while nether stars and enchanted golden apples get used up, which keeps them in demand.',
      },
      {
        q: 'What is the cheapest way to buy netherite on DonutSMP?',
        a: 'Netherite blocks. One block is nine ingots\' worth for $14.49 ($13.49 at 4+), while nine loose ingots cost $27.81 at the 9+ tier. If you can smelt, four ancient debris at $0.52 each ($2.08) plus gold make one ingot – under the $2.89 bulk ingot price.',
      },
      {
        q: 'Is the Investment Box random?',
        a: 'No. The Starter, Value and Elite Investment Boxes are fixed kits – the product page lists every item and quantity, and that is exactly what is delivered. For random drops look at the Mystery Boxes category instead.',
      },
      {
        q: 'How are large stacks delivered?',
        a: 'In shulker boxes, handed over in-game by our staff after you accept the teleport from our delivery account. Bring inventory space, pick a safe spot and store the shulkers in an Ender Chest or your base straight away.',
      },
    ],
  },

  // ───────────── ARMOR ─────────────
  armor: {
    seoTitle: 'DonutSMP God Armor – Netherite Sets from $4.99 | DonutCoins',
    metaDescription:
      'Maxed DonutSMP armor delivered in-game: god netherite set (Prot IV, Unbreaking III, Mending, Thorns III) $4.99, Diamond Armor Shulker $0.49, PvP Kit $8.49.',
    intro:
      'Armor on DonutSMP decides whether a fight ends with a totem pop or a lost heart. This category sells finished sets: a god netherite set with Protection IV, Unbreaking III, Mending and Thorns III for $4.99, a Diamond Armor Shulker with six full Protection IV sets for $0.49, single-piece diamond shulkers with 27 pieces each, the PvP Kit with armor, sword, pickaxe and 8 totems, and a shulker of six maxed netherite sets. All handed over in-game by our staff.',
    body: [
      'Netherite versus diamond is a budget question, not a quality one – both are enchanted as far as we can take them on DonutSMP. Diamond sets at $0.49 for six are what you wear when you expect to die: base hunting, raiding, anything in the End. The $4.99 netherite set is your main kit, and the $18.99 Netherite Armor Shulker gives six of them for players who PvP every day or outfit a team.',
      'Every piece carries Protection IV, Unbreaking III and Mending; the netherite sets add Thorns III, and the diamond leggings and boots shulkers come with Blast Protection IV for creeper and TNT traps. Pieces are delivered unworn with full durability. The PvP Kit ($8.49) bundles a maxed netherite set with a Sharpness V sword, an Efficiency V pickaxe and 8 totems of undying – a complete fight kit in one order.',
      'Armor is handed over as a shulker or a drop: join DonutSMP with your order username, accept the teleport request from our delivery account and pick it up. Staff deliver manually, usually within 5–30 minutes while online. Take the hand-off somewhere safe – your base or spawn – because a loaded shulker on the ground is exactly what base hunters look for.',
      'If you only ever lose one slot, the single-piece shulkers ($1.39 for 27 helmets, chestplates, leggings or boots) are the cheapest way to never run out of a chestplate again. Pair any set with a stack of totems from the spawners category ($0.19 each at 64) and an Elytra, and keep a spare set in your Ender Chest so one death does not end the session.',
    ],
    faq: [
      {
        q: 'What enchantments does the god netherite armor have?',
        a: 'Protection IV, Unbreaking III, Mending and Thorns III on all four pieces. Diamond sets have Protection IV, Unbreaking III and Mending; the diamond leggings and boots shulkers use Blast Protection IV instead of Protection.',
      },
      {
        q: 'Why is the Diamond Armor Shulker only $0.49 for six sets?',
        a: 'Because diamond gear is cheap to mass-produce on DonutSMP with XP farms and villager trades, so its in-game value is low. We price it accordingly. Netherite costs more because every piece needs netherite ingots, which are far scarcer.',
      },
      {
        q: 'Can I choose different enchantments?',
        a: 'The listed sets come as described. For a custom enchantment combination, a specific armor trim or a larger quantity, message us on Discord before ordering and we will quote a price if we can source it.',
      },
      {
        q: 'Is buying DonutSMP armor allowed?',
        a: 'DonutSMP\'s rules prohibit trading items for real money, so buying is at your own risk. We deliver through normal gameplay – a teleport and a drop – and keep it discreet, but enforcement is the server\'s decision. Read our IRL trading guide before your first order.',
      },
    ],
  },

  // ───────────── TOOLS & WEAPONS ─────────────
  tools: {
    seoTitle: 'DonutSMP God Tools & Weapons – Mace, Sword | DonutCoins',
    metaDescription:
      'Maxed DonutSMP tools and weapons delivered in-game: god netherite sword and pickaxe $0.99, God Bow $0.89, Mace $1.49, Trident $1.89, Amethyst Pickaxe.',
    intro:
      'Fully enchanted tools and weapons for DonutSMP, ready to use the moment they land in your inventory. The god netherite sword (Sharpness V, Fire Aspect II, Looting III) and pickaxe (Efficiency V, Fortune III) are $0.99 each, the God Bow with Infinity is $0.89, the Mace with Density V and Wind Burst III is $1.49 and the Loyalty III trident is $1.89. Base hunters get the DonutSMP-exclusive Amethyst Pickaxe. The netherite sword, pickaxe, mace and Amethyst Pickaxe include Mending and Unbreaking III; the God Bow trades Mending for Infinity, and the trident has Mending without Unbreaking.',
    body: [
      'On a lifesteal server the weapon decides the trade. The Mace with Density V and Wind Burst III is the current meta for one-shot plays from height, the Sharpness V sword with Fire Aspect II and Looting III handles everything else and doubles as a farming tool, and the Power V, Punch II, Flame, Infinity bow needs one arrow forever. The trident with Loyalty III, Channeling and Impaling V is the pick for rain fights and water.',
      'Single tools are priced to be disposable: $0.99 for the sword or pickaxe, $0.89 for the bow, $1.49 for the mace and $1.89 for the trident. If you lose gear regularly, the 27-piece shulkers are cheaper per item – 27 maxed netherite pickaxes for $18.99 (about $0.70 each) and 27 maxed netherite swords for $21.99 (about $0.81 each). The Amethyst Pickaxe, DonutSMP\'s custom ultra-fast pickaxe, is $4.79.',
      'Tools are handed over in-game by our staff: accept the teleport from the delivery account, pick up the drop, done – usually within 5–30 minutes while we are online. Most tools here have Mending (the God Bow swaps it for Infinity), so a few minutes at an XP farm repairs a full fight\'s wear. Keep spares in an Ender Chest; the Basehunter Bundle pairs the Amethyst Pickaxe with an Elytra, 16 totems and 20M.',
    ],
    faq: [
      {
        q: 'What enchantments are on the god sword and pickaxe?',
        a: 'The netherite sword has Sharpness V, Unbreaking III, Mending, Fire Aspect II and Looting III. The netherite pickaxe has Efficiency V, Unbreaking III, Mending and Fortune III. Both are $0.99 each or $21.99 / $18.99 for a shulker of 27.',
      },
      {
        q: 'What is the DonutSMP Amethyst Pickaxe?',
        a: 'A DonutSMP custom item that mines much faster than a normal netherite pickaxe, which is why base hunters use it to dig through tunnels and stash walls quickly. It is $4.79 in our store and is delivered like any other item.',
      },
      {
        q: 'Is the Mace worth buying on DonutSMP?',
        a: 'If you PvP, yes – Density V and Wind Burst III make it the strongest burst weapon on the server, and ours has Mending and Unbreaking III. For farming and general play the $0.99 sword is the better everyday tool.',
      },
      {
        q: 'Can I buy tools in bulk?',
        a: 'Yes. The pickaxe and sword shulkers hold 27 maxed tools each, and single tools can be ordered up to 100 per line. For larger or mixed orders, message us on Discord for a quote.',
      },
    ],
  },

  // ───────────── BUNDLES ─────────────
  bundles: {
    seoTitle: 'DonutSMP Bundles – Starter Packs from $9.49 | DonutCoins',
    metaDescription:
      'DonutSMP bundles delivered in-game: Starter Bundle with 20M, 15 skeleton spawners and diamond armor $9.49, Pro Bundle with Elytra, Rich Bundle with 250M.',
    intro:
      'Bundles are the fastest way to go from fresh spawn to running farm on DonutSMP. Each one combines money, spawners and gear in a single order with one delivery: the Starter Bundle ($9.49) covers 20M, 15 skeleton spawners and a Diamond Armor Shulker; the Pro Bundle ($40.99) steps up to 50M, 16 spawners and an Elytra; the Rich Bundle ($79.99) brings 250M, a God Mystery Box, an Elytra and the full PvP Kit. Every item is listed before you buy.',
    body: [
      'Bundles are for new players who do not want to research what a first farm needs, returning players after a season reset, and anyone gifting a friend a head start. The Starter Bundle is enough to place a small skeleton farm, sell the first drops and buy more spawners with the 20M; the Spawner Farm Bundle (64 skeleton spawners plus 10M, $25.99) is the one-order farm for players who already have a base.',
      'Bundle pricing is easy to check because every bundle lists its exact contents. The Rich Bundle\'s parts – a 250M pack, God Mystery Box, Elytra and PvP Kit – add up to about $98.96 bought separately, against $79.99 as a bundle, and the Starter and Pro bundles also come in under their parts. The Spawner Farm and Basehunter bundles are convenience sets; compare them with the single products if you only want part of the list.',
      'Bundles are delivered in two parts because money and items travel differently: the money is paid with /pay to your balance, and the items are handed over through a teleport and drop, in shulkers where needed. Both happen in the same session, usually within 5–30 minutes while our staff are online. The order page lists every component, including the rolled contents of the God Mystery Box in the Rich Bundle.',
      'Discounts stack on bundles like on everything else: carts over $15 get 5% off, over $40 get 8% and over $100 get 12%, plus one coupon and any store credit. Buying is at your own risk under DonutSMP\'s rules on real-money trading – we deliver with normal player actions and keep it low-key, but enforcement is the server\'s call, and we are not affiliated with DonutSMP or Mojang.',
    ],
    faq: [
      {
        q: 'Which DonutSMP bundle should a new player buy?',
        a: 'The Starter Bundle ($9.49): 20M to buy what the server shop offers, 15 skeleton spawners for a first farm and six diamond armor sets so dying is not expensive. Once the farm earns, upgrade with single spawners or the Pro Bundle.',
      },
      {
        q: 'Are bundles cheaper than buying the items separately?',
        a: 'The Starter, Pro and Rich bundles are – the Rich Bundle saves about $19 against its parts. The Spawner Farm and Basehunter bundles are priced for convenience, so if you only want some of the contents, the single products can be the better deal.',
      },
      {
        q: 'Can I swap an item in a bundle?',
        a: 'Not at checkout – bundles are fixed. If you want a different mix, add the single products to your cart instead; the spending discount applies either way. For big custom packages, message us on Discord for a quote.',
      },
      {
        q: 'How is a bundle delivered?',
        a: 'Money is paid to your balance with /pay; spawners and gear are handed over in-game after you accept a teleport from our delivery account. Both are done manually by our staff in the same session, usually within 5–30 minutes while online.',
      },
    ],
  },

  // ───────────── BASES ─────────────
  bases: {
    seoTitle: 'Buy a DonutSMP Base – Ready-Made Bases | DonutCoins',
    metaDescription:
      'Ready-made DonutSMP bases with chests, farms and spawner rooms: Starter Base $4.99, Loaded Base $14.99 with stocked storage. Coordinates sent via Discord.',
    intro:
      'A base on DonutSMP is the one thing you cannot buy on the auction house. This category lists hidden, ready-built bases our team has set up: the Starter Base ($4.99) is a small hideout with chests, a farm and a spawner room; the Loaded Base ($14.99) is an established base with stocked storage and a working spawner farm. Each base is sold exactly once and you receive the coordinates in a Discord ticket after payment. Stock is limited and often zero – check back or ask on Discord.',
    body: [
      'Building hidden takes hours of digging, and the first mistake is usually fatal. A pre-made base skips the exposed phase – you travel to the coordinates, claim what needs claiming and start using the farm the same evening. Bases are placed far from spawn and away from the routes base hunters usually cover, and each one is sold to a single buyer and then removed from the store.',
      'The Starter Base has a storage room with chests, a crop or mob farm and a spawner room ready for the spawners you bring; the Loaded Base comes with stocked storage and a spawner farm already running. The product page states what the storage holds at the time of listing. We do not promise loot beyond that description, and nothing is added after the sale.',
      'Delivery works differently from items. After payment our staff open a Discord ticket with you, send the coordinates and, if you want, meet you there once. From that moment the base is yours – we leave and do not return. A base is a location, not an item: it can be found, raided or griefed by other players, and DonutSMP\'s rules on real-money trading apply as with everything we sell.',
      'Change what you can when you move in – rebuild the entrance, move the storage, add your own claim – so the layout no longer matches what the builder knew. Bring your own spawners (skeleton spawners are $0.36–$0.43 each) to fill the spawner room, and keep valuables in an Ender Chest until you trust the spot. If both bases show sold out, ask on Discord for the next batch.',
    ],
    faq: [
      {
        q: 'How do I receive a DonutSMP base?',
        a: 'After your payment is confirmed, our staff open a Discord ticket with you and send the coordinates, with a one-time meet-up on request. You then travel there yourself. Bases are not teleport-delivered items, so join our Discord before ordering.',
      },
      {
        q: 'Why are bases usually sold out?',
        a: 'Each base is built by hand and sold once, so stock is one unit per listing and often zero. When a new base is ready it appears here; ask on Discord if you want to be told when the next one is listed.',
      },
      {
        q: 'Can other players find my base?',
        a: 'Yes – no hidden base is unfindable, and we cannot guarantee that nobody else knows the area. Rebuild the entrance, claim the chunks, move the storage and keep the valuables in an Ender Chest until you are confident in the spot.',
      },
      {
        q: 'Do I get a refund if the base gets raided?',
        a: 'No. Once the coordinates are delivered the sale is final, like any delivered order – see our refund policy. We refund if we fail to deliver the coordinates or the base does not match its description, not for what happens to it afterwards.',
      },
    ],
  },
};

/** Copy for the shop index (/shop – all categories). */
export const shopCopy: CategoryCopy = {
  seoTitle: 'DonutSMP Shop – Buy Money, Spawners & Items | DonutCoins',
  metaDescription:
    'DonutSMP shop: money from $0.13 per 1M, skeleton spawners from $0.36, Elytra, mystery boxes, god armor, tools and bundles. Delivered in-game by staff.',
  intro:
    'DonutCoins is a shop for DonutSMP players who would rather play than grind. Browse eight categories – money, spawners and items, mystery boxes, investments, armor, tools and weapons, bundles and bases – with live prices in USD and estimates in your own currency. Everything is delivered in-game by our staff, by hand, usually within 5–30 minutes while we are online. Prices drop automatically with quantity, carts over $15 get an extra 5–12% off, and the daily spin hands out coupons and free coins.',
  body: [
    'Start with money if you are new – 1M is $0.18 and the rate falls to $0.13 per million on big orders, with fixed packs from 10M ($1.69) to 1B ($114.99). Spawners are the second most popular buy: skeleton spawners from $0.36 at 250+, plus iron golems, zombies, creepers and blazes. The spawners category also holds the Elytra ($28.49), shulker boxes and totems of undying.',
    'For gear, the armor category has a full god netherite set for $4.99 and a Diamond Armor Shulker with six sets for $0.49; tools and weapons start at $0.89 for a God Bow and include the Mace and the DonutSMP Amethyst Pickaxe. Mystery boxes run from the $2.49 Coin Crate to the $49.99 Legendary Crate with a guaranteed Elytra, all with public odds. Investments cover netherite, nether stars, enchanted golden apples and dragon heads.',
    'Ordering takes a minute: add to cart, enter your exact Java Edition username – we check it against Mojang – choose PayPal, crypto or card where enabled, and report your payment reference on the order page. A member of our staff then pays money with /pay and hands items over through a teleport. Track any order at /track with its ID; no account is needed.',
    'Two things we say on every page: DonutCoins is an independent, player-run store, not affiliated with DonutSMP, Mojang or Microsoft, and DonutSMP\'s rules prohibit real-money trading – we deliver with normal player actions and keep it discreet, but buying is your own responsibility. If you want to test us first, start with a small order; the refund policy covers non-delivery in full.',
  ],
  faq: [
    {
      q: 'Is DonutCoins legit?',
      a: 'We are a small player-run store, not a marketplace of strangers: every order has an ID and a tracking page, deliveries are done by our own staff, reviews on /reviews come only from delivered orders, and the refund policy covers non-delivery in full. Start with a small order if you want to see it for yourself.',
    },
    {
      q: 'How fast is delivery?',
      a: 'Usually within 5–30 minutes while our staff are online – our Discord shows the current status. There is no bot; a real person logs on, pays money with /pay or hands items over after a teleport, and marks your order delivered. Paid orders never expire.',
    },
    {
      q: 'Which payment methods does the DonutSMP shop accept?',
      a: 'PayPal and Litecoin are on by default; card, Apple Pay and Google Pay through Stripe, PayPal Checkout, other coins and gift cards appear at checkout when they are enabled. Prices are in USD, with estimates in EUR, GBP and other currencies in the header.',
    },
    {
      q: 'Do you deliver to Bedrock players?',
      a: 'Orders need a Java Edition username (3–16 characters) that we validate against Mojang, and deliveries go to that account on DonutSMP. If you join through a Bedrock account, contact us on Discord before ordering so we can check whether delivery is possible.',
    },
  ],
};

/** Copy for a hotbar value: a category id or 'all' for the shop index. */
export function copyFor(id: CategoryId | 'all'): CategoryCopy {
  return id === 'all' ? shopCopy : categoryCopy[id];
}
