/**
 * DonutSMP wiki – additional articles (farms, gear, PvP). Pure data, no React.
 * Same format and rules as wiki.ts: strings support **bold**, `code` and [label](/internal-link).
 *
 * Vanilla mechanics follow the Minecraft Wiki for Java 1.21. Server-specific details were checked
 * against the community wikis (Donutpedia and donutsmp.wiki, autumn 2026); where they disagree or
 * only one weak source exists, the text says so or tells the reader to check in-game.
 */
import type { WikiArticle } from './wiki';

const UPDATED = '2026-11-03';

export const wikiMoreB: WikiArticle[] = [
  // ───────────────────────────────────────────── Farms & spawners
  {
    slug: 'cow-spawner-farm',
    category: 'Farms & spawners',
    title: 'Cow Spawner Farms: Raw Beef, Leather and Why Cow Spawners Sell',
    seoTitle: 'Cow Spawner Farm Guide for DonutSMP',
    metaDescription:
      'How cow spawners work on DonutSMP, why they trade so high, what to do with raw beef, and how a vanilla cow breeding farm gives leather in Java 1.21.',
    summary: 'Cow spawners make raw beef on DonutSMP. Why they are valued, what to do with the beef and how to farm leather.',
    intro:
      'Cow spawners look humble next to skeleton or iron golem spawners, yet they are some of the most expensive blocks on DonutSMP. They turn into a steady stream of food and sellable meat, and because the spawner supply is fixed, every one of them is scarce. This page covers how a cow spawner works on DonutSMP, why it is valued, and how a classic vanilla cow farm gets you leather as well.',
    sections: [
      {
        heading: 'Cow spawners on DonutSMP',
        paragraphs: [
          'Like every DonutSMP spawner, a cow spawner does not spawn cows. It generates drops and stores them inside the block, and you right-click it to take them out. Both community wikis list **raw beef** as the output. Neither lists leather, so do not count on it – open the storage of your own spawner to see exactly what it produces.',
          'Cow spawners stack like the others: sneak and right-click a placed cow spawner with another one in your hand. A stack produces more from a single block, which keeps the farm room tiny and easy to hide. See [how spawners work](/wiki/donutsmp-spawners-explained) for storage and moving tips.',
        ],
      },
      {
        heading: 'Why cow spawners are so valuable',
        paragraphs: [
          'Spawners left the Shard Shop in 2026, and according to the community wikis no new ones are created, so the number of cow spawners on the server can only stay the same or shrink. Demand, on the other hand, keeps growing as new players join and want a passive income source that never runs out.',
          'Price data from our own trading put a cow spawner at roughly **100M** in-game money in November 2026. Treat that as a snapshot: spawner prices move with updates and supply, so compare recent auction house sales before buying or selling.',
        ],
        list: [
          '**Food for everyone** – cooked beef (steak) restores 8 hunger and 12.8 saturation, one of the best common foods in the game.',
          '**Easy to sell** – raw or cooked beef can go into `/sell`, onto the auction house or into player orders.',
          '**Zero upkeep** – no breeding, no wheat and no mobs to escape or despawn.',
        ],
      },
      {
        heading: 'What to do with raw beef',
        paragraphs: [
          'Check `/worth` and the current orders before dumping beef into `/sell`; large player orders sometimes pay more. If you would rather eat it, cook it in a **smoker**, which works twice as fast as a furnace for food. Dried kelp blocks and lava buckets are efficient fuels for bulk cooking.',
          'In vanilla, butcher villagers also buy raw beef for emeralds, so beef can feed a [villager trading hall](/wiki/villager-trading-hall) as well as your hunger bar.',
        ],
      },
      {
        heading: 'A vanilla cow farm for leather (Java 1.21)',
        paragraphs: [
          'If you need leather, a normal cow farm is the way to get it. In Java 1.21 an adult cow drops **1–3 raw beef and 0–2 leather**, and Looting raises both. Killing a cow with a Fire Aspect weapon drops steak instead of raw beef. Cows breed with wheat, parents wait 5 minutes before breeding again, and a calf takes 20 minutes to grow up (feeding it wheat speeds that up).',
          'A simple, reliable design:',
        ],
        list: [
          'Fence a small pen and keep 10–20 cows in it. Since 1.21.5 cows come in temperate, warm and cold variants, but they all drop the same items.',
          'Breed the herd every 5 minutes with wheat, then kill adults with a Looting III sword while leaving a few breeders.',
          'Put hoppers under a one-block kill spot, or collect by hand.',
          'Do not pack the pen too tightly: more than 24 mobs in one block space take cramming damage, and DonutSMP also enforces server entity limits.',
        ],
      },
      {
        heading: 'What leather is used for',
        paragraphs: [
          'Leather is mostly a crafting ingredient. A book takes three paper and one leather, and bookshelves need three books each – so a full 15-bookshelf enchanting setup costs 45 leather. Leather also makes item frames, bundles (one string plus one leather in 1.21.2 and later) and dyeable leather armor.',
          'If you want the beef without the farm work, cow spawners are listed in our store at [cow spawner](/product/cow-spawner). Real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Do cow spawners drop leather on DonutSMP?', a: 'The community wikis list only raw beef for the cow spawner. Open your spawner storage to confirm, and use a vanilla cow farm if you need leather.' },
      { q: 'Why are cow spawners so expensive on DonutSMP?', a: 'No new spawners are being created, so supply is fixed while demand keeps rising. Cow spawners give steady food and sellable beef with no upkeep.' },
      { q: 'How much leather does a cow drop in Java 1.21?', a: 'An adult cow drops 0–2 leather and 1–3 raw beef. Looting increases both.' },
    ],
    related: ['donutsmp-spawners-explained', 'villager-trading-hall', 'donutsmp-enchanting-mending'],
    shopLinks: [
      { label: 'Cow spawner', to: '/product/cow-spawner' },
      { label: 'All spawners', to: '/shop/spawners' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'creeper-farm-gunpowder',
    category: 'Farms & spawners',
    title: 'Creeper Farms and Gunpowder for Rockets',
    seoTitle: 'Creeper Farm & Gunpowder Guide (DonutSMP)',
    metaDescription:
      'Get gunpowder for elytra rockets and TNT: creeper spawners on DonutSMP, how a vanilla creeper farm works in Java 1.21, and the best uses for gunpowder.',
    summary: 'Gunpowder keeps your elytra flying. Creeper spawners on DonutSMP, vanilla creeper farm design and gunpowder recipes.',
    intro:
      'Every elytra flight burns firework rockets, and every rocket needs gunpowder. On a server where players fly constantly to escape fights and scout for bases, gunpowder is never out of demand. This page explains how creeper spawners work on DonutSMP, how a vanilla creeper farm is built in Java 1.21 and what gunpowder is worth crafting into.',
    sections: [
      {
        heading: 'Creeper spawners on DonutSMP',
        paragraphs: [
          'A DonutSMP creeper spawner does not spawn creepers – nothing explodes. According to Donutpedia it generates **gunpowder** and stores it in the block until you right-click and take it out. Stack more creeper spawners into the same block by sneak-right-clicking with one in hand to raise output.',
          'Keep the room hidden and empty the storage regularly so production is not lost. A stack of creeper spawners next to a crafting table and a stock of paper is effectively an unlimited rocket supply.',
        ],
      },
      {
        heading: 'What gunpowder is used for',
        paragraphs: ['Gunpowder feeds several recipes that sell well or keep you alive:'],
        list: [
          '**Firework rockets** – 1 paper plus 1–3 gunpowder makes 3 rockets. More gunpowder means a longer flight duration (1, 2 or 3). Never add firework stars to rockets meant for flying.',
          '**TNT** – 5 gunpowder and 4 sand or red sand. Useful for clearing netherrack around [ancient debris](/wiki/netherite-ancient-debris).',
          '**Splash potions** – adding gunpowder to any potion turns it into a splash potion for PvP. See the [brewing guide](/wiki/potions-brewing-guide).',
          '**Fire charges** – gunpowder, blaze powder and coal or charcoal make 3 fire charges.',
        ],
      },
      {
        heading: 'How a vanilla creeper farm works (Java 1.21)',
        paragraphs: [
          'Creepers spawn on solid blocks at **light level 0** in most Overworld biomes, in groups of four. A Java creeper is 1.7 blocks tall, drops 0–2 gunpowder (more with Looting) and gives 5 XP when killed by a player. Hostile mobs only spawn more than 24 blocks from the player and despawn quickly beyond 128 blocks, so farms are built around an AFK spot.',
          'A classic design:',
        ],
        list: [
          'Build dark spawning platforms high in the air over an ocean, so no caves compete for the mob cap.',
          'Line the floors with trapdoors or water channels that move mobs to a central drop shaft.',
          'Let mobs fall far enough to die, or to land on low health for a one-hit kill if you want XP.',
          'Stand at an AFK spot 24–32 blocks away from the platforms and collect drops in hoppers and chests.',
        ],
      },
      {
        heading: 'Tips and troubleshooting',
        paragraphs: [
          'If the farm is slow, light up or fill in caves within 128 blocks of your AFK spot, because every dark cave space competes for the same mob cap. Creepers flee from cats and ocelots within 6 blocks, which some designs use to push them off platforms. A creeper killed by a skeleton\'s arrow drops a music disc, a fun bonus but not a reliable income.',
          'On DonutSMP, community notes say hopper speeds are not vanilla, and the server enforces entity limits, so test a small version of any redstone farm before building big. If you only want gunpowder for rockets, a creeper spawner is much simpler – there is one in our store at [creeper spawner](/product/creeper-spawner). Real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'What does a creeper spawner give on DonutSMP?', a: 'Gunpowder, stored inside the spawner. No creepers spawn, so nothing explodes.' },
      { q: 'How many rockets does one gunpowder make?', a: 'One paper and one gunpowder craft 3 rockets with flight duration 1. Using 2 or 3 gunpowder gives longer flights.' },
      { q: 'At what light level do creepers spawn in Java 1.21?', a: 'Creepers spawn only at light level 0 on solid blocks in most Overworld biomes.' },
    ],
    related: ['donutsmp-elytra', 'donutsmp-spawners-explained', 'potions-brewing-guide'],
    shopLinks: [
      { label: 'Creeper spawner', to: '/product/creeper-spawner' },
      { label: 'Elytra', to: '/product/elytra' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'blaze-farm-blaze-rods',
    category: 'Farms & spawners',
    title: 'Blaze Farms: Blaze Rods, Powder and XP',
    seoTitle: 'Blaze Farm Guide: Rods, Powder & XP',
    metaDescription:
      'How blaze spawners work on DonutSMP, why blaze powder matters for brewing, and how to build a vanilla blaze farm for rods and XP in a Nether fortress.',
    summary: 'Blaze spawners on DonutSMP, what blaze powder is for, and how a vanilla fortress blaze farm gives rods and XP.',
    intro:
      'Blaze rods and blaze powder run your brewing stand, make eyes of ender and go into Strength potions, which makes them essential for PvP players. Blazes also give more experience than most mobs. This page explains blaze spawners on DonutSMP and how to build a vanilla blaze farm in Java 1.21.',
    sections: [
      {
        heading: 'Blaze spawners on DonutSMP',
        paragraphs: [
          'DonutSMP blaze spawners produce drops instead of mobs and store them inside the block, like every other spawner type on the server. The community wikis disagree on the exact drop: Donutpedia says the blaze spawner produces **blaze powder** only, while donutsmp.wiki lists **blaze rods**. Open the storage of the spawner you are buying – or ask the seller for a screenshot of its contents – before you pay.',
          'Either way, powder is what you actually burn in brewing. One blaze rod crafts into two blaze powder, so rods are the more flexible item, but a powder-only spawner still covers fuel and Strength potions.',
        ],
      },
      {
        heading: 'What blaze items are used for',
        paragraphs: ['Blaze rods and powder are needed for:'],
        list: [
          '**Brewing stands** – 1 blaze rod plus 3 cobblestone, blackstone or cobbled deepslate.',
          '**Brewing fuel** – each blaze powder powers 20 brewing operations.',
          '**Strength potions** – blaze powder added to an awkward potion.',
          '**Eyes of ender** – blaze powder plus an ender pearl, used for ender chests and finding strongholds.',
          '**Fire charges** – with gunpowder and coal.',
        ],
      },
      {
        heading: 'How blazes behave (Java 1.21)',
        paragraphs: [
          'Blazes have 20 health, are immune to fire, lava and fall damage, and take damage from water, rain and snowballs. They spawn in Nether fortresses at light level 11 or lower, both naturally and from the fortress blaze spawners. That means torches do not reliably stop them – to shut a spawner down while you build, every spot around it must be brighter than 11.',
          'Most importantly, a blaze only drops a rod when it is **killed by a player or a tamed wolf**. The base drop is 0–1 rods, Looting III raises it to 0–4, and each kill gives 10 XP. A blaze farm therefore always has you at the kill spot.',
        ],
      },
      {
        heading: 'Building a vanilla blaze farm',
        paragraphs: ['A common approach around a fortress spawner:'],
        list: [
          'Drink a fire resistance potion and enclose the spawner in solid blocks, leaving the spawn area around it open.',
          'Guide blazes into a narrow channel that leads to a 1×1 kill chamber. Because they float and take no fall damage, designs use water flows and short drops to push them along.',
          'Leave a gap at foot height where you can hit the blazes without them shooting you.',
          'Use a sword with Looting III and Sweeping Edge, and put hoppers under the chamber to catch rods.',
          'Stay within 16 blocks of the spawner – it only runs while a player is that close.',
        ],
      },
      {
        heading: 'Safety in the Nether',
        paragraphs: [
          'Fortresses are dangerous on DonutSMP because other players visit them too. Carry fire resistance, a shield against fireballs and only the gear you need. If you would rather skip fortress building, blaze spawners are traded between players, and you can find one in our store at [blaze spawner](/product/blaze-spawner) – real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Do DonutSMP blaze spawners give rods or powder?', a: 'The community wikis disagree. Check the spawner\'s storage before buying; either item works for brewing fuel and Strength potions.' },
      { q: 'Why does my blaze farm drop no rods?', a: 'Blaze rods only drop when a player or tamed wolf kills the blaze. Fully automatic kills give no rods.' },
      { q: 'How much XP does a blaze give?', a: 'Each blaze killed by a player or tamed wolf drops 10 XP, which makes blaze farms good for Mending repairs.' },
    ],
    related: ['potions-brewing-guide', 'donutsmp-spawners-explained', 'zombie-xp-farm-mending'],
    shopLinks: [
      { label: 'Blaze spawner', to: '/product/blaze-spawner' },
      { label: 'DonutSMP spawners', to: '/donutsmp-spawners' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'zombie-xp-farm-mending',
    category: 'Farms & spawners',
    title: 'Zombie and XP Farms for Mending Repairs',
    seoTitle: 'Zombie & XP Farms for Mending (Java 1.21)',
    metaDescription:
      'Zombie spawners on DonutSMP, how a vanilla zombie dungeon XP farm works in Java 1.21, how Mending turns XP into repairs and the smart way to store XP.',
    summary: 'Zombie spawners, dungeon XP farms and how to turn experience into Mending repairs without wasting it.',
    intro:
      'Netherite gear is expensive to replace, so experience is what keeps it alive. With Mending on your armor and tools, every orb you collect becomes free durability. This page covers zombie spawners on DonutSMP, the classic vanilla zombie XP farm and how to store and spend XP efficiently.',
    sections: [
      {
        heading: 'Zombie spawners on DonutSMP',
        paragraphs: [
          'A DonutSMP zombie spawner generates zombie drops into its storage instead of spawning zombies. That mostly means **rotten flesh**, and donutsmp.wiki notes that zombie spawners have no widely used production role compared with skeleton or iron golem spawners. Rotten flesh still has a use: novice cleric villagers buy 32 of it for one emerald.',
          'Some players report that the spawner menu also lets you collect stored experience. That is not confirmed by the community wikis, so check the menu of your own spawner before buying one for XP.',
        ],
      },
      {
        heading: 'How a vanilla zombie XP farm works (Java 1.21)',
        paragraphs: [
          'Zombie spawners are found in dungeons. A spawner only runs while a player is within 16 blocks, and in Java 1.21 it only spawns zombies in darkness. Each zombie killed by a player gives 5 XP and drops rotten flesh, with a small chance of iron, a carrot or a potato. A standard build:',
        ],
        list: [
          'Dig out the room around the spawner and keep it unlit.',
          'Add water streams that push zombies to one corner and into a drop shaft about 22 blocks tall.',
          'At the bottom, the zombies land with very little health; finish each with one hit so it counts as a player kill.',
          'Keep zombies out of standing water: a zombie that stays submerged too long turns into a drowned.',
          'Block small gaps – baby zombies are short and fast and slip through openings adults cannot.',
        ],
      },
      {
        heading: 'Other good XP sources',
        paragraphs: [
          'The fastest XP farms in vanilla are enderman farms in the outer End, where endermen spawn in huge numbers and give 5 XP each. Blaze farms give 10 XP per kill – see the [blaze farm guide](/wiki/blaze-farm-blaze-rods) – and gold farms in the Nether combine XP with gold, covered in the [gold farm guide](/wiki/gold-xp-farm-piglins). On DonutSMP the End and Nether are shared and busy, so expect competition and keep an eye on other players.',
        ],
      },
      {
        heading: 'How Mending uses experience',
        paragraphs: [
          'When you pick up an orb, Mending repairs a random damaged Mending item you are wearing or holding, at **2 durability per XP point**. Only leftover experience goes into your level bar. To repair one specific item quickly, hold only that item and take off the rest of your Mending gear while you collect.',
          'Bottles o\' enchanting are the portable version. They cannot be crafted; each one breaks into 3–11 XP, and master cleric villagers sell them for 3 emeralds. Bottles are popular in PvP for repairing armor mid-fight.',
        ],
      },
      {
        heading: 'Storing XP the smart way',
        paragraphs: [
          'Levels get more expensive the higher you go: reaching level 30 from zero takes 1,395 XP, but each level above 30 costs far more. When you die you only drop 7 XP per level, capped at 100 points, so a big level bar is mostly lost on death. The efficient habit is to farm to level 30, enchant or use the anvil, and put the rest straight into Mending repairs.',
          'If you would rather stock up on spawners than build a dungeon farm, the [zombie spawner](/product/zombie-spawner) is in our store. Real-money trading breaks DonutSMP rules and is at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'How much durability does Mending repair per XP?', a: 'Two durability points per experience point, applied to a random damaged Mending item you are wearing or holding.' },
      { q: 'Can you craft bottles o\' enchanting?', a: 'No. They come from loot and from master cleric villagers, who sell them for 3 emeralds.' },
      { q: 'Why do my zombies turn into drowned?', a: 'Zombies that stay underwater too long convert into drowned. Use flowing water at foot level instead of deep water in your farm.' },
    ],
    related: ['donutsmp-enchanting-mending', 'blaze-farm-blaze-rods', 'skeleton-spawner-farm'],
    shopLinks: [
      { label: 'Zombie spawner', to: '/product/zombie-spawner' },
      { label: 'All spawners', to: '/shop/spawners' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'gold-xp-farm-piglins',
    category: 'Farms & spawners',
    title: 'Gold and XP Farms in the Nether: Piglins and Bartering',
    seoTitle: 'Gold & XP Farm Guide: Piglins and Bartering',
    metaDescription:
      'Zombified piglin spawners on DonutSMP, how a vanilla Nether gold and XP farm works in Java 1.21, portal farms and how piglin bartering turns gold into pearls.',
    summary: 'Gold for netherite and bartering: piglin spawners on DonutSMP, vanilla gold farms and what piglins trade.',
    intro:
      'Gold is needed for netherite ingots, golden apples and piglin bartering, and gold farms are also among the best XP farms in the game. This page covers zombified piglin spawners on DonutSMP, how vanilla gold farms work in Java 1.21 and how bartering turns gold into ender pearls and other useful items.',
    sections: [
      {
        heading: 'Zombified piglin spawners on DonutSMP',
        paragraphs: [
          'Both community wikis list **gold nuggets** as the output of a DonutSMP zombified piglin spawner. As with other spawners, nothing spawns – nuggets collect in the block until you right-click it. Nine nuggets craft into a gold ingot, and each [netherite ingot](/wiki/netherite-ancient-debris) needs four gold ingots, so a stacked piglin spawner pairs well with debris mining.',
        ],
      },
      {
        heading: 'How zombified piglins behave (Java 1.21)',
        paragraphs: [
          'Zombified piglins are neutral until attacked. Hit one and every zombified piglin in a large area around you turns hostile and comes for you, and angry ones keep alerting their neighbours. Gold farms use exactly this: they make the mobs angry, let them walk towards the player and drop them into a kill area.',
        ],
        list: [
          'Drops: 0–1 rotten flesh and 0–1 gold nugget each (more with Looting), plus a 2.5% chance of a gold ingot on a player kill.',
          'XP: 5 per adult, only when the kill counts as a player or tamed-wolf kill.',
          'They spawn most often in **Nether wastes** at light level 11 or lower and can spawn on magma blocks.',
          'They become neutral again when you die, so a death resets the farm.',
        ],
      },
      {
        heading: 'Vanilla gold farm designs',
        paragraphs: [
          'Large gold farms are usually built above a Nether wastes biome with many dark spawning platforms, often on the Nether roof where nothing else competes for spawns. The player stands in a safe AFK spot, angers the piglins and lets them walk into a drop or a damage block. DonutSMP has allowed bedrock breaking in the Overworld, but community notes do not confirm Nether roof access, so check the rules before building up there.',
          'A smaller option is a **portal farm** in the Overworld. Nether portal blocks occasionally spawn zombified piglins – more often on harder difficulty – so stacked portal frames over a kill chamber produce a slow but steady trickle of gold.',
        ],
      },
      {
        heading: 'Piglin bartering',
        paragraphs: [
          'Normal piglins in the Nether trade random items for gold ingots. Throw an ingot to a piglin, it inspects it for a few seconds and drops something back. Wear at least one piece of golden armor or they attack you. Useful barter results include:',
        ],
        list: [
          'Ender pearls – the main reason players barter.',
          'Fire resistance potions, obsidian and crying obsidian (for respawn anchors).',
          'String, quartz, soul sand, leather and, rarely, Soul Speed books or boots.',
          'Piglins brought to the Overworld turn into zombified piglins after about 15 seconds, so barter in the Nether.',
        ],
      },
      {
        heading: 'Server limits and practical tips',
        paragraphs: [
          'DonutSMP enforces entity limits and, according to community notes, runs non-vanilla hopper speeds, so big redstone farms may behave differently than in singleplayer. Build a small test section first. The Nether is also shared and heavily used, so a farm near a common portal will not stay secret.',
          'Spawners avoid all of this. Zombified piglin spawners are sold on the auction house and in our [DonutSMP spawners](/donutsmp-spawners) shop; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'What does a zombified piglin spawner give on DonutSMP?', a: 'Gold nuggets, stored inside the spawner. Nine nuggets make one gold ingot.' },
      { q: 'Why do gold farms give XP?', a: 'Zombified piglins only drop XP when the kill counts as a player kill. Farms that anger the mobs at the player are designed to keep that credit.' },
      { q: 'Do piglins attack if I wear gold?', a: 'Not if you wear at least one piece of golden armor, unless you attack them or open chests near them.' },
    ],
    related: ['netherite-ancient-debris', 'zombie-xp-farm-mending', 'donutsmp-spawners-explained'],
    shopLinks: [
      { label: 'DonutSMP spawners', to: '/donutsmp-spawners' },
      { label: 'Netherite ingot', to: '/product/netherite-ingot' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'villager-trading-hall',
    category: 'Farms & spawners',
    title: 'Villager Trading Hall: Best Trades, Mending Books and Emeralds',
    seoTitle: 'Villager Trading Hall & Best Trades (1.21)',
    metaDescription:
      'Build a villager trading hall in Java 1.21: getting villagers, cell design, the best trades for Mending books and emeralds, discounts, and raid farm notes.',
    summary: 'How to build a trading hall, which villager trades are worth it and how to get cheap Mending books.',
    intro:
      'A trading hall is a row of villagers locked in cells with their job blocks, so you can trade with all of them in one place. It is the most reliable way to get Mending and other top enchanted books, cheap diamond gear and a steady source of emeralds. Everything below follows vanilla Java 1.21 rules, which DonutSMP uses for villagers as far as the community wikis report.',
    sections: [
      {
        heading: 'Getting villagers',
        paragraphs: ['You need a handful of villagers to start. The main options:'],
        list: [
          '**Breeding** – villagers breed when they have enough food (bread, carrots, potatoes or beetroot) and there are free beds nearby.',
          '**Curing zombie villagers** – throw a splash potion of Weakness and feed a golden apple. Cured villagers give big permanent discounts.',
          '**Moving them** – boats and minecarts carry villagers. Community notes say that since June 2026, entities can follow you through portals on DonutSMP when you travel in a supported vehicle such as a boat, which helps move them long distances.',
        ],
      },
      {
        heading: 'Designing the hall',
        paragraphs: [
          'Each villager sits in a one-block cell with its workstation directly in front so it can reach it to restock. Villagers restock up to twice a day while they can work at their job site. Keep the hall well lit and closed off so zombies cannot get in, and use a solid roof: lightning striking a villager turns it into a witch.',
          'Before you trade, set the profession you want by placing the right workstation – a lectern for a librarian. If the offers are bad, break and replace the workstation; this only works until you trade once, after which the trades are locked. The [enchanting and Mending guide](/wiki/donutsmp-enchanting-mending) explains rerolling for Mending in detail.',
        ],
      },
      {
        heading: 'The best trades',
        paragraphs: ['These are the trades most players build a hall for (default Java 1.21 trades):'],
        list: [
          '**Librarian: Mending book** – between 10 and 38 emeralds plus a book. Other strong books include Unbreaking III, Protection IV, Efficiency V and Sharpness V.',
          '**Librarian: paper** – 24 paper for 1 emerald at novice level, an easy emerald source with a [sugar cane farm](/wiki/sugar-cane-crop-farms).',
          '**Farmer** – buys 20 wheat, 26 potatoes, 22 carrots or 15 beetroot per emerald.',
          '**Fletcher** – 32 sticks for 1 emerald.',
          '**Cleric** – buys 32 rotten flesh per emerald and, at master level, sells bottles o\' enchanting for 3 emeralds.',
          '**Armorer, toolsmith, weaponsmith** – enchanted diamond gear at higher levels, a cheap base for netherite upgrades.',
        ],
      },
      {
        heading: 'Discounts and raids',
        paragraphs: [
          'Curing a zombie villager gives you a permanent discount with that villager, often bringing expensive trades down to a single emerald. Completing a raid grants **Hero of the Village**, which cuts prices by 30% at level I and up to 55% at level V while it lasts.',
          'Raid farms repeat this on purpose and also produce totems of undying from evokers, but they are large builds and need a village-free area. Java 1.21 also includes an optional villager trade rebalance experiment that changes which librarians offer which books; it is off by default, so test what your server\'s librarians actually offer.',
        ],
      },
      {
        heading: 'Trading halls on DonutSMP',
        paragraphs: [
          'A trading hall is a big, visible project, and villagers are slow to replace if a raider kills them. Build it underground or far from `/rtp` areas, and treat it as part of your base security. If you want Mending gear right away, enchanted tools and weapons are also in our [tools and weapons](/shop/tools-weapons) shop; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'How much does a Mending book cost from a librarian?', a: 'In default Java 1.21 trading, between 10 and 38 emeralds plus one book, before discounts.' },
      { q: 'How do I lock in a good librarian trade?', a: 'Trade with the villager once. Before that you can reroll by breaking and replacing the lectern.' },
      { q: 'What is the easiest emerald trade?', a: 'Selling paper to librarians or crops to farmers, both fed by simple automatic farms.' },
    ],
    related: ['donutsmp-enchanting-mending', 'sugar-cane-crop-farms', 'totems-pvp-gear'],
    shopLinks: [
      { label: 'Tools & weapons', to: '/shop/tools-weapons' },
      { label: 'Totem of undying', to: '/product/totem-of-undying' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'sugar-cane-crop-farms',
    category: 'Farms & spawners',
    title: 'Sugar Cane and Crop Farms for Money',
    seoTitle: 'Sugar Cane & Crop Farms for Money (DonutSMP)',
    metaDescription:
      'Build sugar cane, kelp, bamboo, pumpkin, melon and cactus farms in Java 1.21 and turn crops into DonutSMP money with /sell, orders and villager trades.',
    summary: 'Automatic crop farms that need no spawner: sugar cane, kelp, pumpkins, melons and more, and how to sell the output.',
    intro:
      'Spawners are expensive, but crops are free. An automatic sugar cane or pumpkin farm costs only some redstone and building time, runs while you are nearby and produces items that sell through `/sell`, player orders or villager trades. This page covers the most useful crop farms in Java 1.21 and how to make money from them on DonutSMP.',
    sections: [
      {
        heading: 'Why crop farms make sense',
        paragraphs: [
          'Crop farms are the cheapest way to build passive income. They need no rare items, they are easy to rebuild if a base hunter finds them, and their output is always sellable. Prices change with updates and supply, so check `/worth <item>` for the server base price and compare it with `/orders` before you choose what to farm.',
          'Remember that crops only grow in **loaded chunks**. On a server that means close to a player, so a farm only produces while you are in range.',
        ],
      },
      {
        heading: 'Sugar cane farms',
        paragraphs: [
          'Sugar cane grows on sand, dirt or grass directly next to water and reaches three blocks tall. In Java, bone meal does not work on it, so speed comes from size. The classic automatic design:',
        ],
        list: [
          'Plant a row of cane next to a water channel.',
          'Put an observer facing the block where the second cane segment grows, wired to a piston at that height.',
          'When the cane grows, the observer fires the piston and breaks the upper part while the bottom block stays planted.',
          'Collect drops with water streams into hoppers, or with a hopper minecart running under the farm.',
        ],
      },
      {
        heading: 'What to do with sugar cane',
        paragraphs: [
          'Sugar cane crafts into paper (3 cane to 3 paper) and sugar. Paper sells to librarians at 24 per emerald and goes into firework rockets, which pairs nicely with a [creeper farm](/wiki/creeper-farm-gunpowder). Sugar is used for Swiftness potions and cakes.',
        ],
      },
      {
        heading: 'Other profitable crop farms',
        paragraphs: ['Each of these can be fully automated in Java 1.21:'],
        list: [
          '**Kelp** – grows underwater and is harvested with observers and pistons. Smelt it into dried kelp; nine make a dried kelp block, a fuel that smelts 20 items.',
          '**Bamboo** – grows fast, accepts bone meal and burns as fuel or crafts into scaffolding.',
          '**Pumpkins and melons** – stems grow fruit onto an adjacent dirt block; an observer spots the fruit and a piston breaks it.',
          '**Cactus** – breaks itself when it grows next to a solid block, so it needs no redstone at all.',
          '**Wheat, carrots and potatoes** – farmer villagers harvest and replant on their own, and a hopper minecart under the field collects what they drop.',
        ],
      },
      {
        heading: 'Selling crops on DonutSMP',
        paragraphs: [
          'Bulk crops usually sell close to base price, so volume matters more than any single sale. Use `/sell` for instant money, fill player orders when they pay more and keep some output for villager emeralds. Community notes say DonutSMP hoppers do not run at vanilla speed, so test collection with a small module before scaling up.',
          'Crop farms are a solid start, but money builds faster with more income sources. Some players also buy in-game money from third-party stores such as [DonutSMP money](/donutsmp-money); real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Does bone meal work on sugar cane in Java?', a: 'No. In Java Edition bone meal has no effect on sugar cane, so farms rely on size and observers instead.' },
      { q: 'Do crop farms grow when I am offline?', a: 'No. Crops only grow in loaded chunks, which on a server means near an online player.' },
      { q: 'What is the easiest automatic crop farm?', a: 'Cactus, because it breaks itself against a block and needs no redstone. Sugar cane with observers is the most popular next step.' },
    ],
    related: ['villager-trading-hall', 'creeper-farm-gunpowder', 'donutsmp-money-economy'],
    shopLinks: [
      { label: 'DonutSMP money', to: '/donutsmp-money' },
      { label: 'Starter bundles', to: '/shop/bundles' },
    ],
    updatedAt: UPDATED,
  },
  // @@PART2@@
];
