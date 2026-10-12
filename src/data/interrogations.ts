import { CASE1_CLUES, CASE1_SUSPECTS } from "@/data/case1-ids";
import { CASE2_CLUES, CASE2_SUSPECTS } from "@/data/case2-ids";
import { case99Interrogations } from "@/data/test-case/case99";

// Interrogation dialogue lives here until it moves into the database.
// Keyed by suspect id; unlockedByClueId is a clue id.

export type InterrogationQuestion = {
  id: string;
  text: string;
  defaultAnswer: string;
  unlockedByClueId?: string;
  confrontText?: string;
  confrontedAnswer?: string;
};

export type Interrogation = {
  openingLine: string;
  questions: InterrogationQuestion[];
};

export const interrogations: Record<string, Interrogation> = {
  [CASE1_SUSPECTS.chuks]: {
    openingLine: "Ah, Detective, I would never touch Mama. She's like my own mother.",
    questions: [
      {
        id: "chuks-paid",
        text: "Were you paid last month?",
        defaultAnswer: "Things have been slow for her, that's all. I understand.",
        unlockedByClueId: CASE1_CLUES.ledger,
        confrontText: "This ledger says you're owed two months' pay. That's not nothing.",
        confrontedAnswer:
          "Okay, fine, I was vexed. But vexed is not the same as attacking somebody.",
      },
      {
        id: "chuks-where",
        text: "Where were you last night?",
        defaultAnswer: "Home, sleeping, like everybody else.",
        unlockedByClueId: CASE1_CLUES.footprint,
        confrontText: "The footprints by the back alley match your boots exactly.",
        confrontedAnswer:
          "Alright, I came back to talk to her about the money. Just talk. She wouldn't listen, and... things got out of hand.",
      },
    ],
  },
  [CASE1_SUSPECTS.bisi]: {
    openingLine: "Me? Mama and I compete, yes, but I would never hurt her.",
    questions: [
      {
        id: "bisi-where",
        text: "Where were you last night?",
        defaultAnswer: "I closed up and went home early.",
        unlockedByClueId: CASE1_CLUES.securityLog,
        confrontText: "Mama Chidinma's logbook shows you left at 7pm.",
        confrontedAnswer: "Exactly. I was long gone before anything happened.",
      },
      {
        id: "bisi-resent",
        text: "Do you resent Mama Chidinma?",
        defaultAnswer: "We fight over customers, that's business. Nothing more.",
      },
    ],
  },

  // ---- Case 2: The Second Buyer ----

  [CASE2_SUSPECTS.kunle]: {
    openingLine:
      "Good evening, Detective. Anything the family needs, I'm here. I only got back from Abuja this morning.",
    questions: [
      {
        id: "kunle-where",
        text: "Where were you last night?",
        defaultAnswer: "Abuja. Client meeting ran late, so I slept there. Check with my office.",
        unlockedByClueId: CASE2_CLUES.tollReceipt,
        confrontText: "This toll receipt was on your back seat. Lekki toll gate, 01:48 last night.",
        confrontedAnswer:
          "That's... that must be my driver. He uses the car when I travel. I'll ask him. It's nothing.",
      },
      {
        id: "kunle-sale",
        text: "What do you know about the sale of Plot 14?",
        defaultAnswer:
          "It's simple. Greenfield Homes buys, the family gets paid, everybody moves on. I drew up the papers myself.",
        unlockedByClueId: CASE2_CLUES.secondAgreement,
        confrontText:
          "A second agreement for Plot 14. Second buyer, Chief R. Ibe. And the witness is A. O. Balogun. You.",
        confrontedAnswer:
          "Where did you get that? Detective, a witness signs many things... I... I think I need to call my own lawyer now.",
      },
      {
        id: "kunle-key",
        text: "Who can open the family safe?",
        defaultAnswer: "Mama Nkechi, of course. She keeps that key close.",
        unlockedByClueId: CASE2_CLUES.keyLog,
        confrontText: "The key log lists a second key. \"Lawyer's key - A.O.B.\" That's yours.",
        confrontedAnswer:
          "Yes, I hold a key. I'm the family lawyer, that's normal. Holding a key is not a crime, Detective.",
      },
    ],
  },
  [CASE2_SUSPECTS.dele]: {
    openingLine:
      "Detective, this sale is daylight robbery! My late brother's land, and they want to sell it for peanuts.",
    questions: [
      {
        id: "dele-safe",
        text: "Did you go near the safe tonight?",
        defaultAnswer: "Me? I never went near that study. Ask anybody in this house.",
      },
      {
        id: "dele-why-here",
        text: "Why were you at the house tonight?",
        defaultAnswer: "Do I need a reason to visit my own brother's house? Family matters.",
        unlockedByClueId: CASE2_CLUES.debtLetter,
        confrontText: "This final notice says you owe two million, four hundred and fifty thousand naira.",
        confrontedAnswer:
          "Okay, okay! I came to beg Mama for a loan from the sale money. I'm in trouble, I won't lie. But what would I do with a deed? I can't sell land that isn't mine.",
      },
      {
        id: "dele-sale",
        text: "Why are you so against the sale?",
        defaultAnswer: "Because they're cheating us! That developer is paying nothing for prime Ajah land.",
      },
    ],
  },
  [CASE2_SUSPECTS.ada]: {
    openingLine: "Good evening, sir. Eleven years I've worked for Mama. I would never steal from her.",
    questions: [
      {
        id: "ada-code",
        text: "Do you know the safe code?",
        defaultAnswer: "Yes, Mama trusts me with it. But I have never opened that safe without her.",
      },
      {
        id: "ada-midnight",
        text: "What were you doing around midnight?",
        defaultAnswer: "Sleeping, sir. I sleep early. I didn't hear anything.",
        unlockedByClueId: CASE2_CLUES.tornNote,
        confrontText:
          "Your note: \"...the back gate... by midnight... don't let him see... HURRY!\" Explain.",
        confrontedAnswer:
          "Ah, sir, please don't tell Mama! My cousin came through the back gate to collect an advance on my salary. I didn't want the gateman to see and report me. That's all, I swear. It has nothing to do with the safe.",
      },
    ],
  },
  [CASE2_SUSPECTS.musa]: {
    openingLine:
      "Detective, my client has the money ready. This sale is happening tomorrow, deed or no deed.",
    questions: [
      {
        id: "musa-buyer",
        text: "Who is buying Plot 14?",
        defaultAnswer: "Greenfield Homes Limited. My client. Everything is above board.",
        unlockedByClueId: CASE2_CLUES.secondAgreement,
        confrontText: "There's a second agreement selling Plot 14 to a Chief R. Ibe.",
        confrontedAnswer:
          "Second agreement?! Who is Chief Ibe? Nobody told me anything about any Chief Ibe! If somebody has sold this land twice, heads will roll.",
      },
      {
        id: "musa-tonight",
        text: "Where were you tonight?",
        defaultAnswer: "At my office in Lekki till late, then home. My staff can confirm.",
      },
    ],
  },
};

// Test-only Case 99, for Vercel Preview builds with NEXT_PUBLIC_ENABLE_TEST_CASE=1.
if (process.env.NEXT_PUBLIC_ENABLE_TEST_CASE === "1") Object.assign(interrogations, case99Interrogations);
