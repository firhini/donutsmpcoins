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
          'Like every DonutSMP spawner, a cow spawner does not spawn cows. It generates drops and stores them inside the block, and you right-click it to take them out. Donutpedia and the Fandom wiki agree that the output is **raw beef only – no leather**. Open the storage of your own spawner to see exactly what it holds.',
          'Cow spawners stack like the others: sneak and right-click a placed cow spawner with another one in your hand. A stack produces more from a single block, which keeps the farm room tiny and easy to hide. See [how spawners work](/wiki/donutsmp-spawners-explained) for storage and moving tips.',
        ],
      },
      {
        heading: 'Why cow spawners are so valuable',
        paragraphs: [
          'Spawners left the Shard Shop in 2026, and according to the community wikis no new ones are created, so the number of cow spawners on the server can only stay the same or shrink. Demand, on the other hand, keeps growing as new players join and want a passive income source that never runs out.',
          'In our own trading we have seen cow spawners change hands for roughly **100M** in-game money (November 2026). That is what we see, not an official figure – prices vary a lot and public fan trackers report different numbers, so compare recent player trades before buying or selling.',
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
          'Do not pack the pen too tightly: more than 24 mobs in one block space take cramming damage, and community wikis report farm and entity limits on DonutSMP, so keep herds modest.',
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
          'Creepers spawn on solid blocks at **light level 0** in most Overworld biomes, in groups of four. A Java creeper is 1.7 blocks tall, drops 0–2 gunpowder (more with Looting) and gives 5 XP when killed by a player. Hostile mobs only spawn more than 24 blocks from the player and despawn instantly beyond 128 blocks, so farms are built around an AFK spot.',
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
          'Community wikis report block and farm limits on DonutSMP – including on hoppers and creeper farms since the June 2026 update – but the exact numbers are unconfirmed, so test a small version of any farm before building big. If you only want gunpowder for rockets, a creeper spawner is much simpler – there is one in our store at [creeper spawner](/product/creeper-spawner). Real-money trading is against DonutSMP rules and at your own risk.',
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
          'DonutSMP blaze spawners produce drops instead of mobs and store them inside the block, like every other spawner type on the server – no blazes appear, so nothing burns. Donutpedia and the Fandom wiki agree that the output is **blaze powder, not blaze rods**. (One wiki lists rods but flags its own list as unverified.)',
          'Powder is what you actually burn in brewing and what Strength potions and eyes of ender need, so a blaze spawner covers all of that. Powder cannot be turned back into rods, though: the rod for a brewing stand still has to come from a real blaze in a Nether fortress.',
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
          'This is vanilla behaviour. The community wikis do not document whether naturally generated fortress spawners on DonutSMP still spawn blazes, so check before you build; spawners you buy or trade never spawn mobs.',
        ],
      },
      {
        heading: 'Safety in the Nether',
        paragraphs: [
          'The Nether is hosted only on the NA East region, so every player who wants blazes ends up in the same dimension, and fortresses are dangerous because other players visit them too. Carry fire resistance, a shield against fireballs and only the gear you need. If you would rather skip fortress building, blaze spawners are traded between players, and you can find one in our store at [blaze spawner](/product/blaze-spawner) – real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Do DonutSMP blaze spawners give rods or powder?', a: 'Blaze powder, not rods, according to Donutpedia and the Fandom wiki. Powder covers brewing fuel and Strength potions; rods for brewing stands still come from fortress blazes.' },
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
          'Like every DonutSMP spawner, a zombie spawner would generate drops into its storage instead of spawning zombies. The zombie spawner is not in the drop tables the community wikis agree on, so expect zombie loot – mostly **rotten flesh** – and open the storage to confirm before you rely on it. Rotten flesh still has a use: novice cleric villagers buy 32 of it for one emerald.',
          'Some players report that the spawner menu also lets you collect stored experience. That is not confirmed by the community wikis, so check the menu of your own spawner before buying one for XP.',
        ],
      },
      {
        heading: 'How a vanilla zombie XP farm works (Java 1.21)',
        paragraphs: [
          'In vanilla, zombie spawners are found in dungeons. Whether naturally generated dungeon spawners on DonutSMP still spawn mobs is not documented, so check before you build – spawners bought or traded on the server never do. A vanilla spawner only runs while a player is within 16 blocks, and in Java 1.21 it only spawns zombies in darkness. Each zombie killed by a player gives 5 XP and drops rotten flesh, with a small chance of iron, a carrot or a potato. A standard build:',
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
          'The fastest XP farms in vanilla are enderman farms in the outer End, where endermen spawn in huge numbers and give 5 XP each. Blaze farms give 10 XP per kill – see the [blaze farm guide](/wiki/blaze-farm-blaze-rods) – and gold farms in the Nether combine XP with gold, covered in the [gold farm guide](/wiki/gold-xp-farm-piglins). On DonutSMP the End and Nether are hosted only on the NA East region and shared by everyone, so expect competition and keep an eye on other players.',
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
      'Zombified piglin spawners on DonutSMP, how a vanilla Nether gold and XP farm works in Java 1.21, portal farms and piglin bartering for pearls.',
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
          'Large gold farms are usually built above a Nether wastes biome with many dark spawning platforms, often on the Nether roof where nothing else competes for spawns. The player stands in a safe AFK spot, angers the piglins and lets them walk into a drop or a damage block. Whether the Nether roof is reachable on DonutSMP is not documented, and the Nether runs only on the NA East region, so check in-game before planning a roof farm.',
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
          'Community wikis report block and farm limits on DonutSMP (for example on hoppers), though the exact numbers are unconfirmed, so big farms may behave differently than in singleplayer. Build a small test section first. The Nether is also shared and heavily used, so a farm near a common portal will not stay secret.',
          'Spawners avoid all of this. No new spawners enter the game, so zombified piglin spawners only change hands between players – and they are in our [DonutSMP spawners](/donutsmp-spawners) shop; real-money trading is against DonutSMP rules and at your own risk.',
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
          '**Moving them** – boats and minecarts carry villagers, and a villager in a boat or minecart can be pushed or ridden to your hall. Over long distances it is usually easier to breed or cure villagers on site.',
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
          'Bulk crops usually sell close to base price, so volume matters more than any single sale. Use `/sell` for instant money (sell multipliers were removed in June 2026, so everyone gets the same base price), fill player orders when they pay more and keep some output for villager emeralds. Community wikis report hopper and farm limits on DonutSMP, so test collection with a small module before scaling up.',
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
  // ───────────────────────────────────────────── Items & gear
  {
    slug: 'best-armor-enchantments',
    category: 'Items & gear',
    title: 'Best Armor Enchantments in 1.21: Protection, Blast Protection and More',
    seoTitle: 'Best Armor Enchantments in Minecraft 1.21',
    metaDescription:
      'The best armor enchantments for Java 1.21: Protection vs Blast Protection for crystal PvP, Thorns, Swift Sneak, Feather Falling and full sets.',
    summary: 'Which armor enchantments to use in 1.21, how Protection and Blast Protection really stack, and full sets for PvP.',
    intro:
      'Armor enchantments decide how many crystals you survive and how often you need to repair. The choice between Protection and Blast Protection matters more on DonutSMP than on most servers, because crystal PvP is the main way people fight. This guide explains how the protection enchantments work in Java 1.21 and gives a recommended set for each slot.',
    sections: [
      {
        heading: 'How the protection enchantments stack',
        paragraphs: [
          'Only one protection type can go on each piece: Protection, Blast Protection, Fire Protection and Projectile Protection are mutually exclusive. Each gives "protection points", every point removes 4% of the matching damage, and the total is capped at **20 points (80%)** after armor and toughness have done their part.',
        ],
        list: [
          '**Protection** – 1 point per level against almost all damage. Protection IV on all four pieces gives 16 points, a 64% cut to everything.',
          '**Blast Protection** – 2 points per level, but only against explosions. It also reduces explosion knockback.',
          '**Fire Protection** and **Projectile Protection** – 2 points per level against fire or projectiles.',
          '**Feather Falling** (boots only) – 3 points per level against fall damage, stacking with Protection.',
        ],
      },
      {
        heading: 'Protection vs Blast Protection for crystal PvP',
        paragraphs: [
          'Because explosions count for both, mixing is the usual answer. Three pieces of Protection IV plus one piece of Blast Protection IV reaches 12 + 8 = **20 points against explosions** – the full 80% cap – while still giving 48% against swords, arrows and everything else. Four Protection IV pieces give a balanced 64% against all damage.',
          'Most players put Blast Protection on the leggings or helmet and keep Protection on the chestplate, since that slot is often swapped for an elytra. Full Blast Protection only makes sense for pure crystal fights, because it leaves you weak to swords and maces.',
        ],
      },
      {
        heading: 'The best enchantments for each piece',
        paragraphs: ['Every piece should have **Unbreaking III** and **Mending**. On top of that:'],
        list: [
          '**Helmet** – Protection IV (or Blast Protection IV), Respiration III, Aqua Affinity.',
          '**Chestplate** – Protection IV. Thorns III is optional.',
          '**Leggings** – Protection IV or Blast Protection IV, plus **Swift Sneak III**, which raises sneaking speed from 30% to 75% of walking speed. It only comes from ancient city chests.',
          '**Boots** – Protection IV, Feather Falling IV, Depth Strider III (or Frost Walker II), and Soul Speed III if you have it.',
        ],
      },
      {
        heading: 'Is Thorns worth it?',
        paragraphs: [
          'Thorns gives each piece a 15% chance per level to hurt an attacker for 1–5 damage. The catch is durability: every time it triggers, that piece loses 2 extra durability. In long fights that adds up quickly, so many PvP players leave it off, or only use it on a chestplate with Mending and plenty of experience bottles.',
          'Avoid Curse of Binding on PvP armor – it stops you swapping a chestplate for an elytra – and Curse of Vanishing on anything you might want to recover.',
        ],
      },
      {
        heading: 'Netherite and putting it together',
        paragraphs: [
          'Netherite armor has more toughness than diamond and each piece adds 10% knockback resistance, which keeps you on your feet in crystal fights. Enchant diamond gear first and upgrade it afterwards – see [netherite and ancient debris](/wiki/netherite-ancient-debris) – and combine books in a smart order to avoid "Too Expensive", as covered in the [enchanting guide](/wiki/donutsmp-enchanting-mending).',
          'Maxed sets take a lot of books and levels. Ready-made sets are also in our [armor shop](/shop/armor); buying with real money is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Is Protection or Blast Protection better?', a: 'Protection protects against everything; Blast Protection only against explosions but twice as strongly. For crystal PvP, three Protection IV pieces plus one Blast Protection IV piece hit the 80% cap against explosions.' },
      { q: 'Where do you get Swift Sneak?', a: 'Only from chests in ancient cities in the deep dark. It goes on leggings.' },
      { q: 'Does Thorns damage your armor?', a: 'Yes. Each time Thorns triggers, the piece loses 2 extra durability, reduced by Unbreaking.' },
    ],
    related: ['totems-pvp-gear', 'donutsmp-enchanting-mending', 'sword-axe-mace-enchantments'],
    shopLinks: [
      { label: 'Armor', to: '/shop/armor' },
      { label: 'Netherite armor set', to: '/product/netherite-armor-set' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'sword-axe-mace-enchantments',
    category: 'PvP & combat',
    title: 'Best Sword, Axe and Mace Enchantments plus a Mace Guide',
    seoTitle: 'Best Sword, Axe & Mace Enchantments (1.21)',
    metaDescription:
      'Best melee enchantments for Java 1.21: sword and axe setups, how to get a mace, smash attack damage, and Density vs Breach vs Wind Burst explained.',
    summary: 'The best melee enchants in 1.21 and a full mace guide: smash damage, Density, Breach and Wind Burst.',
    intro:
      'Crystals do most of the damage on DonutSMP, but melee weapons finish fights, break shields and punish players who get too close. Since 1.21 there is also the mace, which can deal huge damage from a fall. This page covers the best enchantments for swords and axes and explains how the mace works in Java 1.21.',
    sections: [
      {
        heading: 'Sword enchantments',
        paragraphs: [
          'A netherite sword deals 8 damage with an attack speed of 1.6. The standard PvP setup:',
        ],
        list: [
          '**Sharpness V** – +3 damage on every hit. Smite and Bane of Arthropods are exclusive with it and only help against certain mobs.',
          '**Sweeping Edge III** – stronger sweep attacks, good for mob farms.',
          '**Fire Aspect II** – sets targets on fire; skip it if you also farm and want raw drops.',
          '**Looting III** – more mob drops, essential for farms.',
          '**Knockback** – situational. It can push enemies out of your combo range.',
          '**Unbreaking III** and **Mending** on every weapon.',
        ],
      },
      {
        heading: 'Axe enchantments',
        paragraphs: [
          'A netherite axe deals 10 damage but attacks slower (1.0). Its key strength is that hitting a blocking player **disables their shield for 5 seconds**, which is why PvP players keep one on the hotbar. Use Sharpness V, Efficiency V, Unbreaking III and Mending. Axes cannot take Looting, Fire Aspect or Knockback in survival, so a sword stays your farming weapon.',
        ],
      },
      {
        heading: 'How the mace works',
        paragraphs: [
          'The mace is crafted from a **heavy core** and a **breeze rod**. Heavy cores come only from ominous vaults in trial chambers, opened with ominous trial keys, so maces are rare. A normal hit deals 6 damage, but after falling at least 1.5 blocks you perform a **smash attack**:',
        ],
        list: [
          '+4 damage per block for the first 3 blocks fallen.',
          '+2 damage per block for the next 5 blocks.',
          '+1 damage per block after that, with no upper limit.',
          'A smash hit cancels your own fall damage and knocks back other entities within about 2.5 blocks.',
        ],
      },
      {
        heading: 'Density, Breach and Wind Burst',
        paragraphs: ['These three mace-only enchantments change how you play it:'],
        list: [
          '**Density (max V)** – adds 0.5 damage per block fallen per level to smash attacks. Best for long drops with an elytra, pearls or wind charges.',
          '**Breach (max IV)** – reduces the target\'s armor effectiveness by 15% per level. Best against fully armored netherite players. Density and Breach are mutually exclusive, and both exclude Smite and Bane.',
          '**Wind Burst (max III)** – after a smash hit, launches you back up so you can chain another smash. It only comes from ominous vault loot and does not protect you from fall damage on a miss.',
          'A mace can also take Unbreaking, Mending and Fire Aspect. Repair it with breeze rods – each restores 25% durability in an anvil.',
        ],
      },
      {
        heading: 'Mace tips for DonutSMP',
        paragraphs: [
          'Maces are traded on the DonutSMP auction house, and the Shard Shop has listed a mace with Density and Wind Burst (shard prices change, so check in-game). No special restriction on maces is documented – but combat settings change, so check `/rules` and recent announcements. A shield blocks a mace hit just like any other melee attack, and missing a smash often means taking full fall damage, so practise drops away from crystals first.',
          'If you want one without farming trial chambers, the [mace](/product/mace) is in our store, along with other gear in [tools and weapons](/shop/tools-weapons). Real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Is Density or Breach better on a mace?', a: 'Density is better for big falls and unarmored targets; Breach is better against players in full netherite. You can only have one of them.' },
      { q: 'How do you get a mace in 1.21?', a: 'Craft it from a heavy core, found in ominous vaults in trial chambers, and a breeze rod.' },
      { q: 'Why carry an axe in PvP?', a: 'Hitting a blocking player with an axe disables their shield for 5 seconds.' },
    ],
    related: ['best-armor-enchantments', 'donutsmp-pvp-guide', 'trident-bow-crossbow-guide'],
    shopLinks: [
      { label: 'Mace', to: '/product/mace' },
      { label: 'Tools & weapons', to: '/shop/tools-weapons' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'trident-bow-crossbow-guide',
    category: 'Items & gear',
    title: 'Trident, Bow and Crossbow Guide: Enchantments and Uses',
    seoTitle: 'Trident, Bow & Crossbow Enchantment Guide',
    metaDescription:
      'How to get a trident, Loyalty vs Riptide vs Channeling, the best bow and crossbow enchantments in Java 1.21, tipped arrows and ranged PvP tips.',
    summary: 'Getting a trident, choosing Riptide or Loyalty, and the best bow and crossbow enchants for ranged combat.',
    intro:
      'Ranged weapons rarely win a crystal fight on their own, but they control space, knock players off ledges and turn travel into an advantage. The trident is also a strong melee weapon and, with Riptide, a movement tool. This guide covers how to get each weapon and which enchantments to put on it in Java 1.21.',
    sections: [
      {
        heading: 'Getting a trident',
        paragraphs: [
          'Tridents cannot be crafted. They only drop from **drowned** that are holding one, with an 8.5% chance when you kill them (plus 1% per Looting level). Drowned spawn in rivers and oceans, so a drowned farm or a lot of night-time hunting is the usual route. A trident deals 9 damage in melee and 8 when thrown, and has 250 durability.',
        ],
      },
      {
        heading: 'Trident enchantments',
        paragraphs: ['Choose between the three main options based on how you use it:'],
        list: [
          '**Loyalty III** – the trident flies back after a throw. Best for combat.',
          '**Riptide III** – throwing launches you instead, but only in water or rain. Combined with an elytra in the rain it is extremely fast travel. Riptide cannot be combined with Loyalty or Channeling.',
          '**Channeling** – summons lightning on the target during thunderstorms. Lightning can turn creepers into charged creepers and villagers into witches.',
          '**Impaling V** – in Java it only adds damage against aquatic mobs, so it does little in PvP.',
          '**Unbreaking III** and **Mending** on any trident you keep.',
        ],
      },
      {
        heading: 'Best bow enchantments',
        paragraphs: [
          'A fully charged bow with **Power V** deals 150% more damage than an unenchanted one. A typical "god bow" adds **Punch II** for knockback, **Flame** for fire damage and **Unbreaking III**, plus either **Infinity** or **Mending** – the two cannot be combined. Infinity saves arrows; Mending keeps the bow alive forever. Most PvP players pick Mending and carry arrows.',
        ],
      },
      {
        heading: 'Crossbow enchantments',
        paragraphs: ['Crossbows load once and stay loaded, so you can carry one ready to fire:'],
        list: [
          '**Quick Charge III** – much faster loading.',
          '**Multishot** – fires three projectiles at once; it is exclusive with **Piercing**, which lets arrows pass through several targets.',
          'Crossbows can fire **firework rockets**, which explode on impact; rockets crafted with more firework stars deal more damage.',
          'Add **Unbreaking III** and **Mending**.',
        ],
      },
      {
        heading: 'Arrows and ranged PvP tips',
        paragraphs: [
          'Tipped arrows are crafted from 8 arrows around a lingering potion and apply that effect on hit – Slowness, Weakness and Poison are common choices. Spectral arrows make the target glow so you can track them. Wind charges, dropped by breezes in trial chambers, launch you or your opponent and pair well with a [mace](/wiki/sword-axe-mace-enchantments).',
          'On DonutSMP, a Punch bow is most useful for knocking players out of position or off a cliff, and a crossbow with rockets is a strong opener. A ready-enchanted [trident](/product/trident) and [god bow](/product/god-bow) are in our store; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Can you craft a trident?', a: 'No. Tridents only drop from drowned that hold one, at an 8.5% chance per kill plus 1% per Looting level.' },
      { q: 'Can a bow have Mending and Infinity?', a: 'No, they are mutually exclusive. Most players choose Mending and carry arrows.' },
      { q: 'Does Riptide work without rain?', a: 'Only in water. Riptide needs you to be in water or standing in rain.' },
    ],
    related: ['sword-axe-mace-enchantments', 'donutsmp-pvp-guide', 'donutsmp-elytra'],
    shopLinks: [
      { label: 'Trident', to: '/product/trident' },
      { label: 'God bow', to: '/product/god-bow' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── PvP & combat
  {
    slug: 'donutsmp-pvp-guide',
    category: 'PvP & combat',
    title: 'PvP on DonutSMP: Crystals, Totems, Pots and Combat Basics',
    seoTitle: 'DonutSMP PvP Guide: Crystals, Totems & Pots',
    metaDescription:
      'How PvP works on DonutSMP: open PvP with no claims, crystal and anchor basics, totems, golden apples, potions and why not to log out mid-fight.',
    summary: 'Crystal PvP basics, totems, golden apples and pots, plus what to assume about combat logging on DonutSMP.',
    intro:
      'PvP on DonutSMP is fast and expensive. Most fights are crystal fights, gear is lost on death, and players with bounties attract attention. This page explains the basics every new fighter needs: how crystals and anchors work, how to manage totems and healing, and what to assume about combat logging.',
    sections: [
      {
        heading: 'How PvP works on DonutSMP',
        paragraphs: [
          'DonutSMP is a semi-anarchy server with open PvP everywhere – there are no land claims or safe zones, so other players can attack you and take your items when you die. It is not a lifesteal server: you lose items, not hearts. The community wikis agree that **crystal PvP** is the dominant fighting style rather than a niche one, so plan your gear around explosions – see [best armor enchantments](/wiki/best-armor-enchantments).',
          'Duels and the spawn lobbies were removed in the June 2026 update. One fan wiki says duels were turned into an RTP queue that drops you into the overworld with an opponent, but that is unconfirmed, so check in-game. Most practice now happens in the open world or with friends you trust.',
        ],
      },
      {
        heading: 'Crystals and respawn anchors',
        paragraphs: [
          'End crystals can only be placed on **obsidian or bedrock** and explode with great force when hit. Good crystal players place obsidian quickly, put the crystal where the blast reaches the enemy but not themselves and use blocks as cover. Respawn anchors are the other explosive: charged with glowstone and used outside the Nether, an anchor explodes, which players use when crystals are awkward to place.',
          'Explosions hit everyone nearby, including you. Practise distance and timing before you bring valuable gear.',
        ],
      },
      {
        heading: 'Totems, apples and potions',
        paragraphs: ['Your survival loop in a fight looks like this:'],
        list: [
          '**Totem of undying in the offhand** – it only works when held. After it pops, swap in a new one immediately. See [totems and PvP gear](/wiki/totems-pvp-gear).',
          '**Golden apples** – Regeneration II for 5 seconds and Absorption for 2 minutes.',
          '**Enchanted golden apples** – Regeneration II for 20 seconds, Absorption IV for 2 minutes, plus Resistance and Fire Resistance for 5 minutes. They cannot be crafted, so they are rare and valuable.',
          '**Splash potions** – Healing II, Strength II, Swiftness II, Fire Resistance and Turtle Master. See the [brewing guide](/wiki/potions-brewing-guide).',
          '**Experience bottles** – repair Mending armor mid-fight.',
          '**Ender pearls** – the main escape tool.',
        ],
      },
      {
        heading: 'Combat state and logging out',
        paragraphs: [
          'No reliable source documents DonutSMP\'s exact combat-tag rules – which commands or menus are blocked mid-fight, or for how long. Assume that teleports and menus may be restricted while you are in combat, and look through `/settings` for combat-related options.',
          'Never log out or disconnect to escape a fight. Assume it costs you your items, and check `/rules` in-game for the current combat-logging rule, since the exact timer and penalty are not documented and can change.',
        ],
      },
      {
        heading: 'Fair play and staying alive',
        paragraphs: [
          'Hacked clients, macros, auto clickers, health indicators and other advantage mods are banned, and crystal PvP does not make an exception – see [DonutSMP rules](/wiki/donutsmp-rules). Before a fight, leave valuables at home, check your durability, and keep a bounty in mind: players can put money on your head with `/bounty add`.',
          'Building a full kit takes time. Ready-made [PvP kits](/product/pvp-kit) and [totems of undying](/product/totem-of-undying) are in our store; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Is crystal PvP allowed on DonutSMP?', a: 'Yes. Crystal PvP is the main form of combat on DonutSMP. Macros and advantage mods are still banned.' },
      { q: 'What happens if I log out during a fight?', a: 'Do not do it. Treat combat logging as losing your items and check `/rules` for the current penalty.' },
      { q: 'Does DonutSMP still have /duel?', a: 'The duel command and spawn duel area were removed in the June 2026 update. One fan wiki says duels became an RTP queue; check in-game for the current state.' },
    ],
    related: ['totems-pvp-gear', 'potions-brewing-guide', 'best-armor-enchantments', 'donutsmp-rules'],
    shopLinks: [
      { label: 'PvP kit', to: '/product/pvp-kit' },
      { label: 'Totem of undying', to: '/product/totem-of-undying' },
      { label: 'Enchanted golden apple', to: '/product/enchanted-golden-apple' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'potions-brewing-guide',
    category: 'PvP & combat',
    title: 'Potions and Brewing Guide for PvP and Exploring',
    seoTitle: 'Potions & Brewing Guide for PvP (Java 1.21)',
    metaDescription:
      'How to brew potions in Java 1.21: brewing stand setup, every key recipe with durations, splash vs lingering, and the best potions for PvP and exploring.',
    summary: 'Brewing basics, the potions that matter for PvP and exploring, their ingredients and how long they last.',
    intro:
      'A few potions can turn a lost fight into a win and make dangerous trips safe. Brewing them yourself is cheap once you have nether wart and blaze powder. This guide covers the brewing stand, the recipes that matter, and which potions to carry for PvP and for exploring in Java 1.21.',
    sections: [
      {
        heading: 'Brewing basics',
        paragraphs: [
          'Craft a brewing stand from 1 blaze rod and 3 cobblestone, blackstone or cobbled deepslate. It brews up to three bottles at once and burns **blaze powder** as fuel – one powder lasts 20 brews. Almost every potion starts the same way:',
        ],
        list: [
          'Fill glass bottles with water.',
          'Add **nether wart** to make awkward potions. Nether wart grows on soul sand and is found in Nether fortresses.',
          'Add the effect ingredient, such as blaze powder for Strength.',
          'Optionally modify it: **redstone** extends the duration, **glowstone** raises the level, a **fermented spider eye** corrupts the effect, **gunpowder** makes it a splash potion and **dragon\'s breath** turns a splash potion into a lingering one.',
        ],
      },
      {
        heading: 'PvP potions',
        paragraphs: ['Durations are for the drinkable versions in Java 1.21:'],
        list: [
          '**Strength** (blaze powder) – 3:00, 8:00 extended, or Strength II for 1:30.',
          '**Swiftness** (sugar) – 3:00, 8:00 extended, or Speed II for 1:30.',
          '**Healing** (glistering melon slice) – instant health; Healing II heals more.',
          '**Regeneration** (ghast tear) – 0:45, 1:30 extended, or Regeneration II for 0:22.',
          '**Fire Resistance** (magma cream) – 3:00 or 8:00; also protects against fire aspect and lava.',
          '**Turtle Master** (turtle shell) – Slowness IV and Resistance III for 0:20, or 0:40 extended.',
          '**Harming** – fermented spider eye on Healing or Poison. Splash it on enemies.',
        ],
      },
      {
        heading: 'Exploring potions',
        paragraphs: ['For trips into the Nether, End and oceans:'],
        list: [
          '**Fire Resistance** – the most important potion for ancient debris mining and fortresses.',
          '**Night Vision** (golden carrot) – 3:00 or 8:00, perfect for caves and underwater.',
          '**Water Breathing** (pufferfish) – 3:00 or 8:00 for ocean monuments.',
          '**Slow Falling** (phantom membrane) – 1:30 or 4:00, a lifesaver in the End.',
          '**Invisibility** – fermented spider eye on Night Vision. Armor stays visible, so it is better for scouting than fighting.',
          'The 1.21 potions **Wind Charged**, **Weaving**, **Oozing** and **Infested** use a breeze rod, cobweb, slime block or stone and last 3:00. They are niche, but fun in PvP.',
        ],
      },
      {
        heading: 'Splash, lingering and potion tips',
        paragraphs: [
          'Splash potions keep the same duration as the drinkable version but apply instantly, which is why PvP players use splash Healing, Strength and Swiftness. Lingering potions leave a cloud that applies a quarter of the duration and are used to craft tipped arrows. Remember that Healing hurts undead mobs and Harming heals them.',
          'Brewing in bulk needs a lot of blaze powder, so a blaze spawner or farm pays off quickly – see the [blaze farm guide](/wiki/blaze-farm-blaze-rods). A [blaze spawner](/product/blaze-spawner) and ready-made [PvP kits](/product/pvp-kit) are also in our store; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'How long does one blaze powder last in a brewing stand?', a: 'One blaze powder fuels 20 brewing operations, each of which can brew up to three bottles.' },
      { q: 'Do splash potions last as long as normal potions?', a: 'In Java, yes – splash potions keep the full duration. Lingering potions apply only a quarter of it.' },
      { q: 'What is the best potion for PvP?', a: 'Strength II and splash Healing II are the core pair, with Swiftness and Fire Resistance as support.' },
    ],
    related: ['blaze-farm-blaze-rods', 'donutsmp-pvp-guide', 'totems-pvp-gear'],
    shopLinks: [
      { label: 'Blaze spawner', to: '/product/blaze-spawner' },
      { label: 'PvP kit', to: '/product/pvp-kit' },
    ],
    updatedAt: UPDATED,
  },

  // ───────────────────────────────────────────── Storage & utility gear
  {
    slug: 'shulker-boxes-ender-chest-storage',
    category: 'Items & gear',
    title: 'Shulker Boxes, Ender Chests and Keeping Loot Safe',
    seoTitle: 'Shulker Boxes & Ender Chests: Safe Storage',
    metaDescription:
      'How shulker boxes and ender chests work in Java 1.21, how to get shulker shells, and storage habits that keep your loot safe from DonutSMP base hunters.',
    summary: 'How shulker boxes and ender chests work, and storage habits that keep your loot away from base hunters.',
    intro:
      'On DonutSMP a chest is only as safe as its location, and base hunters find most locations eventually. Shulker boxes and ender chests are the two tools that change that. Shulker boxes let you move a whole chest of items in one slot, and your ender chest holds items no raider can open. This page explains both and how to combine them.',
    sections: [
      {
        heading: 'How shulker boxes work',
        paragraphs: [
          'A shulker box holds 27 stacks, like a chest, but **keeps its contents when broken** – you pick it up as a single item with everything still inside. That makes it the standard way to carry, trade and store large amounts of items.',
        ],
        list: [
          'Craft one from **2 shulker shells and a chest**.',
          'Dye it any of 16 colours and rename it in an anvil to keep storage organised.',
          'Shulker boxes cannot be put inside other shulker boxes.',
          'Bundles (1.21.2 and later) hold small mixed items in one slot and fit inside shulker boxes.',
        ],
      },
      {
        heading: 'Getting shulker shells',
        paragraphs: [
          'Shells only drop from **shulkers**, which live in End cities in the outer End islands. Each shulker has about a 50% chance to drop a shell, and Looting raises it. On DonutSMP the End is shared by a lot of players, so cities near the main island are usually cleared out – expect to fly far, ideally with an [elytra](/wiki/donutsmp-elytra). Many players simply buy boxes on the auction house instead.',
        ],
      },
      {
        heading: 'How ender chests work',
        paragraphs: [
          'An ender chest is crafted from 8 obsidian and an eye of ender. Every ender chest anywhere in the world opens the **same personal inventory**, and only you can see your own contents. If someone breaks an ender chest at your base, they get obsidian (or the chest with Silk Touch), never your items.',
          'Your ender chest contents are not dropped when you die. Combined with shulker boxes, that means 27 boxes of 27 stacks each – 729 stacks of private storage that no base hunter can take.',
        ],
      },
      {
        heading: 'Keeping loot safe from base hunters',
        paragraphs: ['A few habits protect most of your wealth:'],
        list: [
          'Keep your most valuable items in shulker boxes inside your ender chest, not in base chests.',
          'Carry a Silk Touch pickaxe and an ender chest so you can stash loot anywhere.',
          'Do not carry full shulker boxes into fights – they drop on death like any other item.',
          'Split the rest across a few small, hidden stashes rather than one chest room.',
          'Keep part of your wealth as money, which cannot be raided.',
        ],
      },
      {
        heading: 'Planning your storage',
        paragraphs: [
          'Sort shulker boxes by colour – one for PvP restocks, one for building blocks, one for farm output – and label them. Keep a spare kit box in your ender chest so a raided base or a lost fight does not leave you starting from zero.',
          'For more on hiding a base, read [base protection](/wiki/donutsmp-base-protection) and our [base hunting guide](/guides/donutsmp-base-hunting-guide). Ready-made [shulker boxes](/product/shulker-box) are also in our store; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'Can base hunters steal from my ender chest?', a: 'No. Ender chest contents belong only to you. Breaking your ender chest only gives the raider obsidian or an empty ender chest.' },
      { q: 'Do shulker boxes keep items when broken?', a: 'Yes. A broken shulker box drops as one item with all its contents inside.' },
      { q: 'Can you put a shulker box inside a shulker box?', a: 'No, shulker boxes cannot be nested. Put them inside your ender chest instead.' },
    ],
    related: ['donutsmp-base-protection', 'donutsmp-elytra', 'beacon-guide'],
    shopLinks: [
      { label: 'Shulker box', to: '/product/shulker-box' },
      { label: 'Base hunting guide', to: '/guides/donutsmp-base-hunting-guide' },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: 'beacon-guide',
    category: 'Items & gear',
    title: 'Beacons: Pyramid Setup, Powers and the Wither',
    seoTitle: 'Beacon Guide: Pyramid, Powers & Wither',
    metaDescription:
      'How to get a beacon in Java 1.21: beating the Wither, pyramid sizes, range, the best powers like Haste II, and beacons vs DonutSMP base hunters.',
    summary: 'Getting a nether star, building the pyramid and choosing powers – plus why a beacon beam can give your base away.',
    intro:
      'A beacon gives everyone nearby a permanent buff, from Haste II for fast mining to Strength for fights and Regeneration at home. Getting one means beating the Wither, and building a full pyramid takes a lot of metal. This page covers each step in Java 1.21 and what to watch out for on DonutSMP.',
    sections: [
      {
        heading: 'Getting a nether star',
        paragraphs: [
          'A beacon is crafted from a **nether star**, 5 glass and 3 obsidian. The only source of nether stars is the **Wither**. To summon it, place 4 soul sand or soul soil in a T shape and put 3 wither skeleton skulls on top. Wither skeletons spawn in Nether fortresses and drop a skull 2.5% of the time, plus 1% per Looting level.',
          'The Wither destroys blocks and fires exploding skulls, so fight it far away from your base. Bring netherite armor, a Smite or Sharpness sword, milk for the Wither effect, healing potions and golden apples.',
        ],
      },
      {
        heading: 'Building the pyramid',
        paragraphs: [
          'A beacon must sit on a pyramid of iron, gold, emerald, diamond or netherite blocks, and the types can be mixed. The beacon also needs a clear path to the sky; only transparent blocks such as glass may be above it.',
        ],
        list: [
          '**Level 1** – 3×3 base, 9 blocks, range about 20 blocks.',
          '**Level 2** – adds a 5×5 layer, 34 blocks in total, range 30.',
          '**Level 3** – adds a 7×7 layer, 83 blocks in total, range 40.',
          '**Level 4** – adds a 9×9 layer, 164 blocks in total, range 50.',
        ],
      },
      {
        heading: 'Choosing powers',
        paragraphs: [
          'Activate a beacon by inserting one iron ingot, gold ingot, emerald, diamond or netherite ingot and choosing a power. The payment is only spent when you set or change the power; the beacon runs forever after that.',
        ],
        list: [
          'Level 1 unlocks **Speed** and **Haste**. Level 2 adds **Resistance** and **Jump Boost**. Level 3 adds **Strength**.',
          'Level 4 unlocks a secondary power: **Regeneration**, or level II of your primary power.',
          '**Haste II** with an Efficiency V diamond or netherite pickaxe mines stone instantly, the favourite setup for big digs.',
          'Resistance and Regeneration are good choices for a base you defend.',
        ],
      },
      {
        heading: 'Beacons and base security on DonutSMP',
        paragraphs: [
          'A beacon beam shoots straight into the sky and can be seen from far away, which makes it an easy target for base hunters flying overhead. Covering it with solid blocks switches the beacon off, so many players only place a beacon temporarily – for example during a big dig – and pick it up again afterwards. The pyramid itself is also loot: 164 iron or diamond blocks are worth raiding.',
          'Do not use netherite blocks for the pyramid unless you have plenty – iron works exactly the same. Save netherite for gear, and check [netherite and ancient debris](/wiki/netherite-ancient-debris) for the smithing upgrade.',
        ],
      },
      {
        heading: 'Where netherite fits in',
        paragraphs: [
          'Netherite ingots are the most valuable beacon payment but give no better effect than an iron ingot. Their real value is the smithing upgrade from diamond to netherite gear. If you need ingots or blocks for that, [netherite ingots](/product/netherite-ingot) and [netherite blocks](/product/netherite-block) are in our store; real-money trading is against DonutSMP rules and at your own risk.',
        ],
      },
    ],
    faq: [
      { q: 'How many blocks does a full beacon pyramid need?', a: '164 blocks of iron, gold, emerald, diamond or netherite for a level 4 beacon.' },
      { q: 'Does a beacon use up fuel?', a: 'No. You pay one ingot, emerald or diamond when choosing a power, and the beacon then runs indefinitely.' },
      { q: 'Can a beacon work underground?', a: 'Only if every block between the beacon and the sky is transparent, such as glass. Solid blocks above switch it off.' },
    ],
    related: ['netherite-ancient-debris', 'shulker-boxes-ender-chest-storage', 'donutsmp-base-protection'],
    shopLinks: [
      { label: 'Netherite block', to: '/product/netherite-block' },
      { label: 'Netherite ingot', to: '/product/netherite-ingot' },
    ],
    updatedAt: UPDATED,
  },
];
