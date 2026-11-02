/**
 * DonutSMP wiki – additional economy, server and community articles (part A).
 * Same format and rules as wiki.ts. Strings support **bold**, `code` and [label](/internal-link).
 *
 * Server-specific facts were cross-checked against the community wikis (donutsmp.wiki and
 * Donutpedia, autumn 2026), including their summaries of the June 2026 update notes. Anything
 * only one unofficial source mentioned is attributed or phrased as "check in-game". Spawner values
 * are typical player-market values from daily trading in early November 2026.
 */
import type { WikiArticle } from './wiki';

const UPDATED = '2026-11-03';

export const wikiMoreA: WikiArticle[] = [
  // ───────────────────────────────────────────── Getting started
  {
    slug: 'donutsmp-beginner-guide',
    category: 'Getting started',
    title: 'DonutSMP Beginner Guide: Your First Day and First Week',
    seoTitle: 'DonutSMP Beginner Guide: First Day & Week',
    metaDescription:
      'A step-by-step DonutSMP beginner guide for your first hour, day and week: /rtp, homes, first money, safe storage and saving up for a first spawner.',
    summary: 'A step-by-step plan for your first hour, first day and first week on DonutSMP, from /rtp to a steady income.',
    intro:
      'DonutSMP throws you into a huge, crowded world with an empty balance, no protection and plenty of players who would happily take your stuff. The good news is that the first week follows a fairly predictable path. This guide breaks it into small steps so you always know what to do next, and which mistakes cost new players the most.',
    sections: [
      {
        heading: 'Before you join',
        paragraphs: [
          'Connect to `donutsmp.net` (Bedrock players keep port `19132`) – the full steps are in [how to join](/wiki/donutsmp-ip-how-to-join). Read `/rules` once when you arrive. The list of banned client mods is longer than on most servers, and a modded client you use elsewhere can get you banned here.',
        ],
      },
      {
        heading: 'Your first hour',
        paragraphs: ['Keep the first session simple and focused on survival:'],
        list: [
          'Use `/rtp` to get out into the wild, then walk or fly well away from the landing point.',
          'Collect wood, stone, food and a bed before dark – the usual vanilla start.',
          'Set a home with `/sethome` as soon as you have a safe spot, so a death does not cost you the whole trip back.',
          'Sell surplus resources with `/sell` to get your first money. Check prices with `/worth <item>`.',
          'Leave `/tpauto` off and deny teleport requests from anyone you do not know.',
        ],
      },
      {
        heading: 'Day one: secure the basics',
        paragraphs: [
          'Your goal for the first day is a small, hidden shelter and a basic tool set. Iron tools and armor come first, followed by an **ender chest** as soon as you can afford the obsidian and eye of ender. Your ender chest contents belong only to you, so it is the safest place for anything valuable until you have a proper base.',
          'Do not build anything big or bright on the surface yet. Base hunters scan from the air, and a lit wooden house next to an `/rtp` area is easy to spot. Underground is safer. More tips are in [base protection](/wiki/donutsmp-base-protection).',
        ],
      },
      {
        heading: 'Days two to four: your first income',
        paragraphs: [
          'Now you need something that produces money while you play. Good beginner options need no capital: mining and selling ores, a simple crop farm, or filling water and lava buckets, which usually sell for more than empty ones. Compare three ways to sell before dumping everything into `/sell`: the server base price, player requests in `/orders`, and listings on `/ah`.',
          'Your shard balance also grows on its own – every player earns one shard for every 10 minutes of playtime, so check `/shards` now and then. See [making money fast](/wiki/donutsmp-make-money-fast) for methods ranked by stage.',
        ],
      },
      {
        heading: 'Days five to seven: your first spawner',
        paragraphs: [
          'Most players aim for a first **skeleton spawner** by the end of the week. Spawners on DonutSMP generate drops without spawning mobs and stack into one block, so even one makes steady, sellable output. In early November 2026 a skeleton spawner typically traded for around 18M coins on the player market – see [spawner values](/wiki/donutsmp-spawner-values) for how to check the current price.',
          'Buy through the auction house rather than a pay-first deal, and read the item name and lore before confirming. If you would rather skip the grind, spawners and money are also sold in our store; that is against DonutSMP rules and at your own risk.',
        ],
      },
      {
        heading: 'Habits that keep you alive',
        paragraphs: ['A handful of habits prevent most early-game losses:'],
        list: [
          'Never share coordinates, screenshots of your base or your home names.',
          'Never pay first for an item someone promises to drop later.',
          'Keep spare gear in your ender chest and carry only what you need.',
          'Check `/help` when a command from an old video does not work – many changed in 2026.',
        ],
      },
    ],
    faq: [
      { q: 'What should I do first on DonutSMP?', a: 'Read `/rules`, use `/rtp`, move away from the landing area, gather basics and set a home with `/sethome`.' },
      { q: 'How do new players make money on DonutSMP?', a: 'Sell surplus resources with `/sell`, fill player orders, and save for a first spawner that keeps producing drops.' },
      { q: 'Where should I keep my valuables as a new player?', a: 'In your ender chest. Its contents belong only to you, so base raiders cannot take them.' },
    ],
    related: ['donutsmp-ip-how-to-join', 'donutsmp-commands', 'donutsmp-make-money-fast', 'donutsmp-faq-new-players'],
    shopLinks: [
      { label: 'Starter bundles', to: '/shop/bundles' },
      { label: 'Skeleton spawner', to: '/product/skeleton-spawner' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-java-vs-bedrock',
    category: 'Getting started',
    title: 'Java vs Bedrock on DonutSMP: Differences and Tips',
    seoTitle: 'DonutSMP Java vs Bedrock: What Is Different',
    metaDescription:
      'Java vs Bedrock on DonutSMP: how each edition joins, what is shared, how controls, crystal PvP, mods and voice chat differ, and tips for console players.',
    summary: 'Both editions share one DonutSMP world. What is the same, what plays differently and which edition suits you.',
    intro:
      'DonutSMP accepts Java and Bedrock players on the same address, and both play in the same world with the same economy. The server itself follows Java rules, though, which means the experience is not identical. This page explains what carries over between editions, where Bedrock players are at a disadvantage and how console players can connect.',
    sections: [
      {
        heading: 'Joining on each edition',
        paragraphs: [
          'On **Java**, add `donutsmp.net` in the multiplayer list – no port needed. According to the community wiki, the server announced support for the latest Minecraft Java version during the June 2026 updates, so an up-to-date launcher is the safest choice.',
          'On **Bedrock** (Windows, mobile, consoles), add `donutsmp.net` with port `19132`. Bedrock client support was updated in June 2026 as well. If you cannot connect, check that you typed the Bedrock port and not the Java one. Both editions need a genuine account; cracked clients cannot join.',
        ],
      },
      {
        heading: 'What is the same',
        paragraphs: [
          'Your balance, shards, homes, spawners and items are part of the same world no matter how you connect. Commands such as `/sell`, `/ah`, `/orders`, `/rtp` and `/pay` work on both editions, and you trade with Java and Bedrock players on the same auction house.',
          'Because the world follows Java rules, mechanics like Java redstone, Java combat timing and the DonutSMP spawner system behave the same for everyone. Guides written for Java usually apply to Bedrock players on DonutSMP too.',
        ],
      },
      {
        heading: 'What plays differently',
        paragraphs: ['A few differences matter in practice:'],
        list: [
          '**Combat** – crystal PvP is the main fighting style and relies on fast hotbar and offhand swaps. Touch controls and controllers make this harder, so keyboard and mouse on Java is usually easier.',
          '**Menus** – server menus are designed for Java and can look or behave slightly differently on Bedrock. Read confirmation screens carefully before buying or listing.',
          '**Mods** – the client mod rules mainly concern Java players. Anything that gives an advantage, such as radar, freecam or auto-clickers, is banned on every edition.',
          '**Voice chat** – proximity voice chat uses Simple Voice Chat, a Java mod, so Bedrock players generally cannot use it.',
        ],
      },
      {
        heading: 'Console players',
        paragraphs: [
          'Xbox, PlayStation and Switch versions of Bedrock only show featured servers by default and have no field for a custom address. Console players usually rely on a server-joining app or a DNS method to reach a server like DonutSMP. Use a well-known, current method and never enter your Microsoft password anywhere other than the official sign-in page.',
        ],
      },
      {
        heading: 'Which edition should you use?',
        paragraphs: [
          'If you want to compete in PvP or base hunt seriously, Java gives you the best controls and access to voice chat. If you mainly farm, trade and build, Bedrock works fine and lets you play on phone or console. Since your progress is shared, you can farm on Bedrock when away from your PC and switch to Java for fights.',
          'Whichever you use, copy player names exactly from chat or the tab list before using `/pay` – crossplay names can contain characters that are easy to mistype, and payments cannot be undone.',
        ],
      },
    ],
    faq: [
      { q: 'Can Java and Bedrock players play together on DonutSMP?', a: 'Yes. Both editions join `donutsmp.net` and share the same world, economy and auction house.' },
      { q: 'What port does Bedrock use for DonutSMP?', a: 'Port `19132` with the address `donutsmp.net`.' },
      { q: 'Is PvP harder on Bedrock?', a: 'Usually, yes. Crystal PvP depends on fast swaps that are easier with a keyboard and mouse on Java.' },
    ],
    related: ['donutsmp-ip-how-to-join', 'donutsmp-beginner-guide', 'donutsmp-rules'],
    shopLinks: [
      { label: 'Browse the shop', to: '/shop' },
      { label: 'Frequently asked questions', to: '/faq' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-faq-new-players',
    category: 'Getting started',
    title: 'DonutSMP FAQ: 15 Questions New Players Ask',
    seoTitle: 'DonutSMP FAQ: 15 New Player Questions',
    metaDescription:
      'Quick answers to the 15 questions new DonutSMP players ask most: joining, money, spawners, shards, teams, crates, base raids, mods and real-money trading.',
    summary: 'Short answers to the 15 questions new DonutSMP players ask most, from joining to money, spawners and rules.',
    intro:
      'New players on DonutSMP tend to ask the same questions in their first few days. Here are short, current answers to the fifteen most common ones, grouped by topic, with links to the full wiki articles when you want more detail. DonutSMP changes often, so `/help` in-game remains the final word.',
    sections: [
      {
        heading: 'Joining and accounts',
        paragraphs: ['The basics before you log in:'],
        list: [
          '**What is the IP?** `donutsmp.net` for both Java and Bedrock. Java needs no port; Bedrock uses port `19132`. Beware of look-alike addresses on server lists. See [how to join](/wiki/donutsmp-ip-how-to-join).',
          '**Can I play on Bedrock or console?** Yes, both editions share one world. Consoles need a workaround to add custom servers – see [Java vs Bedrock](/wiki/donutsmp-java-vs-bedrock).',
          '**How many accounts may I use?** The rules allow at most five accounts per player, and punishments can extend to linked accounts. Cracked accounts cannot join at all.',
        ],
      },
      {
        heading: 'Money and trading',
        paragraphs: ['How the economy works for a new player:'],
        list: [
          '**How do I make money?** Sell with `/sell`, fill player `/orders` and list on `/ah`. Later, spawners give steady income. See [making money fast](/wiki/donutsmp-make-money-fast).',
          '**What are shards?** A second currency earned at one shard per 10 minutes of playtime, with no rank needed, and spent in the Shard Shop. They cannot be sent with `/pay`. See [shards](/wiki/donutsmp-shards).',
          '**How much is a spawner worth?** It depends on the type and the day. In early November 2026 a skeleton spawner typically traded around 18M coins – see [spawner values](/wiki/donutsmp-spawner-values).',
        ],
      },
      {
        heading: 'Gameplay',
        paragraphs: ['Features that work differently from other servers:'],
        list: [
          '**Do spawners spawn mobs?** No. They generate drops into their own storage, which you empty by right-clicking, and spawners of one type stack into a single block – see [how spawners work](/wiki/donutsmp-spawners-explained).',
          '**Are there teams or clans?** The `/team` system was removed in June 2026. The friends system replaced it – see [teams and friends](/wiki/donutsmp-teams-friends).',
          '**Can I still open crates?** No. Crates and crate keys were removed in 2026 – see [crates and keys](/wiki/donutsmp-crates-keys).',
        ],
      },
      {
        heading: 'Rules and safety',
        paragraphs: ['What gets players banned or robbed:'],
        list: [
          '**Is raiding allowed?** Yes, base hunting is part of the game. Cheats used to find bases are not. Read [base protection](/wiki/donutsmp-base-protection).',
          '**Which mods are allowed?** Only mods that give no advantage. Radar, freecam, health indicators, macros and similar mods are banned – see [rules](/wiki/donutsmp-rules).',
          '**Will staff refund a scam?** Generally no. Most in-game scams are not against the rules, so prevention is everything: never pay first, and learn the [common scams](/wiki/donutsmp-scams).',
        ],
      },
    ],
    faq: [
      { q: 'Is DonutSMP free to play?', a: 'Yes. You need a genuine Minecraft account, but joining is free. Ranks on the official store are optional 30-day subscriptions.' },
      { q: 'Does DonutSMP reset the map?', a: 'The current world is Season 2, described as permanent, and no reset schedule has been announced.' },
      { q: 'Is buying DonutSMP money allowed?', a: 'No. Real-money trading outside official channels breaks the rules and is at the buyer\'s risk. See [real-money trading risks](/wiki/donutsmp-real-money-trading-risks).' },
    ],
    related: ['donutsmp-beginner-guide', 'donutsmp-commands', 'donutsmp-rules', 'donutsmp-money-economy'],
    shopLinks: [
      { label: 'Store FAQ', to: '/faq' },
      { label: 'DonutSMP money', to: '/donutsmp-money' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── Economy
  {
    slug: 'donutsmp-spawner-values',
    category: 'Economy',
    title: 'DonutSMP Spawner and Item Values in Coins (Price Guide)',
    seoTitle: 'DonutSMP Spawner Values & Price Guide (2026)',
    metaDescription:
      'Typical DonutSMP spawner values in coins for skeleton, iron golem and cow spawners, why prices move, and how to check any item price yourself with /ah.',
    summary: 'Typical player-market values for popular DonutSMP spawners and how to check what any item is worth today.',
    intro:
      'Ask ten DonutSMP players what a spawner is worth and you will get ten answers, because prices are set by players, not by the server. This page lists typical market values for the most traded spawners as of early November 2026 and, more importantly, shows you how to check the current price of any item yourself before you buy or sell.',
    sections: [
      {
        heading: 'Typical spawner values (November 2026)',
        paragraphs: [
          'These are typical player-market values seen in daily trading in early November 2026. They move with supply and demand, so treat them as a starting point, not a fixed price:',
        ],
        list: [
          '**Skeleton spawner** – about **18M** coins each. The most traded type; bones and arrows always have buyers.',
          '**Iron Golem spawner** – about **41M** coins each. Produces iron ingots for hoppers, buckets and storage.',
          '**Cow spawner** – about **100M** coins each.',
        ],
      },
      {
        heading: 'Why spawner prices move',
        paragraphs: [
          'According to the community wikis, no new spawners are currently created by the server – they were removed from the Shard Shop and crates are gone. Supply is therefore closed, and prices depend on how many existing spawners players are willing to sell. A big base raid or an inactive player selling out can flood the market for a few days; heavy buying can push it up just as fast.',
          'Server changes matter too. The value of a spawner depends on what its output earns, so a change to `/sell` prices – such as the temporary 3× sell multiplier announced in June 2026 – affects what players will pay. Talk of the planned world border expansion has also driven speculation, but no date has been confirmed.',
        ],
      },
      {
        heading: 'How to check any item\'s value yourself',
        paragraphs: ['We do not list values for other items because they change too quickly. Check them in this order:'],
        list: [
          '`/ah <search>` – the current asking prices. Look at several listings, not just the cheapest.',
          '`/order <search>` – what buyers are offering right now. The gap between orders and listings shows the real range.',
          '`/worth <item>` – the server base price, the floor for items `/sell` accepts.',
          '**DonutStats** – an independent community site (not official) with auction data and price history. Check the timestamp.',
        ],
      },
      {
        heading: 'Reading a price correctly',
        paragraphs: [
          'An auction listing is only an asking price until someone buys it. Always divide by the quantity to get a **price per spawner**, since stack listings can hide a worse unit price. Large quantities are harder to sell at the same rate, so a stack of 64 is not always worth exactly 64 times the single price.',
          'Compare like with like. A spawner of a different mob, a renamed item or a container whose contents you cannot inspect is not a bargain on the item you actually want.',
        ],
      },
      {
        heading: 'Buying or selling a spawner safely',
        paragraphs: [
          'Use the auction house so the server handles the swap, and read the item name and lore before confirming. Avoid pay-first deals with strangers. Spawners are also sold in our [spawner shop](/donutsmp-spawners); real-money trading is against DonutSMP rules and at the buyer\'s risk.',
        ],
      },
    ],
    faq: [
      { q: 'How much is a skeleton spawner worth on DonutSMP?', a: 'Around 18M coins each in early November 2026. Check `/ah skeleton spawner` for today\'s listings, as prices move.' },
      { q: 'How much is an iron golem spawner worth?', a: 'Typically about 41M coins each in early November 2026, depending on supply and demand.' },
      { q: 'How do I check what an item is worth on DonutSMP?', a: 'Compare `/ah <search>` listings with `/order <search>` offers and the base price from `/worth <item>`.' },
    ],
    related: ['donutsmp-spawners-explained', 'donutsmp-auction-flipping', 'skeleton-spawner-farm', 'iron-golem-farm'],
    shopLinks: [
      { label: 'DonutSMP spawners', to: '/donutsmp-spawners' },
      { label: 'Cow spawner', to: '/product/cow-spawner' },
      { label: 'Iron golem spawner', to: '/product/iron-golem-spawner' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-auction-flipping',
    category: 'Economy',
    title: 'How to Flip Items on the DonutSMP Auction House',
    seoTitle: 'DonutSMP Auction House Flipping Guide',
    metaDescription:
      'How to flip items on the DonutSMP auction house: finding underpriced listings, unit prices, how 2026 sell routing changed margins, and managing risk.',
    summary: 'Buy low, sell high: how auction house flipping works on DonutSMP and how to do it without losing money.',
    intro:
      'Flipping means buying an item below its usual price and reselling it for more. On DonutSMP it is one of the few money methods that needs no farm and no base – just starting capital, patience and good price knowledge. It is also easy to lose money doing it. This guide covers where margins come from, how the 2026 market changes affect flippers and how to keep risk under control.',
    sections: [
      {
        heading: 'Where flipping margins come from',
        paragraphs: ['Profitable flips usually appear in a few situations:'],
        list: [
          'A seller wants money **now** and lists below comparable listings.',
          'A stack total hides a low **unit price** that others overlook.',
          'An order pays more per item than the cheapest matching listing.',
          'Demand shifts after an update or event faster than sellers adjust.',
          'A seller misjudges an item\'s enchantments or condition.',
        ],
      },
      {
        heading: 'How the 2026 market changes flipping',
        paragraphs: [
          'According to the community wiki\'s summary of the June 2026 update notes, the market is now more connected than before. `/sell` checks matching orders first and sends items to a higher-paying order when one exists. An auction listing can fill a higher-paying order automatically, and a new order can automatically buy matching listings at or below its price.',
          'For flippers this means the easy gaps between orders and listings close faster, often instantly. The remaining margins come from items that need judgement – enchanted gear, spawners and rarer items where no exact order exists – and from timing, such as buying during a sell-off.',
          '`/shop` also became **Quick Buy**, which buys the cheapest matching auction listing for you. It can spend up to three times the price it showed, with a warning above that, so read confirmation screens before accepting.',
        ],
      },
      {
        heading: 'A simple flipping routine',
        paragraphs: ['A repeatable process beats one lucky deal:'],
        list: [
          'Pick two or three item types and learn their normal price range by checking `/ah` and `/orders` daily.',
          'Write down unit prices with dates; independent tools like DonutStats help with price history.',
          'Buy only when a listing is clearly below the normal range, after checking enchantments, durability and the exact item type.',
          'Relist just below competing listings rather than at the highest price you have seen.',
          'Count profit only when the resale completes – unsold items are inventory, not income.',
        ],
      },
      {
        heading: 'Fees, risk and capital',
        paragraphs: [
          'The community wikis list no fixed auction house tax, so read each listing confirmation screen for any cost before you confirm, and include it in your margin if one appears. The number of listing slots depends on your rank.',
          'The bigger risks are price drops and slow sales. Spawner and gear prices can fall after a big raid floods the market. A common rule is to never put more than about half your balance into flips, so you can still act when a real bargain appears. For more money methods, see the guide on [how to get money on DonutSMP](/guides/how-to-get-money-on-donutsmp).',
          'Some flippers top up their starting capital with coins bought from a store such as [DonutSMP money](/donutsmp-money). Real-money trading is against DonutSMP rules and at the buyer\'s risk.',
        ],
      },
    ],
    faq: [
      { q: 'Is flipping worth it on DonutSMP?', a: 'It can be, but it needs starting capital and price knowledge. Margins on simple items close quickly since orders and listings were linked in 2026.' },
      { q: 'Does the DonutSMP auction house charge a tax?', a: 'The community wikis list no fixed tax. Check the listing confirmation screen for any cost before you confirm.' },
      { q: 'What items are best to flip?', a: 'Items that need judgement – enchanted gear, spawners and rare items – since simple bulk items are matched to orders automatically.' },
    ],
    related: ['donutsmp-auction-house', 'donutsmp-spawner-values', 'donutsmp-make-money-fast', 'donutsmp-money-economy'],
    shopLinks: [
      { label: 'Investment items', to: '/shop/investments' },
      { label: 'DonutSMP money', to: '/donutsmp-money' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-make-money-fast',
    category: 'Economy',
    title: 'Best Ways to Make Money Fast on DonutSMP (Ranked)',
    seoTitle: 'Fastest Ways to Make Money on DonutSMP',
    metaDescription:
      'DonutSMP money methods ranked by stage: the fastest options with zero balance, what to do with a few million, and how late-game players grow their wealth.',
    summary: 'Money methods ranked for early, mid and late game, so you always use the fastest option for your current balance.',
    intro:
      'The fastest way to make money on DonutSMP depends on how much you already have. A method that is perfect with 500M coins is useless with 500 coins, and the other way round. This page ranks the main methods by stage. For a deeper look at each method, read our guide on [how to get money on DonutSMP](/guides/how-to-get-money-on-donutsmp).',
    sections: [
      {
        heading: 'How the methods are ranked',
        paragraphs: [
          'Each list is ordered by money per hour of your time at that stage, with risk in mind. Capital, time and safety all count: a method that earns a lot but gets your base found is not fast in the long run. Prices change often, so always check `/worth`, `/orders` and `/ah` before committing.',
        ],
      },
      {
        heading: 'Early game: zero to a few million',
        paragraphs: ['With an empty balance, use methods that need no starting money:'],
        list: [
          '**1. Fill player orders.** `/orders` often pays more than base price for useful blocks and redstone items, and you only need the items.',
          '**2. Filled buckets.** Water and lava buckets usually sell for more than empty ones, and lava is plentiful in the Nether.',
          '**3. Mining and selling.** Ores and stone sell through `/sell`; compare `/worth` with current orders first.',
          '**4. A simple crop farm.** Slow alone, but it keeps producing while you do the other three.',
        ],
      },
      {
        heading: 'Mid game: a few million to around 100M',
        paragraphs: ['Once you have capital, put it into things that produce more money:'],
        list: [
          '**1. Your first spawners.** A skeleton spawner typically traded around 18M coins in early November 2026 and keeps producing sellable drops. Stack more of the same type as income grows.',
          '**2. Order flipping.** Create your own buy orders for bulk items below auction prices, then list them on `/ah`. It works best on cheap, high-volume items.',
          '**3. Crafting up.** Turn raw output into what players need – iron into hoppers and buckets, bones into bone meal – and sell where the price is highest.',
        ],
      },
      {
        heading: 'Late game: 100M and up',
        paragraphs: ['With serious capital, the fastest growth comes from scale and market knowledge:'],
        list: [
          '**1. Large stacked spawner farms.** More expensive types like iron golem (about 41M) or cow spawners (about 100M) in a well-hidden base. See [spawner values](/wiki/donutsmp-spawner-values).',
          '**2. Auction house flipping.** Spawners and enchanted gear during sell-offs. Read [auction flipping](/wiki/donutsmp-auction-flipping) first.',
          '**3. Base hunting.** High variance but potentially huge. Needs an elytra, rockets and totems – and makes you a target too.',
        ],
      },
      {
        heading: 'Methods to avoid',
        paragraphs: [
          'Some "fast money" ideas cost far more than they make. Player-run gambling games are built so the host wins on average – in the popular dispenser "paper game", ties go to the host, which gives the house roughly an 11% edge. Duping and exploits lead to bans and data wipes, and pay-first deals with strangers are the most common way new players lose everything.',
          'Some players skip the early grind by buying coins from a store such as ours at [DonutSMP money](/donutsmp-money). Real-money trading is against DonutSMP rules and at the buyer\'s risk – read [real-money trading risks](/wiki/donutsmp-real-money-trading-risks) first.',
        ],
      },
    ],
    faq: [
      { q: 'What is the fastest way to make money on DonutSMP with nothing?', a: 'Fill player orders and sell filled buckets and mined resources. None of these need starting money.' },
      { q: 'When should I buy my first spawner?', a: 'As soon as you can afford one without spending everything. Spawners keep producing, so the earlier you start, the sooner they pay back.' },
      { q: 'Is gambling a good way to get rich on DonutSMP?', a: 'No. Player-run games favour the host on average, so most players lose money over time.' },
    ],
    related: ['donutsmp-money-economy', 'donutsmp-auction-flipping', 'donutsmp-spawner-values', 'donutsmp-beginner-guide'],
    shopLinks: [
      { label: 'DonutSMP money', to: '/donutsmp-money' },
      { label: 'Guide: how to get money', to: '/guides/how-to-get-money-on-donutsmp' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-crates-keys',
    category: 'Economy',
    title: 'DonutSMP Crates and Keys: What Happened to Them',
    seoTitle: 'DonutSMP Crates & Keys (Removed in 2026)',
    metaDescription:
      'Are there still crates on DonutSMP? How crates and crate keys used to work, why they were removed in 2026, and where to get spawners and gear today.',
    summary: 'DonutSMP crates and keys were removed in 2026. How they worked, and where players get the same rewards now.',
    intro:
      'Many older videos show players opening crates at spawn for spawners, netherite and amethyst tools. If you are looking for those crates today, you will not find them: crates and crate keys were removed from DonutSMP in 2026. This page explains how the system used to work, what replaced it and how to avoid scams built around "crate keys".',
    sections: [
      {
        heading: 'Are crates still on DonutSMP?',
        paragraphs: [
          'No. According to the community wikis, crates and crate keys were removed in the large update at the start of June 2026, together with the AFK lobby, spawn lobbies and the `/warp` command. The community wiki now lists crates as an archived, historical feature.',
          'Earlier in 2026, the Shard Shop had already stopped selling Gold and Amethyst keys and raised the prices of the remaining keys, before the whole system went.',
        ],
      },
      {
        heading: 'How crates used to work',
        paragraphs: [
          'Crates sat in a crate area reached with `/warp crates`. Each crate had a matching key, and opening one let you **choose one of seven rewards** instead of rolling at random. The community wiki lists five crates:',
        ],
        list: [
          '**Common** – diamond armor and tools.',
          '**Prime** – netherite armor, a mace, a netherite sword or a crossbow.',
          '**Gold** – one spawner of your choice.',
          '**Amethyst** – one of the amethyst items.',
          '**Crimson** – netherite armor, sword, axe or pickaxe.',
        ],
      },
      {
        heading: 'Where keys came from',
        paragraphs: [
          'Keys were not physical items but a resource stored on your account. Players received them from the hourly key-all, bought them on the official store, or, at times, bought them with shards. Since keys were account-bound, they could not be traded as items – and none can be obtained now.',
        ],
      },
      {
        heading: 'Where to get the same rewards today',
        paragraphs: ['Everything crates used to give is still in the game through other routes:'],
        list: [
          '**Spawners** – traded between players on `/ah`, through orders and direct trades. See [spawner values](/wiki/donutsmp-spawner-values).',
          '**Netherite gear** – crafted yourself (see [netherite](/wiki/netherite-ancient-debris)) or bought from players.',
          '**Premium shard items** – the Shard Shop still sells shard tools and enchanted gear. See [shards](/wiki/donutsmp-shards).',
        ],
      },
      {
        heading: 'Watch out for "crate key" offers',
        paragraphs: [
          'Because keys no longer exist, anyone offering DonutSMP crate keys for money or items is scamming you. The same goes for "free key" giveaways that ask for your login or a linking code.',
          'Mystery boxes and crates in our own store are a store product, not DonutSMP crates – read [mystery boxes explained](/guides/donutsmp-mystery-boxes-explained) for how they work. Like any third-party purchase, they are against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Can you still open crates on DonutSMP?', a: 'No. Crates and crate keys were removed in the June 2026 update.' },
      { q: 'What was in the Gold crate?', a: 'The Gold crate let you choose one spawner. Spawners are now traded between players instead.' },
      { q: 'Can I buy DonutSMP crate keys?', a: 'No. Keys no longer exist, so any offer to sell them is a scam.' },
    ],
    related: ['donutsmp-shards', 'donutsmp-spawner-values', 'donutsmp-scams'],
    shopLinks: [
      { label: 'Mystery boxes', to: '/shop/mystery-boxes' },
      { label: 'Mystery boxes explained', to: '/guides/donutsmp-mystery-boxes-explained' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-baltop-leaderboards',
    category: 'Economy',
    title: 'DonutSMP Baltop and Leaderboards Explained',
    seoTitle: 'DonutSMP Baltop & Leaderboards Explained',
    metaDescription:
      'What /baltop shows on DonutSMP, the other in-game leaderboards and /stats, how independent sites like DonutStats work, and why topping baltop has a cost.',
    summary: 'How /baltop and the other DonutSMP leaderboards work, where to see stats, and what a high rank really means.',
    intro:
      'Baltop is the leaderboard everyone checks on DonutSMP. It shows who holds the most money and has become a status symbol, with streamers racing to the top. This page explains what baltop actually measures, which other leaderboards exist and why being visible at the top comes with its own risks.',
    sections: [
      {
        heading: 'What /baltop shows',
        paragraphs: [
          '`/baltop` opens the money leaderboard, split into pages – `/baltop 2` shows the next page. It ranks players by the money they **currently hold**, not by how much they have earned. A player who spends a fortune on spawners can drop down the list while being richer than ever in items.',
          'Use `/bal <player>` to look up one player\'s balance directly. Remember that baltop counts only money: spawners, gear and shulker boxes full of items do not appear in it.',
        ],
      },
      {
        heading: 'Other in-game leaderboards',
        paragraphs: ['Money is not the only thing ranked:'],
        list: [
          '`/leaderboard` – a menu with the server\'s leaderboards.',
          '`/stats [player]` – a player\'s statistics, such as kills, deaths and playtime.',
          '`/bounty` – without a name, the bounty leaderboard. See [bounties](/wiki/donutsmp-bounties).',
          '`/shards [player]` – shard balances.',
        ],
      },
      {
        heading: 'Independent stats sites',
        paragraphs: [
          'Sites such as **DonutStats** (`donutstats.net`) collect public data into leaderboards for money, kills, deaths, playtime, shards, mob kills and more, plus price history for auction items. They are independent community projects, not official DonutSMP services. Data can lag behind the server, so check the timestamp, and a missing player is not proof that they stopped playing.',
        ],
      },
      {
        heading: 'Why baltop numbers jump',
        paragraphs: [
          'Balances at the top move fast. Large spawner sales, flipping and player-run gambling games move huge sums between a few players. According to Donutpedia, gambling pushed the number of billionaires so high at one point that 1B coins only ranked around 11,000th. Big swings usually reflect money changing hands, not new money being created.',
          'The rules allow DonutSMP to suspend accounts and remove items for real-money trading or duping, so balances built that way can disappear overnight.',
        ],
      },
      {
        heading: 'Should you chase baltop?',
        paragraphs: [
          'A high rank is visible to everyone, including scammers and players looking for bounty targets. Many wealthy players keep a large part of their wealth in items or spread across a hidden base for that reason. If you want to grow your balance, focus on steady income first rather than the leaderboard itself – see [making money fast](/wiki/donutsmp-make-money-fast).',
          'Some players boost their balance with coins bought from a store such as [DonutSMP money](/donutsmp-money); that breaks DonutSMP rules and is at the buyer\'s risk.',
        ],
      },
    ],
    faq: [
      { q: 'How do I see the richest players on DonutSMP?', a: 'Type `/baltop`. Add a page number, such as `/baltop 2`, to see further down the list.' },
      { q: 'Does baltop include items and spawners?', a: 'No. Baltop only counts the money a player currently holds.' },
      { q: 'Is DonutStats official?', a: 'No. DonutStats is an independent community site that collects public DonutSMP data.' },
    ],
    related: ['donutsmp-money-economy', 'donutsmp-bounties', 'donutsmp-commands'],
    shopLinks: [
      { label: 'DonutSMP money', to: '/donutsmp-money' },
      { label: 'Money packs', to: '/shop/money' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-real-money-trading-risks',
    category: 'Economy',
    title: 'Is Buying DonutSMP Money Safe? Real-Money Trading Risks',
    seoTitle: 'Is Buying DonutSMP Money Safe? RMT Risks',
    metaDescription:
      'An honest look at buying DonutSMP money: what the rules say about real-money trading, the risks to your account, seller scams and what is allowed.',
    summary: 'What DonutSMP rules say about buying money and items, the real risks involved and the official alternatives.',
    intro:
      'Searching for "buy DonutSMP money" brings up plenty of sellers – including us. Before you buy from anyone, you should know where the rules stand and what can go wrong. This page gives a neutral overview: buying in-game money or items for real money outside official channels is against DonutSMP rules, and anyone who does it accepts the risk.',
    sections: [
      {
        heading: 'What the rules say',
        paragraphs: [
          'DonutSMP prohibits buying or selling accounts, items, currency, services or access for real money outside official DonutSMP channels, unless DonutSMP authorises it in writing. The rule applies **even when both players agree**. Cross-server trading and external gambling are banned too.',
          'Possible consequences listed in the rules include account suspension or termination and removal of virtual items, and penalties can extend to linked accounts. Third-party stores, including this one, are not part of DonutSMP and not affiliated with it.',
        ],
      },
      {
        heading: 'The real risks',
        paragraphs: ['If you buy from a third party, these are the risks you take on:'],
        list: [
          '**Account action** – enforcement is entirely DonutSMP\'s decision, and purchased money or items can be removed.',
          '**Seller scams** – fake stores and Discord sellers take payment and deliver nothing.',
          '**No official help** – DonutSMP support handles official store purchases, so do not expect it to resolve a problem with an unofficial seller.',
          '**Account theft** – any seller who asks for your password, login code or session files can take your account.',
        ],
      },
      {
        heading: 'Reducing risk if you decide to buy',
        paragraphs: ['If you still choose to buy, these checks reduce the chance of being scammed:'],
        list: [
          'Never share your Minecraft or Microsoft password, a linking code or session files. Delivery should only need your in-game name.',
          'Prefer sellers that deliver with an ordinary `/pay` and show an order status you can follow.',
          'Start with a small order before a large one.',
          'Look for reviews outside the seller\'s own Discord and keep receipts and screenshots.',
          'Double-check your username on the order – a typo can send coins to someone else.',
        ],
      },
      {
        heading: 'Allowed alternatives',
        paragraphs: [
          'The official DonutSMP store sells membership ranks and shards, which is the rule-compliant way to spend real money on the server. Everything else – money, spawners, gear – can be earned in-game; see [making money fast](/wiki/donutsmp-make-money-fast) for methods by stage.',
          'For more detail on how third-party delivery works and the risks involved, read [buying DonutSMP money safely](/guides/buying-donutsmp-money-safely) and our page on [IRL trading](/donutsmp-irl-trade). Our [DonutSMP money](/donutsmp-money) page lists what we sell; buying it is at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Can you get banned for buying DonutSMP money?', a: 'Real-money trading breaks DonutSMP rules, and the rules allow suspensions and item removal. The risk is the buyer\'s.' },
      { q: 'Is the official DonutSMP store allowed?', a: 'Yes. Ranks and shards bought on the official store are the rule-compliant way to spend real money.' },
      { q: 'Should a seller ever need my password?', a: 'No. Delivering in-game money only needs your username. Anyone asking for a password or login code is a scammer.' },
    ],
    related: ['donutsmp-rules', 'donutsmp-scams', 'donutsmp-money-economy'],
    shopLinks: [
      { label: 'Buying money safely', to: '/guides/buying-donutsmp-money-safely' },
      { label: 'IRL trading explained', to: '/donutsmp-irl-trade' },
      { label: 'DonutSMP money', to: '/donutsmp-money' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── PvP & combat
  {
    slug: 'donutsmp-bounties',
    category: 'PvP & combat',
    title: 'DonutSMP Bounties: How /bounty Works',
    seoTitle: 'DonutSMP Bounty Guide: /bounty Explained',
    metaDescription:
      'How bounties work on DonutSMP: checking and placing them with /bounty, whether placing one is worth it, staying safe with a bounty and the PvP economy.',
    summary: 'How to check and place bounties with /bounty, and how to stay alive when there is money on your head.',
    intro:
      'Bounties let DonutSMP players put their own money on another player\'s head. They turn PvP into part of the economy: a well-known player with a big bounty attracts hunters from across the server, and "surviving a huge bounty" has become a popular video format. This page covers the commands and the strategy on both sides.',
    sections: [
      {
        heading: 'Bounty commands',
        paragraphs: ['The bounty system runs through one command:'],
        list: [
          '`/bounty` – without a name, shows the bounty leaderboard.',
          '`/bounty <player>` – shows how much is currently on that player.',
          '`/bounty add <player> <amount>` – adds your own money to that player\'s bounty. The amount leaves your balance.',
        ],
      },
      {
        heading: 'How bounties work',
        paragraphs: [
          'A bounty is a reward for killing the target, funded by other players. Several players can add to the same bounty, so totals on famous players grow large, and the target becomes worth hunting for anyone who can find them.',
          'Details such as minimum amounts or how a claim is paid out can change with updates, so check the `/bounty` menu in-game before relying on them.',
        ],
      },
      {
        heading: 'Is placing a bounty worth it?',
        paragraphs: [
          'Placing a bounty is a way to spend money, not make it. It makes sense when you want someone hunted and cannot do it yourself, or as a community event. A small bounty on a player who rarely leaves their base will probably sit unclaimed. Large bounties on active players get the most attention.',
          'Do not use bounties to settle trade disputes. Staff do not reverse scams, and a bounty will not get your items back.',
        ],
      },
      {
        heading: 'If there is a bounty on you',
        paragraphs: ['A bounty makes you a target. Reduce what you can lose:'],
        list: [
          'Check `/bounty <your name>` regularly so you know when it grows.',
          'Leave valuables in your ender chest or a hidden stash; carry only fighting gear.',
          'Keep a [totem of undying](/wiki/totems-pvp-gear) in your offhand and ender pearls ready.',
          'Never accept teleport requests while you have a bounty – teleport traps are common.',
          'Avoid predictable spots such as common `/rtp` landing areas.',
        ],
      },
      {
        heading: 'Bounties and the PvP economy',
        paragraphs: [
          'Most money in PvP comes from the loot a defeated player drops, not from rewards. Shards are no longer given for player kills, and the old duels gamemode was removed in June 2026. The community wiki reports that a matchmaking-style RTP queue launched in beta at the end of June, so check `/help` for current PvP modes.',
          'Good gear is the real cost of PvP. Totems, armor and end crystals are bought and sold constantly; they are also in our store under [totem of undying](/product/totem-of-undying) and [armor](/shop/armor), with the usual note that real-money trading is against DonutSMP rules.',
        ],
      },
    ],
    faq: [
      { q: 'How do I put a bounty on someone on DonutSMP?', a: 'Use `/bounty add <player> <amount>`. The money is taken from your balance.' },
      { q: 'How do I check a player\'s bounty?', a: 'Type `/bounty <player>`. Use `/bounty` on its own to see the bounty leaderboard.' },
      { q: 'Do you get shards for kills on DonutSMP?', a: 'No. Shards for player kills were removed. Shards now come from playtime or the official store.' },
    ],
    related: ['totems-pvp-gear', 'donutsmp-baltop-leaderboards', 'donutsmp-scams'],
    shopLinks: [
      { label: 'Totem of undying', to: '/product/totem-of-undying' },
      { label: 'Armor', to: '/shop/armor' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── Server & rules
  {
    slug: 'donutsmp-teams-friends',
    category: 'Server & rules',
    title: 'Teams and Playing with Friends on DonutSMP (2026)',
    seoTitle: 'DonutSMP Teams & Playing With Friends',
    metaDescription:
      'What happened to /team on DonutSMP, how the friends and following system works, and how to share a base, items and money with friends safely in 2026.',
    summary: 'Teams were removed in 2026. How the friends system works and how to play with friends without getting raided.',
    intro:
      'Playing DonutSMP with friends makes base building, farming and fights much easier – but it is also how many bases get raided. The way groups work changed in 2026, when the old team system was removed. This page explains what exists now and how to set up a shared base without trusting the wrong person.',
    sections: [
      {
        heading: 'What happened to /team?',
        paragraphs: [
          'DonutSMP used to have teams of up to 50 members with a shared team home, team chat and permissions set by the owner. According to the community wikis, teams were removed in the large update at the start of June 2026, together with `/team home`. Some solo players used a one-person team just for an extra home slot, and that trick is gone too.',
          'Old guides and videos that tell you to type `/team create` no longer apply. If a team feature ever returns, `/help` will show it.',
        ],
      },
      {
        heading: 'The friends and following system',
        paragraphs: [
          'Teams were replaced by friends and following lists. `/friend` shows your friends, and its subcommands let you search, follow players and see your followers. The community wiki notes that privacy settings in `/settings` can limit messages and requests to friends or players you follow – a useful filter against random teleport requests.',
          'Being on a friends list gives no access to your base or items. It is a social list, not a permission system.',
        ],
      },
      {
        heading: 'Sharing a base with friends',
        paragraphs: ['Without team homes, shared bases depend on trust and good habits:'],
        list: [
          'Use `/tpa` and `/tpahere` only with people you know well; each player sets their own homes.',
          'Your **ender chest** stays private to you even in a shared base, so keep personal valuables there.',
          'Keep the spawner room separate from shared areas, and do not give everyone its location.',
          'If someone leaves the group on bad terms, move your most valuable items.',
        ],
      },
      {
        heading: 'Moving money and items between friends',
        paragraphs: [
          'Use `/pay <player> <amount>` for money – it is instant and cannot be undone, so check the name. For items, a drop trade at a neutral spot works between people who trust each other; with anyone else, use the auction house so the server handles the swap.',
          'Some groups pool money to buy their first spawners faster. Spawners and money are also sold in our [spawner shop](/donutsmp-spawners) and [money shop](/donutsmp-money); real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
      {
        heading: 'Finding people to play with',
        paragraphs: [
          'The official Discord (`/discord` in-game) is the usual place to find groups, and it has included a recruitment area for teams and players. Treat new contacts carefully: base hunters often join groups to find bases. Meet away from your base until you trust someone. See [Discord and support](/wiki/donutsmp-discord-support) for spotting fake servers.',
        ],
      },
    ],
    faq: [
      { q: 'Does DonutSMP still have teams?', a: 'No. The `/team` system was removed in the June 2026 update and replaced by friends and following lists.' },
      { q: 'How do I add a friend on DonutSMP?', a: 'Use `/friend` and its search and follow options. Being friends does not give access to your base or items.' },
      { q: 'How do I share items with a friend safely?', a: 'Use `/pay` for money and the auction house for items with anyone you do not fully trust.' },
    ],
    related: ['donutsmp-base-protection', 'donutsmp-commands', 'donutsmp-discord-support'],
    shopLinks: [
      { label: 'Bundles', to: '/shop/bundles' },
      { label: 'DonutSMP spawners', to: '/donutsmp-spawners' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-discord-support',
    category: 'Server & rules',
    title: 'DonutSMP Discord and Support: Official Links and Fake Servers',
    seoTitle: 'DonutSMP Discord & Support: Official Links',
    metaDescription:
      'The official DonutSMP Discord, support portal and store links, how to open a support ticket, and how to spot fake Discord servers and scam DMs.',
    summary: 'The official DonutSMP Discord and support links, how tickets work and how to recognise fake servers and scam DMs.',
    intro:
      'DonutSMP is big enough that copycat Discord servers, fake support accounts and scam DMs are everywhere. Knowing the official links and how real support works is the easiest way to stay safe. This page lists the official channels as given by the community wikis and the signs that a server or message is fake.',
    sections: [
      {
        heading: 'Official DonutSMP channels',
        paragraphs: ['These are the official links listed by the community wikis in autumn 2026:'],
        list: [
          '**Website:** `donutsmp.net`',
          '**Discord:** `discord.gg/donutsmp` – also linked from `/discord` in-game.',
          '**Support portal:** `support.donutsmp.net`',
          '**Store:** `store.donutsmp.net` – ranks and shards.',
          '**Account verification:** `verify.donutsmp.net` with the in-game `/link` command.',
        ],
      },
      {
        heading: 'How to get support',
        paragraphs: [
          'Account, moderation and purchase problems go through the support portal. You sign in with Discord or Google and link your Minecraft account by running the in-game link command with your code. The portal itself estimates that most tickets are answered within 24–48 hours.',
          'A good ticket includes your Minecraft username, a clear description, the approximate date and time, and only the evidence needed. Never post passwords, IP addresses or payment details in public channels.',
        ],
      },
      {
        heading: 'Spotting fake Discord servers',
        paragraphs: [
          'Fake servers copy the DonutSMP name and logo to run giveaway scams, sell fake items or steal accounts. Join through `/discord` in-game or the official website rather than a link someone sends you.',
          'Many community servers – giveaways, spawner markets, stats bots – are independent. They are not necessarily scams, but they are not official, and their staff are not DonutSMP staff. Invite names can look alike, so check each link before you join.',
        ],
      },
      {
        heading: 'Red flags in DMs',
        paragraphs: ['Treat any of these as a scam until proven otherwise:'],
        list: [
          'Someone claiming to be staff who messages you first about a ban, a prize or "suspicious activity".',
          'Requests for your password, a linking or verification code, or session files.',
          'Requests to screenshare while you log in or link an account – the official team has warned against this.',
          'Free ranks, shards, crate keys or money in exchange for "verifying" on an outside website.',
          'Pressure to act fast before an offer "expires".',
        ],
      },
      {
        heading: 'If your account is at risk',
        paragraphs: [
          'Change your Microsoft password, sign out of other sessions and enable two-step verification. Then open a ticket on the support portal. Impersonating staff is against DonutSMP rules, so report fake staff accounts through official channels. More scam patterns are in [common scams](/wiki/donutsmp-scams).',
          'Our store is an independent third-party shop, not DonutSMP support. We will never ask for your password; questions about our orders are answered on our [FAQ](/faq).',
        ],
      },
    ],
    faq: [
      { q: 'What is the official DonutSMP Discord?', a: 'The official invite is `discord.gg/donutsmp`, also linked from `/discord` in-game.' },
      { q: 'How do I contact DonutSMP support?', a: 'Open a ticket at `support.donutsmp.net` and link your Minecraft account when asked.' },
      { q: 'Will DonutSMP staff DM me for my password?', a: 'No legitimate process needs your password or a linking code sent in a DM. Treat such messages as scams.' },
    ],
    related: ['donutsmp-scams', 'donutsmp-rules', 'donutsmp-teams-friends'],
    shopLinks: [
      { label: 'Store FAQ', to: '/faq' },
      { label: 'IRL trading explained', to: '/donutsmp-irl-trade' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-scams',
    category: 'Server & rules',
    title: 'Common DonutSMP Scams and How to Avoid Them',
    seoTitle: 'Common DonutSMP Scams & How to Avoid Them',
    metaDescription:
      'The most common DonutSMP scams – pay-first trades, teleport traps, renamed items, fake middlemen, gambling hosts and fake shops – and how to avoid each.',
    summary: 'The scams that catch DonutSMP players most often, how each one works and the habits that protect you.',
    intro:
      'On DonutSMP, scamming is largely treated as part of the game as long as no other rule is broken, so staff will not reverse a bad trade. That makes knowing the common tricks essential. This page walks through the scams new and experienced players fall for most, in-game and off the server, and how to avoid each one.',
    sections: [
      {
        heading: 'Trade scams',
        paragraphs: ['Most losses happen in ordinary-looking trades:'],
        list: [
          '**Pay first** – the scammer asks you to `/pay` and promises to drop the item. They log off or walk away. Never pay first to a stranger.',
          '**Renamed items** – a cheap item renamed with an anvil to look valuable. Check the item type, lore and enchantments, not the name.',
          '**Wrong spawner type** – a cheaper spawner offered as a valuable one. Read the name and lore before paying.',
          '**Unit-price tricks** – a listing or order that looks cheap until you divide by the quantity. Always compare price per item.',
          '**Last-second swaps** – in drop trades, the item changes as you accept. Use the auction house where the server handles the swap.',
        ],
      },
      {
        heading: 'Teleport traps',
        paragraphs: [
          'Teleport traps are so common that they are a video genre of their own. A player offers a free base, items or a "deal" and asks you to teleport to them, or sends a `/tpahere` that drops you into a trap, lava or a crystal ambush. Others wait for players with `/tpauto` on.',
          'Keep `/tpauto` off, deny requests you did not start and never teleport carrying valuables. `/block <player>` stops repeat requests.',
        ],
      },
      {
        heading: 'Fake middlemen',
        paragraphs: [
          'For big trades, scammers offer a "trusted middleman" who holds both sides. Often the middleman is the scammer\'s alt or a friend. Unofficial middleman services on Discord are not run by DonutSMP and carry no guarantee. The auction house is the closest thing to a safe middleman, because the server completes both sides at once.',
        ],
      },
      {
        heading: 'Gambling hosts',
        paragraphs: [
          'Player-run games such as the dispenser "paper game" ask you to pay the host first. Even when the host pays out honestly, the game favours them: with two random numbers from 1 to 9 and ties going to the host, you win only 36 of 81 outcomes, about 44%. A dishonest host can simply keep the bet. Gambling on outside sites is also against the rules.',
        ],
      },
      {
        heading: 'Off-server scams',
        paragraphs: ['Some of the costliest scams happen outside the game:'],
        list: [
          '**Account phishing** – fake "verification" sites, requests for linking codes, screensharing during login or session files. Anyone with these can take your account.',
          '**Fake giveaways and staff** – Discord servers or DMs that pretend to be official. See [Discord and support](/wiki/donutsmp-discord-support).',
          '**Fake shops** – sellers that take real money and never deliver. Buying from third parties is against DonutSMP rules, so you cannot expect help from DonutSMP. Read [real-money trading risks](/wiki/donutsmp-real-money-trading-risks).',
          '**Items that no longer exist** – anyone selling crate keys is lying, since crates were removed.',
        ],
      },
      {
        heading: 'If you get scammed',
        paragraphs: [
          'Stop further payments, note the exact username, and save screenshots with the date and time. If a rule was broken – for example, an account was compromised or staff were impersonated – report it through the support portal. Many in-game scams are within the rules, though, so prevention matters more than reporting. Our own store will never ask for your password and delivers only to the username on your order; see [buying money safely](/guides/buying-donutsmp-money-safely).',
        ],
      },
    ],
    faq: [
      { q: 'Is scamming allowed on DonutSMP?', a: 'Many in-game scams are treated as part of the game as long as no other rule is broken, so staff usually will not refund them.' },
      { q: 'What is the safest way to trade on DonutSMP?', a: 'The auction house, because the server completes both sides of the trade. Never pay first to a stranger.' },
      { q: 'How do I avoid teleport traps?', a: 'Keep `/tpauto` off, deny requests you did not start and never teleport with valuables.' },
    ],
    related: ['donutsmp-discord-support', 'donutsmp-base-protection', 'donutsmp-auction-house', 'donutsmp-real-money-trading-risks'],
    shopLinks: [
      { label: 'Buying money safely', to: '/guides/buying-donutsmp-money-safely' },
      { label: 'Store FAQ', to: '/faq' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'donutsmp-map-regions-worlds',
    category: 'Server & rules',
    title: 'DonutSMP Map, Regions, Worlds and Resets',
    seoTitle: 'DonutSMP Regions, Worlds & Map Resets',
    metaDescription:
      'How the DonutSMP world works: the six overworld regions, where the Nether and End are hosted, random teleport, the planned border expansion and resets.',
    summary: 'The six DonutSMP regions, where the Nether and End run, how /rtp works and whether the map will reset.',
    intro:
      'DonutSMP is not one server in one place. The overworld is split across regions hosted around the world to keep ping low, while the Nether and End are shared by everyone. Knowing how this works helps you pick the right region, plan trips to the End and understand why some areas are mined out. This page sums up what the community wikis report.',
    sections: [
      {
        heading: 'The six overworld regions',
        paragraphs: [
          'Both community wikis list six regions: **NA East**, **NA West**, **EU Central**, **EU West**, **Asia** and **Oceania**. Donutpedia lists their hosting locations as Ashburn (Virginia), Hillsboro (Oregon), Frankfurt, Singapore and Sydney, with the EU West location not public. According to the community wiki, most players get a ping between 0 and 100 ms on their nearest region.',
          'Each region controls its own part of the overworld. According to Donutpedia, a region\'s share of the map depends on how many players use it.',
        ],
      },
      {
        heading: 'Choosing a region',
        paragraphs: [
          'Pick the region closest to you for the lowest ping – this matters most in crystal PvP. Your base sits in the part of the world owned by that region, so build where you will usually play. Travelling between regions is possible, but you play with the ping of whichever region you are in.',
        ],
      },
      {
        heading: 'Overworld, Nether and End',
        paragraphs: [
          'The Nether and the End are hosted only on the **NA East** region, so players in Europe, Asia and Oceania have higher ping there. Plan important End trips, such as hunting for an [elytra](/wiki/donutsmp-elytra), at times when you can live with the lag.',
          'Because every player shares the same Nether and End, areas near common portals and End cities close to the main island are usually looted. Travel far for ancient debris and End ships. The community wiki also reports that June 2026 updates allowed breaking bedrock and access below the bedrock layer in the overworld.',
        ],
      },
      {
        heading: 'Random teleport and coordinates',
        paragraphs: [
          '`/rtp` sends you to a random location in the wild. Its menu was simplified in June 2026, so check in-game how region selection currently looks. A random destination is not guaranteed to be safe, so arrive prepared.',
          'Coordinates are sensitive information on a semi-anarchy server. Do not share them, and remember that trying to find or use the world seed is against the rules.',
        ],
      },
      {
        heading: 'World border expansion',
        paragraphs: [
          'In June 2026 the DonutSMP team described a planned **world border expansion** and preparation work such as entity capacity and chunk-generation stability. As of autumn 2026 no date or final size has been confirmed, so treat predictions you see online as speculation.',
          'An expansion would open fresh terrain with unlooted structures, which could change the supply of some items. Spawners would not be affected under the current rules, since no new ones are created. See [spawner values](/wiki/donutsmp-spawner-values) for how prices react, and our [spawners](/donutsmp-spawners) page if you are looking to buy.',
        ],
      },
      {
        heading: 'Seasons and map resets',
        paragraphs: [
          'The current world is **Season 2**. Season 1 ended because of economy inflation and duplication. Season 2 is described as permanent, and no reset schedule has been announced, so treat your base and items as long-term and watch the official Discord for any change.',
        ],
      },
    ],
    faq: [
      { q: 'What regions does DonutSMP have?', a: 'Six overworld regions: NA East, NA West, EU Central, EU West, Asia and Oceania.' },
      { q: 'Where are the DonutSMP Nether and End hosted?', a: 'Both are hosted on the NA East region, so players far from the US East coast have higher ping there.' },
      { q: 'Is DonutSMP going to reset?', a: 'Season 2 is described as permanent and no reset has been announced. Follow the official Discord for news.' },
    ],
    related: ['donutsmp-ip-how-to-join', 'donutsmp-base-protection', 'donutsmp-elytra', 'donutsmp-rules'],
    shopLinks: [
      { label: 'Elytra', to: '/product/elytra' },
      { label: 'DonutSMP spawners', to: '/donutsmp-spawners' },
    ],
    updatedAt: UPDATED,
  },
];
