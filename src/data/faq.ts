/**
 * FAQ content. Answers support **bold**, `code`, [label](/link) and the
 * placeholders {{store}} {{server}} {{eta}} {{referralFriend}} {{referralReferrer}}
 * {{reviewReward}} {{welcomeCode}} {{welcomePercent}} {{spinCooldown}} – filled in
 * from the live PublicConfig by the FAQ components.
 */
export interface FaqItem {
  id: string;
  q: string;
  a: string;
  /** shown on the home page */
  top?: boolean;
}

export interface FaqGroup {
  id: string;
  title: string;
  blurb?: string;
  items: FaqItem[];
}

export const faqGroups: FaqGroup[] = [
  {
    id: 'orders',
    title: 'Orders',
    blurb: 'How ordering works, from cart to confirmation.',
    items: [
      {
        id: 'how-to-order',
        top: true,
        q: 'How do I place an order?',
        a: 'Add items to your cart, enter your **exact Minecraft username** at checkout and pick a payment method. You get an order ID and payment instructions right away. After you pay, tell us the reference on your order page – we confirm the payment and deliver in-game. Track everything at [/track](/track).',
      },
      {
        id: 'do-i-need-an-account',
        q: 'Do I need an account?',
        a: 'No. Orders are tied to your Minecraft username and order ID – keep the order ID (we also show it on the order page and send it to your e-mail if you add one). No passwords, no sign-up.',
      },
      {
        id: 'wrong-username',
        q: 'I typed the wrong username. What now?',
        a: 'Contact us on Discord **before delivery** with your order ID and the correct name. Once money or items have been handed to the username on the order we cannot take them back, so double-check the spelling – we validate names against Mojang at checkout to catch typos.',
      },
      {
        id: 'cancel-order',
        q: 'Can I cancel an order?',
        a: 'Yes, as long as it is still **awaiting payment** – use the cancel button on your order page. Paid orders are delivered, not cancelled; see our [refund policy](/refund-policy) for the exceptions.',
      },
      {
        id: 'minimum-order',
        q: 'Is there a minimum order?',
        a: 'No minimum on our side. Some payment methods have a small minimum (shown next to the method at checkout) and crypto networks charge their own fees for tiny amounts.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    blurb: 'Everything is delivered by hand, in-game, by our staff.',
    items: [
      {
        id: 'how-long',
        top: true,
        q: 'How long does delivery take?',
        a: '{{eta}} Deliveries are done manually by our staff, so there is no bot and no automation that can break. Our online status is shown on Discord; if nobody is online you will be served as soon as someone is back.',
      },
      {
        id: 'how-money-delivered',
        q: 'How is money delivered?',
        a: 'Through the server\'s own `/pay` command, straight to your balance. Be online on {{server}} with the username from your order and watch the chat. You do not have to meet anyone.',
      },
      {
        id: 'how-items-delivered',
        q: 'How are items and spawners delivered?',
        a: 'Join {{server}} with your order username, accept the teleport request from our delivery account and pick up the drop (shulkers for big orders). Make sure you have inventory space and are in a safe spot.',
      },
      {
        id: 'mystery-box-delivery',
        q: 'How do mystery boxes work?',
        a: 'Every box has a public drop table with odds (click **What\'s inside?** on any box). When you order, the drops are rolled server-side and listed on your order page, then handed over like normal items. You always receive exactly what was rolled.',
      },
      {
        id: 'offline-delivery',
        q: 'What if I am not online when you deliver?',
        a: 'Money can be paid while you are offline on most setups; items need you online. We will ping you on Discord (if you joined) or wait until you are on. Orders never expire after payment.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    blurb: 'Pay the way you like – we confirm quickly.',
    items: [
      {
        id: 'payment-methods',
        top: true,
        q: 'Which payment methods do you accept?',
        a: 'PayPal (Friends & Family), crypto (Litecoin, and others when enabled), cards / Apple Pay / Google Pay through Stripe when it is enabled, plus gift cards on request. The exact list is shown at checkout and depends on what is switched on right now.',
      },
      {
        id: 'paypal-ff',
        q: 'Why PayPal Friends & Family?',
        a: 'Friends & Family has no fees and no holds, so we can keep prices low and deliver faster. If you can only send Goods & Services, contact us first – we may ask you to cover the fee.',
      },
      {
        id: 'crypto',
        q: 'How does paying with crypto work?',
        a: 'Pick a coin at checkout, send the shown amount to our address and paste the transaction hash on your order page. We confirm after the network confirms (usually a few minutes for Litecoin). Send the exact amount – underpaid orders are topped up as store credit.',
      },
      {
        id: 'payment-reported',
        q: 'I paid – why does my order still say "awaiting payment"?',
        a: 'Manual payments are checked by a human. Make sure you submitted the reference (transaction ID / PayPal e-mail) on your order page; that is what notifies us. If it has been more than an hour, ping us on Discord with your order ID.',
      },
      {
        id: 'currency',
        q: 'Can I pay in my own currency?',
        a: 'Prices are set in USD. The currency switcher in the header shows estimates in EUR, GBP and others; your payment provider does the actual conversion at its own rate.',
      },
    ],
  },
  {
    id: 'free',
    title: 'Free stuff',
    blurb: 'Spins, referrals, reviews and codes.',
    items: [
      {
        id: 'daily-spin',
        top: true,
        q: 'How does the daily spin work?',
        a: 'Visit [/spin](/spin) and spin the wheel for free – **one spin every {{spinCooldown}} hours** per person. Prizes are coupons, store credit or free items. Free items need a Minecraft username so we can deliver them, and each username can win **one free-item prize per week** (further free-item wins turn into a coupon). Coupons expire, so use them.',
      },
      {
        id: 'referral',
        q: 'How does "refer a friend" work?',
        a: 'Share your link from [/referral](/referral). Your friend gets **{{referralFriend}}% off** their first order and you receive **{{referralReferrer}}%** of what they paid as store credit after delivery. Credit is applied automatically at checkout when you enter your username.',
      },
      {
        id: 'review-reward',
        q: 'Do I get something for a review?',
        a: 'Yes – after your order is delivered you can rate it on the order page. Once the review is approved we send you a **{{reviewReward}}% coupon** for your next order. One review per order.',
      },
      {
        id: 'welcome-code',
        q: 'Is there a first-order discount?',
        a: 'When enabled, the code **{{welcomeCode}}** gives {{welcomePercent}}% off at checkout. You can combine welcome codes, spin coupons and store credit with bulk prices and spending tiers, but only one coupon per order.',
      },
      {
        id: 'redeem-code',
        q: 'I have a gift code – where do I use it?',
        a: 'Gift codes from giveaways or support are redeemed at [/redeem](/redeem): enter the code and your username and we create a free order for you. Discount coupons go into the coupon field at checkout instead.',
      },
    ],
  },
  {
    id: 'trust',
    title: 'Trust & safety',
    blurb: 'Honest answers to the questions people ask before their first order.',
    items: [
      {
        id: 'is-it-safe',
        top: true,
        q: 'Is this safe? Will I get banned?',
        a: 'We deliver with normal in-game actions (`/pay`, teleports and drops) and never ask for your password or account. That said, {{server}}\'s rules prohibit real-money trading and enforcement is the server\'s decision – buying is at your own risk and responsibility. We keep deliveries discreet and spread out, and we never advertise in-game.',
      },
      {
        id: 'who-goes-first',
        q: 'Who goes first?',
        a: 'You pay first, we deliver – like any store. The difference to a random trader is that you have an order ID, a payment record, a public review history and a store that would lose everything by scamming one customer. Start with a small order if you want to test us.',
      },
      {
        id: 'affiliation',
        q: 'Are you affiliated with the server or Mojang?',
        a: 'No. {{store}} is an independent store run by players. We are not affiliated with, endorsed by or connected to {{server}}, Mojang or Microsoft.',
      },
      {
        id: 'data',
        q: 'What data do you store?',
        a: 'Your Minecraft username, the order and payment reference, an optional e-mail, a hashed IP address and a random device id used for spin cooldowns. We do not sell data. Full details in the [privacy policy](/privacy).',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    items: [
      {
        id: 'support',
        q: 'How do I reach support?',
        a: 'Discord is fastest – open a ticket with your order ID. You can also check any order at [/track](/track) without contacting us.',
      },
      {
        id: 'bulk-deals',
        q: 'Do you do custom or bulk deals?',
        a: 'Yes. For very large money amounts, item lists not in the store or regular purchases, message us on Discord and we will quote a price.',
      },
    ],
  },
];

export const allFaq: FaqItem[] = faqGroups.flatMap((g) => g.items);
export const topFaq: FaqItem[] = allFaq.filter((i) => i.top).slice(0, 5);
