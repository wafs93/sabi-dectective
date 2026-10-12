import type { Interrogation } from "@/data/interrogations";

// Case 3 "The Clean Money": interrogation dialogue, keyed by suspect id (same shape as Case 1
// and Case 2 in src/data/interrogations.ts). Registered only in builds with
// NEXT_PUBLIC_ENABLE_CASE3=1; with it off, the build drops this file. No runtime imports, on
// purpose, so the ids are written out (they match src/data/case3/case3.ts; a test checks).
//
// Confronts are keyed by VISIBLE clue ids only (V1 to V8). Some of them reveal a hidden clue on
// the server, some don't; nothing here says which, and no line states a hidden clue's facts.

const V1 = "33333333-3333-4333-8333-000000000301"; // Fake dating profiles
const V2 = "33333333-3333-4333-8333-000000000302"; // Kelvin's phone chat
const V3 = "33333333-3333-4333-8333-000000000303"; // Hope Bridge donation list
const V4 = "33333333-3333-4333-8333-000000000304"; // Kelvin's bank statement
const V5 = "33333333-3333-4333-8333-000000000305"; // Yinka's receipt book
const V6 = "33333333-3333-4333-8333-000000000306"; // Compliance flag memo
const V7 = "33333333-3333-4333-8333-000000000307"; // Campaign finance filing
const V8 = "33333333-3333-4333-8333-000000000308"; // Raid report

