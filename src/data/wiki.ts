/**
 * DonutSMP wiki (/wiki and /wiki/:slug) – informational SEO articles. Pure data, no React.
 * Strings support **bold**, `code` and [label](/internal-link).
 *
 * Server-specific facts were cross-checked against the community wikis (Donutpedia and
 * donutsmp.wiki, autumn 2026). DonutSMP changes often – when a detail could not be confirmed
 * by more than one source it is either left out or phrased as "check in-game".
 */
export interface WikiSection { heading: string; paragraphs: string[]; list?: string[] }
export interface WikiArticle {
  slug: string;
  category: 'Getting started' | 'Economy' | 'Items & gear' | 'Farms & spawners' | 'Server & rules';
  title: string;
  seoTitle: string;
  metaDescription: string;
  summary: string;
  intro: string;
  sections: WikiSection[];
  faq: { q: string; a: string }[];
  related: string[];
  shopLinks: { label: string; to: string }[];
  updatedAt: string;
}

const UPDATED = '2026-11-02';

export const wikiArticles: WikiArticle[] = [
  // ───────────────────────────────────────────── Getting started
  {
    slug: 'donutsmp-ip-how-to-join',
    category: 'Getting started',
    title: 'DonutSMP Server IP and How to Join (Java & Bedrock)',
    seoTitle: 'DonutSMP IP & How to Join (Java and Bedrock)',
    metaDescription:
      'The DonutSMP server IP for Java and Bedrock, the Bedrock port, how regions and /rtp work, and what kind of server DonutSMP actually is before you join.',
    summary: 'The server address, Bedrock port, regions and what to expect on your first day on DonutSMP.',
    intro:
      'DonutSMP is one of the biggest public survival servers in Minecraft, known for its player-run economy, spawners and constant base hunting. It accepts both Java and Bedrock players on the same address. This page covers how to connect, how the world is split into regions and what the server is like before you spend your first night there.',
    sections: [
      {
        heading: 'The DonutSMP IP address',
        paragraphs: [
          'The server address is **`donutsmp.net`**. On Java Edition, open Multiplayer, choose Add Server or Direct Connection and type `donutsmp.net` – the default port is filled in automatically, so you do not need to add one.',
          'On Bedrock Edition (phone, console, Windows Bedrock), add a server with the address `donutsmp.net` and keep the port at **`19132`**. Typing the Java port into the Bedrock port field is the most common reason Bedrock players time out.',
          'Watch out for look-alike addresses on server lists. A hyphen or an extra word in the address can send you to a completely different server. Cracked (non-premium) clients cannot join, so you need a legitimate Minecraft account.',
        ],
      },
      {
        heading: 'What kind of server is DonutSMP?',
        paragraphs: [
          'DonutSMP is a survival SMP founded by the YouTuber DrDonut. It is often described as **semi-anarchy**: there are rules against cheats, exploits and real-money trading, but raiding and base hunting are a normal part of the game, and combat is dominated by crystal PvP.',
          'Everyone starts with an empty balance. The economy runs on in-game **money**, earned by selling to the server, filling player orders and trading on the auction house, plus a secondary currency called **shards**. See [DonutSMP money and economy](/wiki/donutsmp-money-economy) for the basics.',
        ],
      },
      {
        heading: 'Regions and random teleport',
        paragraphs: [
          'The overworld is split across several regions hosted in different parts of the world, so players in North America, Europe, Asia and Oceania can get a lower ping. Each region owns a slice of the map. According to the community wiki, the Nether and the End are hosted on the US East region, so expect higher ping there if you live far away.',
          'Use `/rtp` to random-teleport into the wild. Running it without a region opens a menu where you pick one. From there, walk or fly well away from your landing point before building – see [base protection](/wiki/donutsmp-base-protection).',
        ],
      },
      {
        heading: 'Your first hour',
        paragraphs: ['A simple plan that works for most new players:'],
        list: [
          'Read `/rules` once – the cheat and client-mod list is strict.',
          'Use `/rtp`, gather wood, stone and food, and get away from the landing area.',
          'Set a home with `/sethome` so you can return after dying.',
          'Sell surplus resources with `/sell` to get your first money.',
          'Check `/help` for the current in-game help menu, since features change often.',
        ],
      },
    ],
    faq: [
      { q: 'What is the DonutSMP IP?', a: 'The address is `donutsmp.net` for both Java and Bedrock. Bedrock players should keep the port at `19132`.' },
      { q: 'Can Bedrock players join DonutSMP?', a: 'Yes. Bedrock and Java players share the same server. Add `donutsmp.net` with port `19132` in the Bedrock server list.' },
      { q: 'Is DonutSMP cracked?', a: 'No. Cracked clients cannot play on DonutSMP, so you need a genuine Minecraft account.' },
    ],
    related: ['donutsmp-commands', 'donutsmp-money-economy', 'donutsmp-rules'],
    shopLinks: [
      { label: 'Starter bundles', to: '/shop/bundles' },
      { label: 'Browse the shop', to: '/shop' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-commands',
    category: 'Getting started',
    title: 'DonutSMP Commands List',
    seoTitle: 'DonutSMP Commands List (2026)',
    metaDescription:
      'Every useful DonutSMP command in one place: money, /sell, auction house, orders, shards, homes, teleport requests, /rtp, bounties and more, with examples.',
    summary: 'The everyday DonutSMP commands for money, selling, teleporting, homes and bounties, grouped by what they do.',
    intro:
      'DonutSMP runs on menus and commands rather than spawn shops, so knowing the main commands saves a lot of time. The list below covers the commands players use every day. DonutSMP updates its features often – several older commands were removed or reworked in the 2026 updates – so if a command does not respond, check `/help` in-game for the current list.',
    sections: [
      {
        heading: 'Money and trading',
        paragraphs: ['These cover your balance and the player economy:'],
        list: [
          '`/bal [player]` – check your balance or someone else\'s.',
          '`/baltop` – the richest-players leaderboard.',
          '`/pay <player> <amount>` – send money to another player. Double-check the name before you press enter.',
          '`/sell` – opens a chest-style menu; items you put in are sold to the server at base price when you close it.',
          '`/sellhistory` – shows what you have sold through `/sell`.',
          '`/worth <item>` – shows the server base price of an item.',
          '`/ah` – opens the auction house. `/ah <search>` searches it, and `/ah sell <price>` lists the item in your hand.',
          '`/orders` – opens player buy orders. `/order <search>` searches them.',
          '`/shop` – the Quick Buy menu.',
          '`/shards [player]` – shows a shard balance.',
        ],
      },
      {
        heading: 'Teleporting and homes',
        paragraphs: ['Travel commands are what keep a base safe, so learn them early:'],
        list: [
          '`/rtp [region]` – random teleport into the wild; without a region a selection menu opens.',
          '`/sethome`, `/home [name]`, `/delhome <name>` – set, use and delete homes. The number of homes depends on your rank.',
          '`/tpa <player>` – ask to teleport to a player. `/tpahere <player>` asks them to come to you.',
          '`/tpaccept`, `/tpadeny`, `/tpacancel` – answer or cancel requests.',
          '`/tpauto` – automatically accepts incoming requests. Leave it off unless you know what you are doing; it is an easy way to bring a base hunter home.',
        ],
      },
      {
        heading: 'PvP, social and info',
        paragraphs: ['Commands for the rest of server life:'],
        list: [
          '`/bounty <player>` – see a player\'s bounty, or the bounty leaderboard without a name. `/bounty add <player> <amount>` puts your own money on someone.',
          '`/stats [player]` and `/leaderboard` – player statistics and server leaderboards.',
          '`/friend` – friends and following lists.',
          '`/block <player>` and `/unblock <player>` – stop messages and teleport requests from a player.',
          '`/rules`, `/help`, `/discord` – rules, the help menu and the official Discord.',
          '`/ranks` and `/buy` – information about the official store ranks.',
        ],
      },
      {
        heading: 'Commands that changed in 2026',
        paragraphs: [
          'Many guides written before mid-2026 still mention commands such as `/team`, `/warp`, `/sellmulti` or AFK-zone commands. The June 2026 updates removed or reworked a number of these features, and some were partly brought back later. Treat old command lists with care and use `/help` as the source of truth.',
          'Command aliases can also differ: some lists write `/auction` instead of `/ah`, or `/teleport` instead of `/tpa`. Both styles have appeared on the server over time.',
        ],
      },
    ],
    faq: [
      { q: 'How do I sell items on DonutSMP?', a: 'Use `/sell` to sell to the server at base price, `/ah sell <price>` to list an item on the auction house, or fill a player request through `/orders`.' },
      { q: 'How do I teleport to a friend on DonutSMP?', a: 'Type `/tpa <name>` and ask them to run `/tpaccept`. Only accept requests from people you trust.' },
      { q: 'Why does a command from a video not work?', a: 'DonutSMP has removed and reworked several commands, especially in June 2026. Check `/help` in-game for the current list.' },
    ],
    related: ['donutsmp-ip-how-to-join', 'donutsmp-auction-house', 'donutsmp-shards'],
    shopLinks: [
      { label: 'DonutSMP money', to: '/shop/money' },
      { label: 'Frequently asked questions', to: '/faq' },
    ],
    updatedAt: UPDATED,
  },

  {
    slug: 'donutsmp-ranks',
    category: 'Getting started',
    title: 'DonutSMP Ranks: Donut+, Donut++ and Donut+++',
    seoTitle: 'DonutSMP Ranks: Donut+, Donut++ & Donut+++',
    metaDescription:
      'What the DonutSMP membership ranks are, the perks Donut+, Donut++ and Donut+++ give, how the 30-day subscription works and what happens when it ends.',
    summary: 'What the Donut+ membership tiers are, the perks they give and what happens when a subscription runs out.',
    intro:
      'DonutSMP sells optional membership ranks through its official store. They are convenience perks rather than requirements – every core part of the game, from spawners to the auction house, is open to players without a rank. This page explains how the tiers work so you can decide whether one is worth it for you.',
    sections: [
      {
        heading: 'How the membership works',
        paragraphs: [
          'The ranks are sold as **30-day subscriptions** on the official DonutSMP store, which is linked from the server website and from `/buy` and `/ranks` in-game. Each payment gives the chosen tier for 30 days. You can check how long you have left in-game.',
          'There are three tiers: **Donut+**, **Donut++** and **Donut+++**, each including more than the one below. Prices and exact perks have been changed several times in 2026, so always check the store page itself rather than an old video.',
        ],
      },
      {
        heading: 'Typical perks',
        paragraphs: ['The perks focus on convenience and capacity. Depending on the tier, they include:'],
        list: [
          '**More homes** – extra `/sethome` slots on top of the default allowance.',
          '**More auction house and order slots**, so you can list and buy more at once.',
          '**Higher placement in the player list** and a visible rank.',
          '**Priority features** on the top tier, such as faster chunk generation.',
        ],
      },
      {
        heading: 'What ranks do not give',
        paragraphs: [
          'Ranks do not give money, spawners or gear, and they do not protect your base. Passive shards are now earned by every player regardless of rank – a perk that used to be tied to Donut+ – so a rank is not needed for [shards](/wiki/donutsmp-shards) either.',
          'Content creators who make DonutSMP videos or streams can apply for the **Media** rank, which comes with membership perks. The requirements are listed in-game.',
        ],
      },
      {
        heading: 'When a subscription ends',
        paragraphs: [
          'If your membership expires, homes you already set stay usable, but you cannot set new ones beyond the limit of your current tier. Clean up homes you no longer need before letting a rank lapse, so the important ones are the ones you keep.',
          'Buying a rank on the official store is allowed. Buying in-game money or items from third-party sites is a different thing entirely and breaks the server rules – see [DonutSMP rules](/wiki/donutsmp-rules).',
        ],
      },
    ],
    faq: [
      { q: 'Is Donut+ a one-time purchase?', a: 'No. DonutSMP membership ranks are 30-day subscriptions bought on the official store.' },
      { q: 'Do I need a rank to earn shards?', a: 'No. Every player now earns shards from playtime, with or without a rank.' },
      { q: 'What happens to my homes when Donut+ expires?', a: 'Existing homes stay usable, but you cannot add new ones beyond your current tier\'s limit.' },
    ],
    related: ['donutsmp-shards', 'donutsmp-commands', 'donutsmp-rules'],
    shopLinks: [
      { label: 'Free rewards', to: '/free' },
      { label: 'Daily spin', to: '/spin' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── Economy
  {
    slug: 'donutsmp-money-economy',
    category: 'Economy',
    title: 'DonutSMP Money and Economy Basics',
    seoTitle: 'DonutSMP Money & Economy Explained',
    metaDescription:
      'How money works on DonutSMP: earning it with /sell, orders and the auction house, sending it with /pay, and base price vs market price explained.',
    summary: 'How DonutSMP money is earned, spent and moved between players, and why market prices differ from base prices.',
    intro:
      'Money is the main currency on DonutSMP. You use it to buy gear and spawners from other players, to create buy orders, to pay friends and even to put bounties on enemies. Every player starts with a zero balance, so understanding where money comes from is the first step to progressing.',
    sections: [
      {
        heading: 'Where money comes from',
        paragraphs: [
          'There are three main ways money enters your balance. The first is selling to the server with `/sell`: you drop items into the menu and receive the server-defined **base price** for each one. This is instant and needs no buyer, but base prices are usually the lowest price you can get.',
          'The second is **orders**. Other players post requests for items they want and the money they will pay. If you have the items, you fill the order and get paid. The third is the **auction house** (`/ah`), where you list an item at your own asking price and wait for a buyer. See [auction house and selling](/wiki/donutsmp-auction-house) for a deeper look.',
          'Most income ultimately comes from production: mining, farming and, above all, [spawners](/wiki/donutsmp-spawners-explained), which generate drops you can sell.',
        ],
      },
      {
        heading: 'Base price vs market price',
        paragraphs: [
          'The **base price** is what the server pays through `/sell`; check it with `/worth <item>`. The **market price** is what players are willing to pay on orders and the auction house. Rare items like elytras, netherite gear or spawners are worth far more on the player market than anything the server pays, while bulk resources often sell close to base price.',
          'Always compare price per item rather than per listing, and check recent sales before you buy or list something expensive. Prices move with supply, demand and updates.',
        ],
      },
      {
        heading: 'Moving money between players',
        paragraphs: [
          'Use `/pay <player> <amount>` to send money. The payment is instant and cannot be undone, so check the spelling of the name and the number of zeros. Scams are common on DonutSMP and are largely treated as part of the game as long as no rules are broken, which means staff will not refund a bad deal.',
        ],
        list: [
          'Never pay first to a stranger for an item they "will drop later".',
          'Use the auction house for item sales whenever possible – the server handles the swap.',
          'Be wary of renamed items; the name does not prove what the item is.',
        ],
      },
      {
        heading: 'Spending money wisely',
        paragraphs: [
          'Early on, the best spend is usually anything that increases your income: tools that mine faster, a first spawner, or materials for a farm. Gear can be lost to PvP and bases can be raided, so many experienced players keep part of their wealth as money rather than items.',
          'Some players also buy DonutSMP money from third-party stores, including ours at [DonutSMP money](/donutsmp-money). Be aware that real-money trading is against DonutSMP rules and is done at the buyer\'s own risk – read [server rules](/wiki/donutsmp-rules) first.',
        ],
      },
    ],
    faq: [
      { q: 'How do I check my balance on DonutSMP?', a: 'Type `/bal`. Use `/baltop` to see the richest players on the server.' },
      { q: 'What is the fastest way to make money as a new player?', a: 'Sell surplus resources with `/sell` for a start, then fill player orders, which usually pay more. Long term, spawners and farms produce the most steady income.' },
      { q: 'Can I get money back if I /pay the wrong person?', a: 'No. Payments are instant, so check the player name and amount carefully before sending.' },
    ],
    related: ['donutsmp-auction-house', 'donutsmp-shards', 'donutsmp-spawners-explained'],
    shopLinks: [
      { label: 'DonutSMP money', to: '/donutsmp-money' },
      { label: 'Guide: how to get money', to: '/guides/how-to-get-money-on-donutsmp' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-shards',
    category: 'Economy',
    title: 'DonutSMP Shards: How to Get Them and What They Buy',
    seoTitle: 'DonutSMP Shards: How to Get & Spend Them',
    metaDescription:
      'What shards are on DonutSMP, how you earn them from playtime in 2026, what the Shard Shop sells, and what changed with the AFK zone and crates.',
    summary: 'Shards are DonutSMP\'s second currency. Here is how you earn them now and what the Shard Shop sells.',
    intro:
      'Shards are the secondary currency on DonutSMP. They are separate from money, cannot be sent with `/pay`, and are spent in the server-run Shard Shop. The way shards are earned has changed several times in 2026, so a lot of older advice about AFK zones and crate keys no longer applies.',
    sections: [
      {
        heading: 'How to get shards in 2026',
        paragraphs: [
          'As of autumn 2026, every player passively earns **1 shard for every 10 minutes of playtime**. No rank is needed for this. Shards can also be bought with real money on the official DonutSMP store.',
          'You can check your total with `/shards`, or see another player\'s with `/shards <player>`.',
        ],
      },
      {
        heading: 'What happened to the AFK zone?',
        paragraphs: [
          'Older guides describe an AFK area that paid shards while you stood still, plus shards for player kills. Both were removed. In June 2026 a large update removed the AFK lobby and crates, and for a short time shards could only be bought. After player feedback, a follow-up update in the same month brought back a passive shard reward for everyone based on playtime.',
          'Because the system has moved this often, check the shard rate shown in-game or in the official Discord announcements before planning around it.',
        ],
      },
      {
        heading: 'What the Shard Shop sells',
        paragraphs: [
          'The Shard Shop sells premium items such as special shard tools, max-enchanted netherite weapons and tools, and enchanted armor pieces. Some shard items are temporary and expire after a set time, so read the item description before you spend.',
          'Two things the Shard Shop used to sell are no longer available there:',
        ],
        list: [
          '**Spawners** – they were once bought with shards but have been removed from the shop. Existing spawners now change hands between players. See [spawners on DonutSMP](/wiki/donutsmp-spawners-explained).',
          '**Crate keys** – crates were removed from the server in 2026, so keys are no longer sold.',
        ],
      },
      {
        heading: 'Are shards worth saving?',
        paragraphs: [
          'At the passive rate, shards build up slowly, so most players save for one specific item rather than buying small things. Since shard items are run by the server, prices and stock can change with any update – check the shop yourself before committing.',
          'Shards cannot be converted directly into money, but items bought with shards can be used or traded like any other item, subject to their own restrictions.',
        ],
      },
    ],
    faq: [
      { q: 'How many shards do you get per hour on DonutSMP?', a: 'As of autumn 2026, players get 1 shard every 10 minutes of playtime, which is 6 per hour. Check in-game, as this has changed several times.' },
      { q: 'Can you still buy spawners with shards?', a: 'No. Spawners were removed from the Shard Shop in 2026. Existing spawners are traded between players.' },
      { q: 'Is the DonutSMP AFK zone still there?', a: 'No. The AFK zone that paid shards was removed. Shards now come from passive playtime or the official store.' },
    ],
    related: ['donutsmp-money-economy', 'donutsmp-spawners-explained', 'donutsmp-commands'],
    shopLinks: [
      { label: 'Spawners', to: '/shop/spawners' },
      { label: 'Tools & weapons', to: '/shop/tools-weapons' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-auction-house',
    category: 'Economy',
    title: 'DonutSMP Auction House, Orders and /sell',
    seoTitle: 'DonutSMP Auction House (/ah) & Orders Guide',
    metaDescription:
      'How to use the DonutSMP auction house, buy orders and /sell: listing with /ah sell, searching, pricing per item and avoiding common bad trades.',
    summary: 'How to buy and sell on DonutSMP with /ah, /orders and /sell, and how to price items without losing money.',
    intro:
      'DonutSMP has three ways to turn items into money: selling to the server, filling player orders and listing on the auction house. Each has a different trade-off between speed and price. Knowing which one to use for which item is how experienced players make money without grinding harder.',
    sections: [
      {
        heading: 'Selling to the server with /sell',
        paragraphs: [
          '`/sell` opens a chest-style menu. Drag items in and close it, and every supported item is sold at its server **base price**. You can look up a price first with `/worth <item>` and review past sales with `/sellhistory`.',
          'This is the fastest option and always has a buyer, but it usually pays the least. It is best for bulk farm output and junk you would otherwise throw away.',
        ],
      },
      {
        heading: 'Filling buy orders',
        paragraphs: [
          '`/orders` shows what other players want to buy and how much they pay per item. If you have the items, you can fill the order directly. `/order <search>` finds orders for a specific item.',
          'Orders often pay more than base price for useful building and redstone items, but someone else may fill an order before you. Read each request carefully – similar-sounding items are not always interchangeable. You can also create your own orders to buy items in bulk.',
        ],
      },
      {
        heading: 'Listing on the auction house',
        paragraphs: [
          'Hold the item and type `/ah sell <price>`, then check the confirmation screen shows the right item and amount before confirming. Your listing appears when other players open `/ah` or search with `/ah <search>`. The number of listing slots you have depends on your rank.',
          'The listing price is only an asking price – an item that does not sell earns nothing. Search first to see what similar items are listed at so you do not undercut yourself by accident.',
        ],
      },
      {
        heading: 'Pricing and safety tips',
        paragraphs: ['Most bad trades come from the same few mistakes:'],
        list: [
          'Compare **price per item**: divide the total price by the stack size. A cheaper-looking listing may hold fewer items.',
          'Check enchantments, durability and the actual item type, not just the name. Renamed items prove nothing.',
          'Watch the number of zeros on big purchases – a misplaced digit is not refundable.',
          'Prices move after updates; recheck before buying or selling something valuable.',
          'Flipping (buy low, relist higher) can work, but it ties up money and the market can turn.',
        ],
      },
    ],
    faq: [
      { q: 'How do I sell on the DonutSMP auction house?', a: 'Hold the item, type `/ah sell <price>` and confirm. It will show up for other players under `/ah`.' },
      { q: 'What is the difference between /sell and /ah?', a: '`/sell` sells instantly to the server at a fixed base price. `/ah` lets you set your own price, but you have to wait for a player to buy it.' },
      { q: 'How many auction house slots do I get?', a: 'It depends on your rank – higher store ranks get more listing and order slots. Check the in-game menu for your current limit.' },
    ],
    related: ['donutsmp-money-economy', 'donutsmp-commands', 'donutsmp-shards'],
    shopLinks: [
      { label: 'Investment items', to: '/shop/investments' },
      { label: 'DonutSMP money', to: '/shop/money' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── Farms & spawners
  {
    slug: 'donutsmp-spawners-explained',
    category: 'Farms & spawners',
    title: 'How Spawners Work on DonutSMP',
    seoTitle: 'How Spawners Work on DonutSMP',
    metaDescription:
      'How DonutSMP spawners differ from vanilla: no mobs, drops stored inside, stacking, safe mining, the main types and how to get one in 2026.',
    summary: 'DonutSMP spawners make drops instead of mobs. How storage, stacking and spawner trading work today.',
    intro:
      'Spawners are the backbone of the DonutSMP economy, but they do not work like the monster spawners you find in vanilla dungeons. On DonutSMP a spawner produces mob drops directly, without spawning any mobs, which keeps the server from lagging. This page explains how they work, how to stack them and how to get one today.',
    sections: [
      {
        heading: 'Drops, not mobs',
        paragraphs: [
          'A placed spawner on DonutSMP quietly generates the drops its mob would give and stores them inside the block. You right-click the spawner to open its storage, much like opening a chest, and take the items out. There is no kill chamber, no lava blade and no mob cap to worry about.',
          'Because nothing spawns, the usual vanilla farm designs are not needed. What matters is how many spawners you have, keeping their storage emptied so output is not wasted, and keeping the base hidden.',
        ],
      },
      {
        heading: 'Stacking spawners',
        paragraphs: [
          'Spawners of the same type can be stacked into a single block by sneaking (shift) and right-clicking a placed spawner with another one in your hand. A stack produces more than a single spawner while taking up one block, which is why large farms can fit into a tiny room.',
          'Stacking also concentrates value. One stacked block can hold a fortune, and base hunters know it. Never share farm coordinates and never accept teleport requests from strangers to your farm.',
        ],
      },
      {
        heading: 'Spawner types',
        paragraphs: ['The most traded spawner types and what they produce:'],
        list: [
          '**Skeleton** – bones and arrows. The most popular type; see [skeleton spawner farms](/wiki/skeleton-spawner-farm).',
          '**Iron Golem** – iron ingots. See [iron golem farms](/wiki/iron-golem-farm).',
          '**Zombified Piglin** – gold nuggets.',
          '**Blaze** – blaze drops for brewing.',
          '**Creeper** – gunpowder, useful for rockets.',
          '**Spider** – string and spider eyes.',
          '**Pig and Cow** – raw meat.',
        ],
      },
      {
        heading: 'How to get a spawner in 2026',
        paragraphs: [
          'Spawners used to be bought with shards, but they were removed from the Shard Shop in 2026 and, according to the community wiki, no new spawners are currently created by the server. That means every spawner now comes from another player – through the auction house, orders or a direct trade. Since supply is fixed, prices are set entirely by the player market.',
          'Before buying, confirm the exact spawner type in its name and lore, and use the auction house rather than a pay-first deal. Some players also buy spawners from third-party stores such as [our spawner shop](/donutsmp-spawners); remember that real-money trading breaks DonutSMP rules and is at your own risk.',
        ],
      },
      {
        heading: 'Moving a spawner safely',
        paragraphs: [
          'Community guides report that you need a **Silk Touch** pickaxe to pick up a placed spawner, and that anything still stored inside is lost when it breaks. Always empty the storage first, and test with a single spawner before moving a valuable stack.',
        ],
      },
    ],
    faq: [
      { q: 'Do spawners spawn mobs on DonutSMP?', a: 'No. DonutSMP spawners generate drops and store them inside the block. You collect them by right-clicking the spawner.' },
      { q: 'How do you stack spawners on DonutSMP?', a: 'Sneak and right-click a placed spawner while holding another spawner of the same type.' },
      { q: 'Can you buy spawners with shards?', a: 'Not anymore. Spawners were removed from the Shard Shop in 2026, so they are now traded between players.' },
    ],
    related: ['skeleton-spawner-farm', 'iron-golem-farm', 'donutsmp-shards', 'donutsmp-base-protection'],
    shopLinks: [
      { label: 'DonutSMP spawners', to: '/donutsmp-spawners' },
      { label: 'Spawners guide', to: '/guides/donutsmp-spawners-guide' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'skeleton-spawner-farm',
    category: 'Farms & spawners',
    title: 'Best Skeleton Farm: DonutSMP Spawners and Vanilla XP Farms',
    seoTitle: 'Best Skeleton Farm on DonutSMP (and Vanilla)',
    metaDescription:
      'How to set up a skeleton spawner farm on DonutSMP, what to do with bones and arrows, plus how a classic vanilla skeleton XP farm works in Java 1.21.',
    summary: 'Skeleton spawners are the most popular DonutSMP farm. How to run one, and how a vanilla skeleton XP farm works.',
    intro:
      'Skeleton spawners are the most sought-after spawner type on DonutSMP, because bones and arrows are always in demand. On DonutSMP a skeleton "farm" looks very different from the dungeon XP farms you know from singleplayer. This page covers both: the DonutSMP setup and the vanilla Java design.',
    sections: [
      {
        heading: 'Skeleton farms on DonutSMP',
        paragraphs: [
          'DonutSMP spawners produce drops without spawning mobs, so a skeleton farm is simply one or more skeleton spawners placed in a hidden room. Spawners of the same type can be stacked into one block by sneak-right-clicking, so even a big farm can be very small. Bones and arrows collect inside the spawner until you open it and take them out.',
          'The best skeleton farm on DonutSMP is therefore not about redstone at all. It comes down to three things:',
        ],
        list: [
          '**Count** – more stacked spawners means more output.',
          '**Collection** – empty storage regularly so production is not wasted.',
          '**Secrecy** – a hidden location, no shared coordinates, and no unknown visitors.',
        ],
      },
      {
        heading: 'What to do with bones and arrows',
        paragraphs: [
          'Bones can be sold with `/sell`, sold to players through orders, or crafted into bone meal (one bone makes three bone meal). Bone meal speeds up crop and tree farms, which feed back into your own income. Arrows can be sold or kept for PvP.',
          'Compare the base price from `/worth bone` with the current orders before dumping everything into `/sell` – player orders sometimes pay more for large amounts.',
        ],
      },
      {
        heading: 'How a vanilla skeleton XP farm works (Java 1.21)',
        paragraphs: [
          'On a normal survival world, a skeleton farm is built around a dungeon spawner. The spawner only runs when a player is within 16 blocks, and it spawns skeletons in a small area around itself. In Java 1.21 a monster spawner needs darkness to work, so keep the room unlit – torches around a spawner shut it off.',
          'A classic design works like this:',
        ],
        list: [
          'Dig out the room around the spawner and add water streams that push skeletons towards one corner.',
          'Send them into a drop shaft roughly 22 blocks tall so they land with very little health.',
          'Stand at the bottom in a safe spot and finish each skeleton with one hit for full XP and drops.',
          'Add a hopper under the kill spot leading to chests to catch bones, arrows and the occasional bow.',
        ],
      },
      {
        heading: 'Getting skeleton spawners',
        paragraphs: [
          'In vanilla, spawners cannot be mined with Silk Touch, so you build around the one you find. On DonutSMP spawners are items you can buy, trade and stack, but they are no longer sold by the Shard Shop, so they come from other players. You can also find them in our store at [skeleton spawner](/product/skeleton-spawner) – note that real-money trading is against DonutSMP rules and at the buyer\'s risk.',
        ],
      },
    ],
    faq: [
      { q: 'Do I need a kill chamber for a skeleton spawner on DonutSMP?', a: 'No. DonutSMP spawners do not spawn mobs; drops are stored inside the spawner and you collect them by right-clicking it.' },
      { q: 'Why is my vanilla skeleton spawner not spawning?', a: 'Usually because the room is lit or you are more than 16 blocks away. Remove torches and stay within range.' },
      { q: 'Why are skeleton spawners so valuable on DonutSMP?', a: 'Bones and arrows always have buyers, and bone meal powers other farms, so skeleton spawners give steady, sellable output.' },
    ],
    related: ['donutsmp-spawners-explained', 'iron-golem-farm', 'donutsmp-enchanting-mending'],
    shopLinks: [
      { label: 'Skeleton spawner', to: '/product/skeleton-spawner' },
      { label: 'All spawners', to: '/shop/spawners' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'iron-golem-farm',
    category: 'Farms & spawners',
    title: 'Iron Golem Farms: DonutSMP Spawners and Vanilla Designs',
    seoTitle: 'Iron Golem Farm Guide for DonutSMP',
    metaDescription:
      'How iron farms work on DonutSMP with iron golem spawners, what iron is used for, and how a classic villager iron golem farm works in Minecraft Java 1.21.',
    summary: 'Iron golem spawners produce iron ingots on DonutSMP. How to use them, plus how a vanilla villager iron farm works.',
    intro:
      'Iron goes into almost everything: hoppers, rails, anvils, buckets and armor. On DonutSMP the easiest steady source is an iron golem spawner, which produces iron ingots directly. If you play vanilla or want to understand the classic farm, the villager-based design is explained below too.',
    sections: [
      {
        heading: 'Iron golem spawners on DonutSMP',
        paragraphs: [
          'Like every DonutSMP spawner, an iron golem spawner does not spawn golems. It generates iron ingots and stores them inside the block until you right-click it and take them out. Stack more iron golem spawners into the same block by sneak-right-clicking with one in hand to increase output.',
          'Because there are no mobs, there is nothing to kill and no villagers to protect. Your job is to collect the iron regularly and keep the room hidden from base hunters.',
        ],
      },
      {
        heading: 'Turning iron into money',
        paragraphs: ['Raw ingots sell through `/sell`, but crafting them into something players need is often worth more. Popular uses:'],
        list: [
          '**Buckets** – filled water and lava buckets are in steady demand.',
          '**Hoppers** – every farm and sorting system needs them.',
          '**Rails, anvils and iron blocks** – useful for building and storage.',
          'Check `/orders` for current demand before crafting in bulk.',
        ],
      },
      {
        heading: 'How a vanilla iron golem farm works (Java 1.21)',
        paragraphs: [
          'In vanilla Java, villagers summon an iron golem when they feel threatened, for example when they can see a zombie. A standard modern farm uses that behaviour:',
        ],
        list: [
          'Put three villagers in small cells, ideally with beds, so they cannot wander off.',
          'Place a zombie where the villagers can see it but not reach it, often in a minecart or boat behind glass.',
          'Build a spawning platform around them; golems appear in an area roughly 16 blocks wide centred on the villagers.',
          'Funnel golems with water into a kill spot – a lava blade (lava held by a sign) works well – and collect drops with hoppers.',
          'Each golem drops 3–5 iron ingots and sometimes poppies.',
        ],
      },
      {
        heading: 'Common problems',
        paragraphs: [
          'If golems stop spawning in a vanilla farm, check that the zombie is still alive and visible, that the villagers have not despawned or been killed, and that you are close enough for the chunks to be loaded. Nearby villages with their own villagers can also split the spawns.',
          'On DonutSMP, if output seems low, make sure the spawner storage is not full and that you bought the spawner type you expected – always read the item name and lore before buying. You can also find the [iron golem spawner](/product/iron-golem-spawner) in our store.',
        ],
      },
    ],
    faq: [
      { q: 'Do iron golem spawners spawn golems on DonutSMP?', a: 'No. They generate iron ingots directly into the spawner\'s storage, with no mobs involved.' },
      { q: 'How many villagers does an iron farm need in vanilla?', a: 'The common modern design uses three villagers that are scared by a zombie they can see but not reach.' },
    ],
    related: ['donutsmp-spawners-explained', 'skeleton-spawner-farm', 'donutsmp-money-economy'],
    shopLinks: [
      { label: 'Iron golem spawner', to: '/product/iron-golem-spawner' },
      { label: 'All spawners', to: '/shop/spawners' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── Items & gear
  {
    slug: 'donutsmp-elytra',
    category: 'Items & gear',
    title: 'Elytra on DonutSMP: Getting, Repairing and Flying',
    seoTitle: 'DonutSMP Elytra: How to Get & Repair One',
    metaDescription:
      'How to get an elytra for DonutSMP, why End cities are so contested, how to repair one with Mending or phantom membranes, and how firework rockets work.',
    summary: 'Where elytras come from, how to keep one repaired, and how rockets work – everything for flying on DonutSMP.',
    intro:
      'An elytra is the single biggest upgrade for travel on DonutSMP. It lets you leave your random-teleport point quickly, scout for bases and escape fights. Getting one is harder on a busy server than in singleplayer, so this page covers where they come from, how to look after one and how to fly efficiently.',
    sections: [
      {
        heading: 'Where elytras come from',
        paragraphs: [
          'Elytras only generate in **End ships**, which spawn next to some End cities in the outer End islands. Each End ship holds one elytra in an item frame. To get there you kill the Ender Dragon (or use a gateway that is already open) and throw an ender pearl into an End gateway to reach the outer islands.',
          'On DonutSMP the End is shared by a huge number of players, and the community wiki notes that it is hosted on the US East region. End cities close to the main island are usually looted already, so expect to travel far – or buy an elytra from another player on the auction house.',
        ],
      },
      {
        heading: 'Durability and repairing',
        paragraphs: [
          'An elytra has 432 durability in Java Edition and loses one point per second of gliding. It never fully breaks: at 1 durability it stops working until repaired. You have three ways to fix it:',
        ],
        list: [
          '**Mending** – the best option. Experience you pick up repairs the elytra while you wear or hold it. See [enchanting and mending](/wiki/donutsmp-enchanting-mending).',
          '**Phantom membranes** – combine with the elytra in an anvil; each membrane restores a quarter of its durability.',
          '**Another elytra** – combine two in an anvil, though this is a waste of a rare item.',
        ],
      },
      {
        heading: 'Rockets and flying',
        paragraphs: [
          'Firework rockets give you thrust while gliding. Craft them from paper and one to three gunpowder – more gunpowder means a longer boost. Do not add firework stars: rockets with stars explode and damage you. A creeper spawner or creeper farm is a good gunpowder source.',
          'Fly high to avoid crashing into terrain, and wear a helmet: flying into a wall at speed deals damage. Unbreaking III plus Mending is the standard enchant combination for an elytra.',
        ],
      },
      {
        heading: 'Elytra and PvP',
        paragraphs: [
          'An elytra takes your chestplate slot, so you lose armor protection while wearing it. Many players carry both and swap before a fight. Keep a [totem of undying](/wiki/totems-pvp-gear) in your offhand when flying near other players.',
          'If you would rather not hunt the End, elytras are also sold in our store at [elytra](/product/elytra). Buying in-game items for real money breaks DonutSMP rules and is at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'How do you repair an elytra?', a: 'Use Mending and collect experience, or combine the elytra with phantom membranes in an anvil.' },
      { q: 'Does an elytra break completely?', a: 'No. At 1 durability it stops working but stays in your inventory until you repair it.' },
      { q: 'What enchantments should an elytra have?', a: 'Unbreaking III and Mending are the standard pair for an elytra.' },
    ],
    related: ['donutsmp-enchanting-mending', 'totems-pvp-gear', 'netherite-ancient-debris'],
    shopLinks: [
      { label: 'Elytra', to: '/product/elytra' },
      { label: 'Elytra guide', to: '/guides/donutsmp-elytra-guide' },
      { label: 'Elytra crate', to: '/product/elytra-crate' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'netherite-ancient-debris',
    category: 'Items & gear',
    title: 'Netherite and Ancient Debris: Mining and Upgrading',
    seoTitle: 'Netherite & Ancient Debris Guide (DonutSMP)',
    metaDescription:
      'Where to find ancient debris, the best Y level, how to turn scrap into netherite ingots, and how to upgrade diamond gear with a smithing template in 1.21.',
    summary: 'Finding ancient debris, crafting netherite ingots and upgrading diamond gear with the smithing template.',
    intro:
      'Netherite is the strongest gear material in Minecraft and the standard for serious PvP on DonutSMP. Making it takes ancient debris from the Nether, gold and a smithing template. This guide covers each step for Java 1.21 and a few tips that matter on a busy server.',
    sections: [
      {
        heading: 'Finding ancient debris',
        paragraphs: [
          'Ancient debris only generates in the Nether. It is most common low down, roughly between **Y 8 and Y 22**, and many players strip-mine around **Y 15**. It is rarely exposed to air, so you have to dig for it.',
          'Debris has very high blast resistance, which makes explosions a fast way to uncover it: TNT clears netherrack around it, and beds explode when used in the Nether. Bed mining is dangerous, so wear armor, keep fire resistance handy and never use a bed near lava you are standing beside.',
          'On DonutSMP the Nether is shared and heavily used, so expect areas near common portals to be mined out. Use `/rtp` and travel far before starting.',
        ],
      },
      {
        heading: 'From debris to ingots',
        paragraphs: ['The crafting chain is the same on every Java 1.21 server:'],
        list: [
          'Smelt **1 ancient debris** into **1 netherite scrap**.',
          'Craft **4 netherite scrap + 4 gold ingots** into **1 netherite ingot**.',
          'Nine ingots make a [netherite block](/product/netherite-block), which is a compact way to store or trade them.',
        ],
      },
      {
        heading: 'Upgrading diamond gear',
        paragraphs: [
          'Netherite gear is made by upgrading diamond gear at a smithing table. You need the diamond item, one netherite ingot and a **Netherite Upgrade Smithing Template**. Enchantments carry over, so enchant your diamond gear first.',
          'Templates are found in bastion remnant chests. You can duplicate one with 7 diamonds, 1 netherrack and the template itself, which gives you two templates. A full armor set plus a sword and pickaxe needs six upgrades, so plan your diamonds.',
        ],
      },
      {
        heading: 'Why netherite is worth it',
        paragraphs: [
          'Netherite armor has more toughness than diamond and each piece adds knockback resistance, which helps in crystal PvP. Netherite items also float in lava and do not burn, so you have a chance to recover them after dying in the Nether.',
          'Maxed netherite gear is also one of the most traded items on the auction house. You can find armor and tools in our [armor shop](/shop/armor) as well; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'What is the best Y level for ancient debris?', a: 'Ancient debris is most common around Y 8–22 in the Nether. Y 15 is a popular level for strip mining.' },
      { q: 'How many scrap make a netherite ingot?', a: 'Four netherite scrap plus four gold ingots make one netherite ingot.' },
      { q: 'Do I need a smithing template for netherite?', a: 'Yes. Since 1.20 you need a Netherite Upgrade Smithing Template, found in bastion remnants, to upgrade diamond gear.' },
    ],
    related: ['totems-pvp-gear', 'donutsmp-enchanting-mending', 'donutsmp-elytra'],
    shopLinks: [
      { label: 'Netherite block', to: '/product/netherite-block' },
      { label: 'Armor', to: '/shop/armor' },
      { label: 'Tools & weapons', to: '/shop/tools-weapons' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'totems-pvp-gear',
    category: 'Items & gear',
    title: 'Totems and PvP Gear Basics for DonutSMP',
    seoTitle: 'Totems & PvP Gear Basics for DonutSMP',
    metaDescription:
      'How a totem of undying works in Java 1.21, where to get totems, and the core gear for crystal PvP on DonutSMP: armor, enchants, crystals and bounties.',
    summary: 'How totems of undying work and what gear you need to survive crystal PvP on DonutSMP.',
    intro:
      'Combat on DonutSMP revolves around crystal PvP, where end crystal explosions do most of the damage. Surviving it depends on good armor, the right enchantments and a steady supply of totems of undying. This page explains how totems work and what a basic PvP kit looks like.',
    sections: [
      {
        heading: 'How a totem of undying works',
        paragraphs: [
          'A totem of undying saves you from a death if you hold it in your main hand or offhand when you take fatal damage. The totem is used up, you are left with half a heart, and in Java 1.21 you get Regeneration II, Absorption II and Fire Resistance for a short time.',
          'It only works when held – a totem sitting in your inventory does nothing. That is why PvP players keep one in the offhand and swap in a new one immediately after it pops.',
        ],
      },
      {
        heading: 'Where totems come from',
        paragraphs: [
          'Totems are dropped by **evokers**, which appear in woodland mansions and in pillager raids. Raid farms are the main way players produce them in bulk, though they are large builds. On DonutSMP most players buy totems from other players through the auction house or orders. They are also available in our store at [totem of undying](/product/totem-of-undying), with the usual note that real-money trading is against DonutSMP rules.',
        ],
      },
      {
        heading: 'A basic PvP kit',
        paragraphs: ['A typical crystal PvP loadout includes:'],
        list: [
          'Full netherite armor with Protection IV, Unbreaking III and Mending. Blast Protection on at least one piece helps against explosions.',
          'A netherite sword with Sharpness V, and a pickaxe for breaking obsidian.',
          'End crystals and obsidian – crystals can only be placed on obsidian or bedrock.',
          'Several totems, golden apples and ender pearls for escaping.',
          'Experience bottles to repair Mending gear mid-fight.',
        ],
      },
      {
        heading: 'Bounties and staying alive',
        paragraphs: [
          'Players can put money on your head with `/bounty add`, and `/bounty <player>` shows how much someone is worth. Carrying expensive gear while you have a bounty makes you a target, so keep valuables at a hidden base and only bring what you need.',
          'Combat clients and mods that give an advantage, such as auto-totem, health indicators or macros, are banned on DonutSMP. Practise your own hotbar and offhand swaps instead – see [server rules](/wiki/donutsmp-rules).',
        ],
      },
    ],
    faq: [
      { q: 'Does a totem work in your inventory?', a: 'No. A totem of undying must be in your main hand or offhand when you would die.' },
      { q: 'Which mobs drop totems of undying?', a: 'Evokers, found in woodland mansions and pillager raids.' },
      { q: 'What is crystal PvP?', a: 'A fighting style that uses end crystal explosions on obsidian to deal large damage. It is the main form of combat on DonutSMP.' },
    ],
    related: ['netherite-ancient-debris', 'donutsmp-enchanting-mending', 'donutsmp-rules'],
    shopLinks: [
      { label: 'Totem of undying', to: '/product/totem-of-undying' },
      { label: 'Armor', to: '/shop/armor' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-enchanting-mending',
    category: 'Items & gear',
    title: 'Enchanting and Mending Essentials',
    seoTitle: 'Enchanting & Mending Guide for DonutSMP',
    metaDescription:
      'How to set up a level 30 enchanting table, get Mending from villagers, combine books without hitting Too Expensive, and the best gear enchants.',
    summary: 'Max-level enchanting, getting Mending from librarians and combining books without hitting "Too Expensive".',
    intro:
      'Good enchantments decide fights and save you from constantly replacing gear. Mending in particular turns experience into free repairs, which matters on a server where netherite is expensive. This guide covers the enchanting table, villager trading for books and how to use an anvil efficiently in Java 1.21.',
    sections: [
      {
        heading: 'Setting up a level 30 enchanting table',
        paragraphs: [
          'An enchanting table needs **15 bookshelves** to offer level 30 enchantments. Place them one block away from the table, with an empty block between, on the same level or one block higher. Anything placed in that gap, even a torch, blocks the bookshelf.',
          'Each enchant costs lapis lazuli and experience levels. If you do not like the offers, enchanting a cheap item such as a book reshuffles them.',
        ],
      },
      {
        heading: 'Getting Mending',
        paragraphs: [
          'Mending cannot be obtained from an enchanting table. The reliable source is a **librarian villager**. Place a lectern next to an unemployed villager and check its trades. If it does not offer Mending, break the lectern and place it again until it does – this works as long as you have not traded with the villager yet. Once you trade, the offer is locked in.',
          'Mending books can also be found in loot chests and from fishing, but villagers are far more dependable.',
        ],
      },
      {
        heading: 'How Mending repairs gear',
        paragraphs: [
          'When you pick up experience orbs, Mending uses them to repair damaged items you are wearing or holding, at two durability per experience point. Experience bottles, mob farms and mining all work. Mending cannot be combined with Infinity on a bow.',
        ],
      },
      {
        heading: 'Using the anvil without "Too Expensive"',
        paragraphs: [
          'Every time an item goes through an anvil its next anvil cost rises. In survival, an operation costing 40 levels or more shows "Too Expensive!" and cannot be done. To avoid it:',
        ],
        list: [
          'Combine books with each other first, then apply the finished book to the item.',
          'Combine in pairs of equal work so the penalty grows evenly.',
          'Put the most expensive enchantments on early, before the penalty builds up.',
          'A grindstone removes enchantments (except curses) if you need to start over.',
        ],
      },
      {
        heading: 'Recommended enchants',
        paragraphs: [
          'Armor: Protection IV, Unbreaking III, Mending, plus Blast Protection on a piece for crystal PvP. Sword: Sharpness V, Unbreaking III, Mending. Pickaxe: Efficiency V, Unbreaking III, Mending and either Fortune III or Silk Touch. Elytra: Unbreaking III and Mending – see the [elytra guide](/wiki/donutsmp-elytra).',
        ],
      },
    ],
    faq: [
      { q: 'How many bookshelves do you need for level 30?', a: 'Fifteen, placed one block away from the table with an empty gap in between.' },
      { q: 'Can you get Mending from an enchanting table?', a: 'No. Mending comes from librarian villagers, loot chests and fishing.' },
    ],
    related: ['donutsmp-elytra', 'netherite-ancient-debris', 'totems-pvp-gear'],
    shopLinks: [
      { label: 'Tools & weapons', to: '/shop/tools-weapons' },
      { label: 'Armor', to: '/shop/armor' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── Server & rules
  {
    slug: 'donutsmp-base-protection',
    category: 'Server & rules',
    title: 'Protecting Your Base from Base Hunters on DonutSMP',
    seoTitle: 'DonutSMP Base Protection: Avoid Base Hunters',
    metaDescription:
      'How base hunters find bases on DonutSMP and practical ways to protect yours: location, hiding spawners, teleport habits, coordinates and keeping backups.',
    summary: 'How base hunters find bases on DonutSMP and the habits that keep your spawners and stash hidden.',
    intro:
      'Base hunting is a core part of DonutSMP. The server is semi-anarchy, so if someone finds your base they can usually take what is inside, and community wiki authors note that most bases are found sooner or later. You cannot make a base impossible to find, but you can make it far less likely and limit what you lose.',
    sections: [
      {
        heading: 'How bases get found',
        paragraphs: [
          'Most bases are found in a few predictable ways. Knowing them tells you what to avoid:',
        ],
        list: [
          '**Teleports** – accepting a `/tpa` from someone, or using `/tpahere` on a "friend" who later turns on you.',
          '**Visible builds** – large surface builds, farms and lit areas are easy to spot when flying with an elytra.',
          '**Trails** – paths, portals, tunnels and placed blocks leading away from common `/rtp` areas.',
          '**Loose talk** – screenshots with coordinates or recognisable terrain, and trusting people you met in chat.',
        ],
      },
      {
        heading: 'Choosing a location',
        paragraphs: [
          'Travel well away from where `/rtp` dropped you before building, and do not build next to a Nether portal. Underground bases leave much less to see from above. Keep your entrance small and ordinary-looking, and avoid lighting the surface.',
          'Remember that only a handful of homes are available to each player, depending on rank. Use them for the base itself and a safe fallback, not for every location you visit.',
        ],
      },
      {
        heading: 'Protecting spawners and valuables',
        paragraphs: [
          'Stacked spawners concentrate a lot of value in one block, so they are the first thing raiders look for. Keep the spawner room separate from the rest of the base, empty storage regularly and do not keep all your stock in one place. Many players split valuables across a few hidden stashes and keep part of their wealth as money, which cannot be raided from a chest.',
          'An ender chest is one of the safest storage options because only you can open your own ender chest contents. Shulker boxes inside it give you a lot of private space.',
        ],
      },
      {
        heading: 'Teleport and friend habits',
        paragraphs: ['Small habits stop most raids:'],
        list: [
          'Keep `/tpauto` off and deny teleport requests from anyone you do not know well.',
          'Meet traders at a neutral spot, never at your base.',
          'Do not share coordinates in chat, Discord or videos.',
          'If someone you trusted leaves on bad terms, move the most valuable items.',
        ],
      },
    ],
    faq: [
      { q: 'Is raiding allowed on DonutSMP?', a: 'DonutSMP is semi-anarchy and base hunting is a normal part of the game. Cheating to find bases, such as x-ray or radar mods, is against the rules.' },
      { q: 'What is the safest storage on DonutSMP?', a: 'Your ender chest, since its contents belong only to you. Keeping some wealth as money also protects it from raids.' },
    ],
    related: ['donutsmp-spawners-explained', 'donutsmp-rules', 'donutsmp-commands'],
    shopLinks: [
      { label: 'Base hunting guide', to: '/guides/donutsmp-base-hunting-guide' },
      { label: 'Spawners', to: '/shop/spawners' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-rules',
    category: 'Server & rules',
    title: 'DonutSMP Rules, Real-Money Trading and Map Resets',
    seoTitle: 'DonutSMP Rules & Real-Money Trading',
    metaDescription:
      'The main DonutSMP rules explained: banned mods and clients, exploits, alt limits, IRL and cross-server trading, punishments and map resets.',
    summary: 'The DonutSMP rules that get players banned most often, including mods, alts and real-money trading.',
    intro:
      'DonutSMP allows raiding and PvP, but it still has strict rules, and breaking them can cost you your items or your account. This page summarises the main rule groups as listed by the community wikis in autumn 2026. The official rules always take priority, so read `/rules` in-game and the official Discord for the current wording.',
    sections: [
      {
        heading: 'Cheats and client mods',
        paragraphs: [
          'Hacked clients are banned, and so are many mods that would be allowed on other servers. Mods that give an advantage are prohibited even if they are not specifically listed. The rules name, among others:',
        ],
        list: [
          'Movement mods and inventory mods.',
          'Health indicators, radar, ESP and freecam.',
          'Auto place or easy place features.',
          'Macros, scripts, auto clickers, mouse tweaks and scrollers.',
          'Crafting modifications.',
        ],
      },
      {
        heading: 'Exploits and accounts',
        paragraphs: [
          'Abusing bugs, duplicating items (or trying to) and finding or using the world seed are against the rules. Bugs should be reported through the official support channels instead. Punishments listed by the community wiki include mutes, temporary bans and player data wipes, with wipes used against duplication.',
          'You may not use more than five accounts, and punishments can extend to linked accounts. Impersonating staff is also banned.',
        ],
      },
      {
        heading: 'Real-money and cross-server trading',
        paragraphs: [
          'DonutSMP rules prohibit **IRL (real-money) trading** – buying or selling items, money, accounts or services for real money outside official DonutSMP channels – even when both players agree. Cross-server trading and external gambling are banned too.',
          'Third-party stores that sell DonutSMP items, including this one, are not part of DonutSMP and not affiliated with it. Buying from them is against DonutSMP rules and is done at the buyer\'s own risk. If you want to understand the risks first, read [buying money safely](/guides/buying-donutsmp-money-safely) and our page on [IRL trading](/donutsmp-irl-trade).',
        ],
      },
      {
        heading: 'Scams and player conduct',
        paragraphs: [
          'Scamming players in-game is common and largely allowed as long as no other rule is broken, so staff will not reverse a bad trade. Harassment, threats and spamming proximity voice chat are not allowed. Use `/block` on anyone who bothers you and report rule breakers through the official channels.',
        ],
      },
      {
        heading: 'Does the DonutSMP map reset?',
        paragraphs: [
          'According to the community wiki, the current world is Season 2; Season 1 ended because of economy inflation and duplication. No regular reset schedule has been announced, so treat your base and items as long-term – and watch the official Discord announcements for any change.',
        ],
      },
    ],
    faq: [
      { q: 'Is real-money trading allowed on DonutSMP?', a: 'No. Real-money (IRL) trading outside official DonutSMP channels is against the rules and can lead to punishment.' },
      { q: 'How many alt accounts can I use on DonutSMP?', a: 'The rules allow at most five accounts per player.' },
      { q: 'Are mods allowed on DonutSMP?', a: 'Only mods that give no advantage. Hacked clients, radar, freecam, health indicators, macros and inventory or movement mods are banned.' },
      { q: 'Will DonutSMP reset the map?', a: 'The current world is Season 2 and no reset schedule has been announced. Follow the official Discord for news.' },
    ],
    related: ['donutsmp-base-protection', 'donutsmp-ip-how-to-join', 'donutsmp-money-economy'],
    shopLinks: [
      { label: 'IRL trading explained', to: '/donutsmp-irl-trade' },
      { label: 'Buying money safely', to: '/guides/buying-donutsmp-money-safely' },
    ],
    updatedAt: UPDATED,
  },
];

export function wikiBySlug(slug: string): WikiArticle | undefined { return wikiArticles.find((a) => a.slug === slug); }