export const case3Interrogations: Record<string, Interrogation> = {
  // Kelvin "KP" Okoro
  "22222222-2222-4222-8222-000000000301": {
    openingLine: "Oga Detective! Abeg, why all this wahala? I'm just a young man with a laptop and big dreams.",
    questions: [
      {
        id: "c3-kelvin-money",
        text: "Where did all the money in your accounts come from?",
        defaultAnswer: "My own runs, Oga. Every kobo. I'm very good at what I do, abeg.",
        unlockedByClueId: V4,
        confrontText:
          "Your statement shows round credits of N62,000,000 on 28 July, 28 August and 28 September. N186,000,000 in total. From your runs?",
        confrontedAnswer:
          "Ehn... round numbers are lucky numbers, Oga. My hustle is blessed. ... Okay. Okay, wait. Make I bring something. Na paper, just paper.",
      },
      {
        id: "c3-kelvin-work",
        text: "What exactly do you do for a living?",
        defaultAnswer: "Digital marketing. Relationships. I help lonely people feel loved, small small.",
        unlockedByClueId: V1,
        confrontText: "These fake dating profiles were on your laptop. Dozens of them, sweet-talking lonely foreigners.",
        confrontedAnswer:
          "Ah, Oga, you don dey look my laptop? That one na small small hustle. You want to see the real figures of my business? Hold on. I write everything down.",
      },
      {
        id: "c3-kelvin-hope",
        text: "Have you heard of the Hope Bridge Foundation?",
        defaultAnswer: "Hope wetin? Never heard of it. I no dey do charity, Oga. Charity dey do me.",
      },
      {
        id: "c3-kelvin-chat",
        text: "Who is Oga C in your phone?",
        defaultAnswer: "Oga C? Na my barber. Very serious man about haircuts.",
        unlockedByClueId: V2,
        confrontText: "Your chat with Oga C is about which accounts are hot this week. Not haircuts.",
        confrontedAnswer: "Haha! Hot accounts, hot weather. Lagos is hot, Oga. That one, I no fit talk am. Ask him yourself.",
      },
      {
        id: "c3-kelvin-raid",
        text: "What happened on the morning of the raid?",
        defaultAnswer: "Police knock my door like say na Nollywood. I was still in my boxers. Very disrespectful, abeg.",
      },
      {
        id: "c3-kelvin-tip",
        text: "Who do you think tipped off the police?",
        defaultAnswer: "Na jealousy, Oga. Lagos people no like to see young man shine.",
      },
      {
        id: "c3-kelvin-spend",
        text: "What do you spend your money on?",
        defaultAnswer: "Clothes, small Dubai trip, nice shoes. I enjoy my life. Is enjoyment a crime now?",
      },
    ],
  },

  // Hon. Ifeanyi Madu
  "22222222-2222-4222-8222-000000000302": {
    openingLine:
      "Detective, welcome. My campaign has nothing to hide, and my door is always open to the honest work of the police.",
    questions: [
      {
        id: "c3-madu-account",
        text: "What happened to your campaign account?",
        defaultAnswer:
          "It was hacked, plain and simple. Criminals used our good name, and we reported it the moment we found out.",
        unlockedByClueId: V7,
        confrontText: "Your campaign's public filing declares N186,000,000 in donor contributions, but it names no donors.",
        confrontedAnswer:
          "Donors value their privacy, Detective. In politics, generosity is often shy. My team will provide whatever the law requires.",
      },
      {
        id: "c3-madu-foundation",
        text: "What do you know about the Hope Bridge Foundation's accounts?",
        defaultAnswer: "Nothing at all. The Foundation is my wife's work. I don't sign there and I don't look there.",
        unlockedByClueId: V3,
        confrontText: "Hope Bridge received three donations of N58,900,000 each, on 30 July, 30 August and 30 September.",
        confrontedAnswer: "Then there are generous people in this country, thank God. Ask the Foundation. I have told you, I don't run it.",
      },
      {
        id: "c3-madu-raid",
        text: "How did you hear about the Lekki raid?",
        defaultAnswer: "On the news, like everybody else. I commend the police. Fraud is a cancer in our society.",
        unlockedByClueId: V8,
        confrontText: "The tip-off came from a prepaid SIM on the evening of 2 October. Somebody wanted that raid to happen.",
        confrontedAnswer: "Then that somebody is a good citizen, and I would shake his hand. Is there anything else, Detective? I have a rally.",
      },
      {
        id: "c3-madu-kelvin",
        text: "Do you know Kelvin Okoro?",
        defaultAnswer: "Never met the young man. I meet thousands of young people on the campaign trail. That name means nothing to me.",
      },
      {
        id: "c3-madu-sanni",
        text: "How well do you know Dr. Sanni Bello?",
        defaultAnswer: "Sanni is a fine accountant and an honest man. If he says the books balance, they balance.",
      },
      {
        id: "c3-madu-vote",
        text: "Why should anyone vote for you?",
        defaultAnswer: "Because I am the clean candidate, Detective. Roads, schools, light. And no more corruption.",
      },
      {
        id: "c3-madu-segun",
        text: "Segun deleted files after the raid. Did you ask him to?",
        defaultAnswer: "Segun is enthusiastic. He clears his desk when he is stressed. I don't manage his files.",
      },
    ],
  },

  // Dr. Sanni Bello
  "22222222-2222-4222-8222-000000000303": {
    openingLine: "Good afternoon, Detective. Ask me anything. Numbers are my life, and I'm always happy to explain them.",
    questions: [
      {
        id: "c3-sanni-books",
        text: "How many sets of campaign books do you keep?",
        defaultAnswer: "One. The same one in our public filing. Anything else would be improper, and I am a careful man.",
        unlockedByClueId: V7,
        confrontText:
          "Your public filing declares N186,000,000 in donor contributions and names no donors. One set of books, and not one donor?",
        confrontedAnswer:
          "That is a fair question. A very fair question. ... Give me a moment. I think I should show you something before my lawyer arrives.",
      },
      {
        id: "c3-sanni-payouts",
        text: "Who approves the Hope Bridge Foundation's payouts?",
        defaultAnswer: "Mrs. Madu approves every payout herself. She is very hands-on, very particular.",
        unlockedByClueId: V3,
        confrontText: "Hope Bridge received three donations of N58,900,000 each in three months. Big money for a small foundation.",
        confrontedAnswer: "Donations are not payouts, Detective. Different column entirely. I keep my columns very tidy.",
      },
      {
        id: "c3-sanni-role",
        text: "What exactly do you do for the campaign?",
        defaultAnswer: "I record every naira that comes in and every naira that goes out. Accurately, on time, every time.",
      },
      {
        id: "c3-sanni-hack",
        text: "Was the campaign account really hacked?",
        defaultAnswer: "That is what the bank told us. I filed the report myself. A very unpleasant week.",
      },
      {
        id: "c3-sanni-bdc",
        text: "Does the campaign ever use a bureau de change?",
        defaultAnswer: "Never. Everything we do goes through the bank. Cash is untidy, and I don't like untidy.",
      },
      {
        id: "c3-sanni-kelvin",
        text: "Have you ever dealt with Kelvin Okoro?",
        defaultAnswer: "I don't know the young man. I have only seen his face on the news. Poor boy.",
      },
      {
        id: "c3-sanni-night",
        text: "Where were you on the evening of 2 October?",
        defaultAnswer: "At home, reconciling accounts. My wife will tell you I am very boring on weeknights.",
      },
    ],
  },

  // Mrs. Bisola Madu
  "22222222-2222-4222-8222-000000000304": {
    openingLine: "Oh, Detective, please sit down. Have you eaten? This whole matter has me so confused.",
    questions: [
      {
        id: "c3-bisola-signing",
        text: "Who decides what the Foundation pays out?",
        defaultAnswer: "I sign what my staff bring me. Paper after paper. I trust my people, Detective.",
      },
      {
        id: "c3-bisola-system",
        text: "Have you ever used the Foundation's computer system?",
        defaultAnswer: "Me? I have never touched it. I only sign paper. Computers and I are not friends.",
      },
      {
        id: "c3-bisola-donations",
        text: "Where do the Foundation's donations come from?",
        defaultAnswer: "Kind people. Businessmen, churches, our people in the diaspora. We help widows and school children.",
        unlockedByClueId: V3,
        confrontText:
          "Your own donation list shows three donations of N58,900,000 each, on 30 July, 30 August and 30 September. Who gives like that?",
        confrontedAnswer:
          "Fifty-eight million... three times? I thought it was one generous donor. Oh God. Wait, please. Let me bring my book from the office.",
      },
      {
        id: "c3-bisola-husband",
        text: "Does your husband help with the Foundation?",
        defaultAnswer: "He is so busy with the campaign. He says the Foundation is my baby, and he doesn't interfere.",
      },
      {
        id: "c3-bisola-kelvin",
        text: "Do you know Kelvin Okoro?",
        defaultAnswer: "The boy from the news? No. Such a waste. If he came to us, we would have given him a scholarship.",
      },
      {
        id: "c3-bisola-sanni",
        text: "Does Dr. Sanni work with the Foundation?",
        defaultAnswer: "He is kind enough to look over our accounts sometimes. He knows numbers, and I know people.",
      },
      {
        id: "c3-bisola-raid",
        text: "What were you doing on 3 October?",
        defaultAnswer: "Visiting an orphanage in Ikorodu. I have photos, so many photos. Would you like to see?",
      },
    ],
  },

  // Mr. Yinka Adewale
  "22222222-2222-4222-8222-000000000305": {
    openingLine:
      "Oga Detective, good afternoon o. Before anything, I am a legitimate businessman. Very legitimate. I have a licence, I can show you the licence.",
    questions: [
      {
        id: "c3-yinka-collect",
        text: "Who collected the dollars you changed at the end of July, August and September?",
        defaultAnswer: "Kelvin's boys. Young boys, two or three of them, every time. Ask Kelvin, abeg. Ask him.",
      },
      {
        id: "c3-yinka-records",
        text: "Do you keep a record of every exchange?",
        defaultAnswer: "Every single one! Receipt book, stamp, everything. I am very organised. Too organised, my wife says.",
        unlockedByClueId: V5,
        confrontText: "The pages for the end of July, August and September have been torn out of your receipt book.",
        confrontedAnswer:
          "Torn? Ah. Rats. We get rats in that shop, big ones... No. No, okay. Abeg, I dey shake. Let me bring something from my drawer. Tell them I cooperated o.",
      },
      {
        id: "c3-yinka-amounts",
        text: "How much do you change in a normal week?",
        defaultAnswer: "Small small. Ten thousand dollars on a good week. The market is hard, the naira is doing gymnastics.",
      },
      {
        id: "c3-yinka-kelvin",
        text: "How do you know Kelvin?",
        defaultAnswer: "Everybody in Lekki knows KP. He changes small money with me sometimes. Small money, Oga, I swear.",
      },
      {
        id: "c3-yinka-raid",
        text: "Where were you during the raid on 3 October?",
        defaultAnswer: "In my shop since 7am. My neighbour sells puff-puff, she saw me. Ask her, she will tell you.",
        unlockedByClueId: V8,
        confrontText: "The tip-off for that raid came from a prepaid SIM the evening before, on 2 October.",
        confrontedAnswer:
          "Why are you looking at me like that? I have one phone and one SIM, registered in my name! I did not call any police!",
      },
      {
        id: "c3-yinka-nervous",
        text: "Why are you so nervous?",
        defaultAnswer: "Me, nervous? I drank three coffees. Okay, four. It has been a long week, Oga.",
      },
      {
        id: "c3-yinka-bank",
        text: "Do you know anyone at the bank?",
        defaultAnswer: "I know the security man, the cleaner, and the woman who sells akara outside. Inside? Nobody, abeg.",
      },
    ],
  },

  // Aisha Lawal
  "22222222-2222-4222-8222-000000000306": {
    openingLine: "I don't have long. What do you want to know?",
    questions: [
      {
        id: "c3-aisha-flag",
        text: "Why was the flag you raised on 12 September closed?",
        defaultAnswer: "I closed it myself. The client checked out. That's all.",
        unlockedByClueId: V6,
        confrontText:
          "Your memo says you flagged 40 linked accounts on 12 September, and the flag was closed two days later, on 14 September.",
        confrontedAnswer: "Two days. Yes. ... Please lower your voice. ... I kept copies of some things. I'll give them to you. Only to you.",
      },
      {
        id: "c3-aisha-job",
        text: "What does a compliance officer do?",
        defaultAnswer: "I look for money that moves strangely. Then I raise a flag.",
      },
      {
        id: "c3-aisha-strange",
        text: "Why did those accounts look strange to you?",
        defaultAnswer: "Big credits. The same day every month. In fast, out fast. It's a pattern.",
        unlockedByClueId: V4,
        confrontText: "Kelvin's statement shows N62,000,000 landing on 28 July, 28 August and 28 September.",
        confrontedAnswer: "I've seen that statement. I'm the one who noticed it. I don't need to see it again.",
      },
      {
        id: "c3-aisha-quiet",
        text: "Why did you go quiet after the raid?",
        defaultAnswer: "I have a family. That's my answer.",
      },
      {
        id: "c3-aisha-chidi",
        text: "Do you know Chidi Eze?",
        defaultAnswer: "Everybody at the bank knows that name. Different problem. Not my flag.",
      },
      {
        id: "c3-aisha-safe",
        text: "Do you feel safe?",
        defaultAnswer: "No. Next question.",
      },
      {
        id: "c3-aisha-kelvin",
        text: "Did you ever meet Kelvin?",
        defaultAnswer: "No. I only ever saw his account numbers.",
      },
    ],
  },

  // Segun Alabi
  "22222222-2222-4222-8222-000000000307": {
    openingLine: "Detective! Madu for Governor! Sorry, habit. Ask your questions quickly, I have three rallies today.",
    questions: [
      {
        id: "c3-segun-files",
        text: "Why did you delete files from the campaign office after the raid?",
        defaultAnswer: "Old campaign junk! Posters, drafts, jingles we didn't use. You people want to arrest me for cleaning?",
        unlockedByClueId: V7,
        confrontText:
          "Your campaign's public filing declares N186,000,000 in donor contributions and names no donors. And then files disappear.",
        confrontedAnswer:
          "Now you are making it sound like a film! ... Fine. FINE. Nothing is ever really gone on a computer. Give me a minute, I'll get them back for you.",
      },
      {
        id: "c3-segun-job",
        text: "What does a campaign manager actually do?",
        defaultAnswer: "Everything! Rallies, posters, buses, jingles, crowd control. I don't sleep, Detective.",
      },
      {
        id: "c3-segun-money",
        text: "Who handles the campaign money?",
        defaultAnswer: "Not me! I spend it, Dr. Sanni counts it. Ask the accountant!",
      },
      {
        id: "c3-segun-raid",
        text: "How did the campaign react to the raid?",
        defaultAnswer: "We were shocked! Our name in the news next to a yahoo boy? Opposition wickedness, that's what it is.",
      },
      {
        id: "c3-segun-madu",
        text: "Is Hon. Madu a good man?",
        defaultAnswer: "The best! He shook my hand in 2019 and I have not washed it since. Figure of speech.",
      },
      {
        id: "c3-segun-night",
        text: "Where were you on the evening of 2 October?",
        defaultAnswer: "Rally in Surulere. Five thousand people. Ten thousand, if you ask the posters.",
      },
      {
        id: "c3-segun-phones",
        text: "How many phones do you carry?",
        defaultAnswer: "Four phones for four networks. Campaign life! If one network fails, democracy continues.",
      },
    ],
  },

  // Oga Chidi Eze
  "22222222-2222-4222-8222-000000000308": {
    openingLine: "Detective. What a pleasure. I was wondering when you would get round to me.",
    questions: [
      {
        id: "c3-chidi-kp",
        text: "How do you know Kelvin Okoro?",
        defaultAnswer: "Everybody knows KP. We greet. Lekki is a small place for men with nice watches.",
      },
      {
        id: "c3-chidi-ogac",
        text: "Are you the Oga C in Kelvin's phone?",
        defaultAnswer: "There are many Chidis and many Cs in Lagos, Detective. Oga is a very common title.",
        unlockedByClueId: V2,
        confrontText: "Kelvin's phone shows a contact saved as Oga C, talking about which accounts are hot this week.",
        confrontedAnswer:
          "Hot accounts. How very dramatic of him. ... I have always believed in professional courtesy, Detective. Here. You will want to look at this.",
      },
      {
        id: "c3-chidi-business",
        text: "What do you do for a living?",
        defaultAnswer: "Import and export. Mostly ideas. I find them, I move them, and I profit.",
      },
      {
        id: "c3-chidi-bank",
        text: "Do you bank at the same bank as Kelvin?",
        defaultAnswer: "Half of Lagos banks there. The air conditioning is excellent.",
      },
      {
        id: "c3-chidi-ring",
        text: "People say you run a fraud ring. Do you?",
        defaultAnswer: "People say many things. I run a very successful network of friends.",
        unlockedByClueId: V1,
        confrontText: "Fake dating profiles were found on Kelvin's laptop. Dozens of them. Is that how your network makes money?",
        confrontedAnswer: "Dating profiles? Please, Detective. Love letters are for amateurs. I'm insulted on Kelvin's behalf, and on mine.",
      },
      {
        id: "c3-chidi-raid",
        text: "Where were you during the raid on 3 October?",
        defaultAnswer: "Asleep. Wealth is tiring, Detective.",
      },
      {
        id: "c3-chidi-politics",
        text: "Do you support any politician?",
        defaultAnswer: "I support whoever is winning. It saves time.",
      },
    ],
  },
};
