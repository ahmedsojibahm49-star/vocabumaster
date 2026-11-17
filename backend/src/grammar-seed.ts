// Starter grammar lessons seeded once by importVocab. Admin can edit, add,
// or delete lessons from the admin panel afterwards. Body format:
// lines starting with "## " render as subheadings, "- " as bullets.

export interface GrammarSeed {
  titleBn: string;
  titleEn: string;
  category: string;
  level: string;
  summary: string;
  body: string;
}

export const GRAMMAR_LESSONS: GrammarSeed[] = [
  {
    titleBn: "বাক্য বানানোর মূল কাঠামো — Subject + Verb + Object",
    titleEn: "How to Build a Sentence (S + V + O)",
    category: "বাক্য গঠন",
    level: "A1",
    summary: "ইংরেজি বাক্যের প্রাণ হলো শব্দের ক্রম: কর্তা + ক্রিয়া + কর্ম। বাংলার সঙ্গে এই একটা পার্থক্য বুঝলেই নিজে নিজে হাজারো বাক্য বানাতে পারবে।",
    body: `## সবচেয়ে বড় পার্থক্যটা আগে বোঝো
বাংলায় আমরা বলি: আমি (কর্তা) ভাত (কর্ম) খাই (ক্রিয়া) — ক্রিয়া সবার শেষে। কিন্তু ইংরেজিতে ক্রিয়া মাঝখানে বসে: I (কর্তা) eat (ক্রিয়া) rice (কর্ম)। এই ক্রমটাই ইংরেজি বাক্যের প্রাণ।
## মূল সূত্র
- Subject + Verb + Object — Rahim reads a book. (রহিম বই পড়ে)
- Subject + Verb — Birds fly. (কর্ম লাগে না এমন verb-ও আছে)
- Subject + be verb + বর্ণনা — She is a teacher. / The sky is blue.
## ধাপে ধাপে বাক্য বানাও
- ধাপ ১: কে বা কী কাজটা করছে? — সেটাই Subject: I, you, he, she, we, they, Rahim, the cat
- ধাপ ২: সে কী করে? — সেটাই Verb: eat, read, play, speak, learn, watch
- ধাপ ৩: কার ওপর বা কীসের ওপর কাজটা পড়ে? — সেটাই Object: rice, a book, English
- ধাপ ৪ (চাইলে): কখন, কোথায় যোগ করো — every day, in the morning, at home
## একই কাঠামোতে দশটা বাক্য
- I learn English. — আমি ইংরেজি শিখি।
- She reads the newspaper. — সে পত্রিকা পড়ে।
- They play football. — তারা ফুটবল খেলে।
- We watch TV. — আমরা টিভি দেখি।
- He speaks Bangla. — সে বাংলা বলে।
## he/she/it হলে verb-এর শেষে s
- I read → He reads. I play → She plays. I watch → It watches.
- এই ছোট্ট s-টাই নবীনদের সবচেয়ে বেশি ভুল হয় — বাক্য বলার সময় খেয়াল রাখো।
## নিজে চেষ্টা করো
মনে মনে এই তিনটি বাক্য ইংরেজিতে বানাও: (১) আমি চা খাই। (২) তারা স্কুলে যায়। (৩) রহিম গান শোনে। উত্তর: I drink tea. They go to school. Rahim listens to music.`,
  },
  {
    titleBn: "Be verb দিয়ে বাক্য — am, is, are",
    titleEn: "Sentences with am / is / are",
    category: "বাক্য গঠন",
    level: "A1",
    summary: "কাজ না বুঝিয়ে শুধু 'কে কী' বা 'কেমন' বলতে be verb লাগে: I am, he is, they are। পরিচয়, পেশা, অবস্থা — সব এই এক কাঠামোতে।",
    body: `## কখন be verb লাগে
বাংলায় আমরা বলি "আমি ছাত্র" — মাঝখানে ক্রিয়া নেই। কিন্তু ইংরেজিতে ক্রিয়া ছাড়া বাক্য হয় না, তাই be verb (am/is/are) বসাতেই হয়: I am a student.
## কার সঙ্গে কোনটা
- I → am: I am happy. I am from Bangladesh.
- He / She / It → is: She is a doctor. It is hot today.
- You / We / They → are: We are friends. They are ready.
## কী কী বলা যায় এই কাঠামোতে
- পরিচয় ও পেশা: I am a student. He is a teacher.
- অবস্থা ও অনুভূতি: I am tired. She is hungry. We are happy.
- জায়গা: The book is on the table. They are at home.
- বর্ণনা: The tea is hot. This bag is heavy.
## না-বাচক: পেছনে শুধু not
- I am not late. He is not a farmer. They are not busy.
- সংক্ষেপ: isn't (is not), aren't (are not) — I'm not বলা যায়, কিন্তু amn't হয় না!
## প্রশ্ন: be verb-কে সামনে আনো
- Are you ready? Is she your sister? Where are you from?
- উত্তর ছোট করে: Yes, I am. / No, she isn't.
## সাধারণ ভুল
- I am agree ✗ → I agree ✓ (agree নিজেই verb, be লাগে না)
- She is teacher ✗ → She is a teacher ✓ (পেশার আগে a/an লাগে)`,
  },
  {
    titleBn: "প্রশ্ন করা — Yes/No প্রশ্ন ও Wh-প্রশ্ন",
    titleEn: "Asking Questions",
    category: "কথোপকথন",
    level: "A1",
    summary: "কথা বলতে হলে প্রশ্ন করতেই হয়। দুই ধরনের প্রশ্নের দুই কাঠামো: হ্যাঁ/না উত্তরের জন্য সহায়ক verb সামনে, তথ্য জানতে Wh-শব্দ সবার আগে।",
    body: `## ধরন ১: Yes/No প্রশ্ন — সহায়ক verb সামনে
- Do you speak English? — তুমি কি ইংরেজি বলতে পারো?
- Does he live in Dhaka? — সে কি ঢাকায় থাকে? (he/she/it হলে does)
- Are you a student? — be verb থাকলে সেটাই সামনে আসে
- Can you help me? — modal থাকলে modal সামনে
- উত্তর: Yes, I do. / No, I don't. — শুধু Yes বললেও চলে, তবে ছোট উত্তরটাই স্বাভাবিক।
## ধরন ২: Wh-প্রশ্ন — তথ্য জানতে
- What (কী): What is your name? What do you do?
- Where (কোথায়): Where do you live? Where is the station?
- When (কখন): When does the class start?
- Why (কেন): Why are you late?
- Who (কে): Who is he? Who teaches you English?
- How (কেমন/কীভাবে): How are you? How do you go to school?
- How many / How much (কত): How many brothers do you have? How much is this?
## Wh-প্রশ্নের সূত্র
Wh-শব্দ + do/does/is/are + subject + মূল verb — Where + do + you + live?
## সাধারণ ভুল
- Where you live? ✗ → Where do you live? ✓ (do লাগবেই)
- Does she likes tea? ✗ → Does she like tea? ✓ (does এলে verb-এর s চলে যায়)
- What your name? ✗ → What is your name? ✓`,
  },
  {
    titleBn: "নিজের পরিচয় — Self Introduction",
    titleEn: "Introducing Yourself",
    category: "কথোপকথন",
    level: "A1",
    summary: "নিজের সম্পর্কে ৮-১০টা বাক্য তৈরি থাকলে যেকোনো জায়গায় আত্মবিশ্বাস নিয়ে কথা শুরু করা যায়। এই টেমপ্লেটে নিজের তথ্য বসালেই তোমার পরিচিতি তৈরি।",
    body: `## পরিচিতির কাঠামো (এই ক্রমে বলো)
- নাম: My name is Rahim. / I am Rahim.
- কোথা থেকে: I am from Cumilla, Bangladesh. I live in Dhaka now.
- পেশা/পড়াশোনা: I am a student. I study at a local college. / I work in a garment factory.
- পরিবার: I have two brothers and one sister.
- পছন্দ: I like reading books and playing football.
- লক্ষ্য: I want to learn English because I want a better job. / I am learning English to speak with confidence.
## পুরো একটা নমুনা
My name is Rahim. I am from Cumilla, but I live in Dhaka now. I am a student. I have one brother and one sister. In my free time, I like reading and playing cricket. I am learning English because I want to get a good job and speak with confidence.
## টিপস
- মুখস্থ করে ফেলো না — টেমপ্লেটটা শিখে নিজের আসল তথ্য বসাও, তাহলেই মনে থাকবে।
- প্রতিদিন আয়নার সামনে বা ফোনে রেকর্ড করে ২ মিনিট বলার অভ্যাস করো।
- লজ্জা পেয়ে থেমে যেও না — ভুল করলেও বাক্য শেষ করো, এটাই স্পোকেন শেখার আসল নিয়ম।`,
  },
  {
    titleBn: "Have / Has — কার কী আছে",
    titleEn: "Have / Has Sentences",
    category: "বাক্য গঠন",
    level: "A2",
    summary: "'আমার আছে' বলতে I have, 'তার আছে' বলতে he has। মালিকানা, পরিবার, সময়, অসুখ — প্রতিদিনের অনেক বাক্য এই এক কাঠামোতে।",
    body: `## মূল কাঠামো
- I / You / We / They + have: I have a bicycle. We have a small house.
- He / She / It + has: She has a new phone. He has two sisters.
## যা যা বলা যায়
- জিনিস: I have a question. Do you have a pen?
- পরিবার ও সম্পর্ক: They have three children.
- সময়: We have no time. I have ten minutes.
- শরীর ও অসুখ: I have a headache. She has a cold.
- খাওয়া (বিশেষ অর্থে): We have breakfast at 7. (এখানে have মানে খাই)
## প্রশ্ন ও না-বাচক
- Do you have a car? — Yes, I do. / No, I don't.
- He does not (doesn't) have a bike.
- খেয়াল করো: has দিয়ে প্রশ্ন হয় না — Does he have...? (have ফিরে আসে)
## সাধারণ ভুল
- She have a bag ✗ → She has a bag ✓
- I am have a book ✗ → I have a book ✓ (be verb লাগে না)`,
  },
  {
    titleBn: "বাক্য বড় করা — শব্দ যোগ করে সমৃদ্ধ বাক্য",
    titleEn: "Expanding Sentences",
    category: "বাক্য গঠন",
    level: "A2",
    summary: "ছোট বাক্যে থেমে না থেকে একে একে adjective, adverb, সময়, জায়গা আর কারণ যোগ করলেই বাক্য পরিণত হয়। স্পোকেনে সাবলীল হওয়ার এটাই সিঁড়ি।",
    body: `## ভিত্তি বাক্য থেকে শুরু
He reads a book. — শুধু এইটুকুই যথেষ্ট সঠিক বাক্য। এখন একে একে রঙ যোগ করি।
## ধাপে ধাপে বড় করো
- Adjective যোগ (কেমন?): He reads an interesting book.
- Adverb যোগ (কীভাবে?): He reads an interesting book carefully.
- সময় যোগ (কখন?): He reads an interesting book carefully every night.
- জায়গা যোগ (কোথায়?): He reads an interesting book carefully every night in his room.
- কারণ যোগ (কেন?) — because দিয়ে: He reads an interesting book carefully every night in his room because he loves stories.
## জোড়া দেওয়ার শব্দ
- and — আরও যোগ: I bought a pen and a notebook.
- but — বিপরীত: It is cheap but useful.
- so — ফলাফল: I was tired, so I went to bed early.
- because — কারণ: I learn English because I need it for my job.
- then / after that — ধারাবাহিকতা: First I wash my hands, then I eat.
## অনুশীলনের নিয়ম
যেকোনো ছোট বাক্য নাও — যেমন I drink tea. এবার নিজে যোগ করো: কেমন চা (hot), কখন (in the morning), কোথায় (at home), কার সঙ্গে (with my family)। তৈরি হলো: I drink hot tea in the morning at home with my family.`,
  },
  {
    titleBn: "প্রতিদিনের জরুরি বাক্য — Daily Use Sentences",
    titleEn: "Daily Use Sentences",
    category: "কথোপকথন",
    level: "A1",
    summary: "শুভেচ্ছা, অনুরোধ, ধন্যবাদ, বিদায় — প্রতিদিনের জীবনে সবচেয়ে বেশি লাগে এমন বাক্যগুলো এক জায়গায়। এগুলো মুখস্থ করে আজ থেকেই ব্যবহার শুরু করো।",
    body: `## শুভেচ্ছা ও খোঁজখবর
- Good morning / Good evening. — শুভ সকাল / শুভ সন্ধ্যা।
- How are you? — I am fine, thank you. And you?
- Long time no see! — অনেকদিন দেখা নেই!
- Take care. — নিজের যত্ন নিও।
## অনুরোধ (ভদ্রভাবে)
- Please help me. — দয়া করে আমাকে সাহায্য করুন।
- Can you repeat that, please? — আরেকবার বলবেন?
- Could you speak slowly? — আস্তে বলবেন কি?
- Excuse me, where is the bank? — মাফ করবেন, ব্যাংকটা কোথায়?
## ধন্যবাদ ও জবাব
- Thank you very much. — অনেক ধন্যবাদ। → You are welcome.
- Thanks for your help. — সাহায্যের জন্য ধন্যবাদ।
- No problem. — কোনো সমস্যা নেই।
## রাজি হওয়া / না বলা
- Yes, of course. — হ্যাঁ, অবশ্যই।
- I am sorry, I can't. — দুঃখিত, আমি পারব না।
- I don't understand. — আমি বুঝতে পারিনি।
- I don't know. — আমি জানি না।
## বিদায়
- See you tomorrow. — আগামীকাল দেখা হবে।
- Have a nice day! — দিনটা ভালো কাটুক!
- Good night. — শুভ রাত্রি। (ঘুমাতে যাওয়ার সময়)
## ব্যবহারের টিপস
এই বাক্যগুলো শুধু পড়লে হবে না — প্রতিদিন অন্তত ৫টা আসল জীবনে ব্যবহার করো: দোকানে, বাসে, বন্ধুর সঙ্গে। ব্যবহার করলেই মুখে চলে আসবে।`,
  },
  {
    titleBn: "বাক্যের অংশ — Parts of Speech",
    titleEn: "Parts of Speech",
    category: "ভিত্তি",
    level: "A1",
    summary: "ইংরেজির প্রতিটি শব্দ ৮টি শ্রেণির কোনো না কোনোটিতে পড়ে। এই ৮টি চিনলেই বাক্য গঠনের অর্ধেক কাজ শেষ।",
    body: `ইংরেজি বাক্যের প্রতিটি শব্দকে তার কাজ অনুযায়ী ৮ ভাগে ভাগ করা হয়। এগুলো চেনা থাকলে যেকোনো বাক্য ভেঙে বোঝা সহজ হয়।
## ৮টি Parts of Speech
- Noun (বিশেষ্য) — কোনো কিছুর নাম: Dhaka, book, Rahim, honesty
- Pronoun (সর্বনাম) — নামের বদলে বসে: I, you, he, she, it, they
- Verb (ক্রিয়া) — কাজ বা অবস্থা বোঝায়: eat, run, is, have
- Adjective (বিশেষণ) — noun-এর গুণ বোঝায়: big, honest, three
- Adverb (ক্রিয়া-বিশেষণ) — verb-এর ধরন বোঝায়: quickly, very, yesterday
- Preposition (অনুসর্গ) — সম্পর্ক বোঝায়: in, on, at, under, with
- Conjunction (সংযোজক) — শব্দ বা বাক্য জোড়ে: and, but, because, if
- Interjection (আবেগসূচক) — হঠাৎ আবেগ: Wow! Oh! Alas!
## উদাহরণ দিয়ে চেনা
- Rahim (noun) reads (verb) a good (adjective) book (noun) quickly (adverb).
- She (pronoun) is happy (adjective) because (conjunction) she passed.
## মনে রাখো
একই শব্দ ভিন্ন বাক্যে ভিন্ন part of speech হতে পারে। যেমন: "Water the plants" — এখানে water হলো verb; "Drink water" — এখানে water হলো noun। শব্দ নয়, বাক্যে তার কাজটাই আসল।`,
  },
  {
    titleBn: "Present Simple — প্রতিদিনের কাজ",
    titleEn: "Present Simple Tense",
    category: "Tense",
    level: "A1",
    summary: "অভ্যাস, রুটিন আর চিরসত্য ঘটনা বলতে Present Simple। গঠন: Subject + V1, he/she/it হলে verb-এর শেষে s/es।",
    body: `## কখন ব্যবহার হয়
- প্রতিদিনের অভ্যাস বা রুটিন: I go to school every day.
- চিরসত্য বা সাধারণ সত্য: The sun rises in the east.
- নিয়মিত ঘটনা: The bus leaves at 8 am.
## গঠন
- I / You / We / They + V1: They play football.
- He / She / It + V1 + s/es: She plays football. He watches TV.
## s নাকি es?
- বেশিরভাগ verb-এর শেষে শুধু s: play → plays, read → reads
- শেষে s, ss, sh, ch, x, o থাকলে es: watch → watches, go → goes
- শেষে consonant + y থাকলে y → ies: study → studies (কিন্তু vowel + y হলে শুধু s: play → plays)
## না-বাচক ও প্রশ্ন
- না: do not / does not + V1 — She does not (doesn't) like tea. খেয়াল করো, does আসলে verb-এর s চলে যায়।
- প্রশ্ন: Do you speak English? Does he live in Dhaka?
## সাধারণ ভুল
- He don't ✗ → He doesn't ✓
- She plays সুন্দর করে বলতে গিয়ে "She playes" ✗ → She plays ✓`,
  },
  {
    titleBn: "Present Continuous — এখন হচ্ছে",
    titleEn: "Present Continuous Tense",
    category: "Tense",
    level: "A1",
    summary: "ঠিক এই মুহূর্তে চলমান কাজ: Subject + am/is/are + V-ing। now, right now, at the moment দেখলেই এই tense।",
    body: `## কখন ব্যবহার হয়
- কথা বলার মুহূর্তে চলছে: I am reading now.
- সাময়িক অবস্থা: She is staying with her aunt this week.
- বদলে যাওয়া অবস্থা: The weather is getting colder.
## গঠন
- I + am, He/She/It + is, You/We/They + are — তারপর verb + ing
- I am writing. They are playing. The baby is crying.
## ing যোগের নিয়ম
- সাধারণত শুধু ing: read → reading, play → playing
- শেষে নিঃশব্দ e থাকলে e বাদ: make → making, write → writing
- ছোট verb-এ শেষের consonant দ্বিগুণ: run → running, sit → sitting, swim → swimming
- শেষে ie থাকলে ie → y: lie → lying, die → dying
## না-বাচক ও প্রশ্ন
- না: am/is/are + not — He is not sleeping.
- প্রশ্ন: Are you listening? What is she doing?
## সাধারণ ভুল
- I am agree ✗ (agree এখানে state verb) → I agree ✓
- He is goes ✗ → He is going ✓`,
  },
  {
    titleBn: "Past Simple — শেষ হয়ে যাওয়া কাজ",
    titleEn: "Past Simple Tense",
    category: "Tense",
    level: "A2",
    summary: "অতীতে নির্দিষ্ট সময়ে শেষ হওয়া কাজ: Subject + V2। yesterday, last night, ago দেখলেই Past Simple।",
    body: `## কখন ব্যবহার হয়
- অতীতে শেষ হওয়া নির্দিষ্ট কাজ: I visited Cox's Bazar last year.
- অতীতের অভ্যাস: We played cricket every Friday. (এখন আর নয়)
## গঠন
- সব subject-এর জন্য একই: Subject + V2
- Regular verb: V1 + ed — walk → walked, watch → watched
- Irregular verb মুখস্থ করতে হয়: go → went, eat → ate, see → saw, buy → bought, teach → taught
## ed যোগের খুঁটিনাটি
- শেষে e থাকলে শুধু d: live → lived
- consonant + y → ied: study → studied
- ছোট verb-এ consonant দ্বিগুণ: stop → stopped, plan → planned
## না-বাচক ও প্রশ্নে did
- না: did not (didn't) + V1 — I didn't go. (went নয়, go!)
- প্রশ্ন: Did you see the match? — উত্তরেও V1: Yes, I did.
## সময়ের সংকেত
yesterday, last week/month/year, two days ago, in 2010 — এগুলো থাকলে প্রায় নিশ্চিত Past Simple।`,
  },
  {
    titleBn: "Present Perfect — হয়ে আছে / এইমাত্র হলো",
    titleEn: "Present Perfect Tense",
    category: "Tense",
    level: "A2",
    summary: "অতীতে শুরু, কিন্তু ফলাফল এখনো বর্তমান: have/has + V3। already, just, ever, never, since, for — এই tense-এর বন্ধু।",
    body: `## কখন ব্যবহার হয়
- এইমাত্র শেষ, ফল এখনো আছে: I have just finished my homework.
- জীবনের অভিজ্ঞতা (সময় নির্দিষ্ট নয়): Have you ever been to Sylhet?
- অতীতে শুরু হয়ে এখনো চলছে: She has lived here since 2015.
## গঠন
- I/You/We/They + have + V3; He/She/It + has + V3
- V3 (past participle): go → gone, eat → eaten, write → written, see → seen
## since বনাম for
- since + শুরুর মুহূর্ত: since Monday, since 2020, since morning
- for + সময়ের দৈর্ঘ্য: for three years, for two hours, for a long time
## Past Simple থেকে পার্থক্য
- নির্দিষ্ট অতীত সময় (yesterday, last night) থাকলে Past Simple: I saw him yesterday.
- সময় অনির্দিষ্ট বা ফলাফল এখন গুরুত্বপূর্ণ হলে Present Perfect: I have lost my key. (এখনো পাইনি — ফলাফল বর্তমান)
## সাধারণ ভুল
- I have seen him yesterday ✗ → I saw him yesterday ✓
- She has went ✗ → She has gone ✓`,
  },
  {
    titleBn: "ভবিষ্যৎ — will বনাম going to",
    titleEn: "Future: will vs going to",
    category: "Tense",
    level: "A2",
    summary: "দুটোই ভবিষ্যৎ, কিন্তু ব্যবহার আলাদা: হঠাৎ সিদ্ধান্তে will, আগে থেকে ঠিক করা পরিকল্পনায় going to।",
    body: `## will — কখন
- কথা বলার মুহূর্তে নেওয়া সিদ্ধান্ত: The phone is ringing — I'll get it!
- প্রতিশ্রুতি ও প্রস্তাব: I will help you. I'll carry your bag.
- ধারণা বা ভবিষ্যদ্বাণী (নিজের মত): I think it will rain.
## going to — কখন
- আগে থেকে ঠিক করা পরিকল্পনা: We are going to visit Sajek next month. (টিকিট কাটা হয়ে গেছে)
- চোখে দেখা লক্ষণ থেকে অনুমান: Look at the clouds! It is going to rain.
## গঠন
- will + V1 (সবার জন্য একই): She will come. They will win.
- am/is/are + going to + V1: I am going to study tonight.
## Present Continuous দিয়েও ভবিষ্যৎ
নিশ্চিত ব্যবস্থা (appointment) বোঝাতে: I am meeting the doctor at 5 pm tomorrow.
## সাধারণ ভুল
- I will to go ✗ → I will go ✓
- Tomorrow I go to Dhaka (শুধু routine হলে ঠিক) — পরিকল্পনা হলে: I am going to Dhaka tomorrow ✓`,
  },
  {
    titleBn: "Articles — a, an, the",
    titleEn: "Articles: a, an, the",
    category: "ব্যাকরণের ভিত্তি",
    level: "A2",
    summary: "বাংলায় article নেই বলেই এটা সবচেয়ে বেশি ভুল হয়। নিয়মটা সহজ: অনির্দিষ্ট একটায় a/an, নির্দিষ্টটায় the।",
    body: `## a বনাম an — শব্দ নয়, উচ্চারণ
- consonant ধ্বনি দিয়ে শুরু হলে a: a book, a university (উচ্চারণ "ইউ" — consonant ধ্বনি!)
- vowel ধ্বনি দিয়ে শুরু হলে an: an apple, an hour (h নিঃশব্দ, উচ্চারণ "আওয়ার")
## a/an কখন
- প্রথমবার উল্লেখ, যেকোনো একটা: I saw a cat. (কোন বিড়াল নির্দিষ্ট নয়)
- পেশা: He is a teacher. She is an engineer.
## the কখন
- দুজনেই জানে কোনটা: Pass me the salt. (টেবিলের ওই লবণটাই)
- দ্বিতীয়বার উল্লেখ: I saw a cat. The cat was black.
- পৃথিবীতে একটাই: the sun, the moon, the sky
- নদী, সাগর, বিখ্যাত জায়গা: the Padma, the Bay of Bengal
## article লাগে না কখন
- খেলার নাম: I play cricket. (the cricket ✗)
- ভাষা ও বিষয়: English, mathematics
- সাধারণ অর্থে plural/uncountable: Books are useful. Water is life.
## সাধারণ ভুল
- He is a honest man ✗ → He is an honest man ✓ (honest-এর h নিঃশব্দ)`,
  },
  {
    titleBn: "Preposition — in, on, at ঠিকঠাক",
    titleEn: "Prepositions of Time & Place",
    category: "ব্যাকরণের ভিত্তি",
    level: "A2",
    summary: "সময়ের জন্য: বড় সময়ে in, দিনে on, ঘড়ির সময়ে at। জায়গার জন্যও একই ধারাবাহিকতা — বড় থেকে ছোট।",
    body: `## সময়ের ক্ষেত্রে
- at — নির্দিষ্ট ঘণ্টা ও মুহূর্ত: at 5 pm, at noon, at night, at the moment
- on — দিন ও তারিখ: on Friday, on 16 December, on my birthday
- in — মাস, বছর, ঋতু, দিনের অংশ: in June, in 2026, in winter, in the morning
## মনে রাখার ছক
বড় সময় → in (বছর, মাস) → মাঝারি → on (দিন, তারিখ) → ছোট/নির্দিষ্ট → at (ঘণ্টা)। ব্যতিক্রম: at night, কিন্তু in the morning/evening।
## জায়গার ক্ষেত্রে
- at — নির্দিষ্ট বিন্দু: at the door, at home, at school
- on — কোনো কিছুর উপরে/গায়ে লেগে: on the table, on the wall, on the bus
- in — ভেতরে/এলাকাজুড়ে: in the room, in Dhaka, in Bangladesh
## যানবাহন
- by + যান: by bus, by train (article নেই)
- on foot — হেঁটে (by foot ✗)
## সাধারণ ভুল
- in Monday ✗ → on Monday ✓
- at morning ✗ → in the morning ✓
- He is in home ✗ → He is at home ✓`,
  },
  {
    titleBn: "Subject–Verb Agreement — কর্তা অনুযায়ী ক্রিয়া",
    titleEn: "Subject–Verb Agreement",
    category: "ব্যাকরণের ভিত্তি",
    level: "B1",
    summary: "Singular subject হলে singular verb, plural হলে plural। মাঝখানের শব্দে ধোঁকা খাওয়া যাবে না — আসল subject খুঁজে বের করো।",
    body: `## মূল নিয়ম
- Singular subject + singular verb: The boy runs. The water is cold.
- Plural subject + plural verb: The boys run. The students are ready.
## যেখানে সবাই ভুল করে
- মাঝখানে plural শব্দ থাকলেও verb ঠিক হয় আসল subject দিয়ে: The quality of the mangoes is good. (subject = quality, একবচন)
- each, every, everyone, somebody, nobody — সবসময় singular: Everyone is present. Each student has a book.
- দুটো subject and দিয়ে জোড়া হলে plural: Rahim and Karim are friends.
- or/nor থাকলে কাছের subject অনুযায়ী: Neither the teacher nor the students were there. / Neither the students nor the teacher was there.
## uncountable noun সবসময় singular
- Information, advice, furniture, news: The news is good. (news দেখতে plural, আসলে singular)
## সাধারণ ভুল
- The list of items are long ✗ → The list of items is long ✓
- Every students ✗ → Every student ✓`,
  },
  {
    titleBn: "Conditionals — if দিয়ে শর্ত",
    titleEn: "Conditionals (if sentences)",
    category: "বাক্য গঠন",
    level: "B1",
    summary: "শর্তের বাক্যের ৪টি ধরন। কোনটা বাস্তব, কোনটা কল্পনা — tense-এর জুটি দেখেই বোঝা যায়।",
    body: `## Zero Conditional — চিরসত্য
- গঠন: If + present simple, present simple
- If you heat ice, it melts. (সবসময় সত্য)
## First Conditional — বাস্তব সম্ভাবনা
- গঠন: If + present simple, will + V1
- If it rains tomorrow, we will stay home.
- খেয়াল করো: if-অংশে will বসে না — If it will rain ✗
## Second Conditional — অবাস্তব কল্পনা (বর্তমান)
- গঠন: If + past simple, would + V1
- If I were rich, I would travel the world. (আমি ধনী নই — কল্পনা)
- be verb সবসময় were: If I were you, I would apologise.
## Third Conditional — অতীতের আফসোস
- গঠন: If + past perfect (had + V3), would have + V3
- If you had studied, you would have passed. (পড়োনি, পাসও করোনি)
## মনে রাখার কৌশল
যত পেছনের (past) tense, তত অবাস্তব কথা। Present = বাস্তব, Past = কল্পনা, Past Perfect = অতীতের হারানো সুযোগ।`,
  },
  {
    titleBn: "Passive Voice — কর্মবাচ্য",
    titleEn: "Passive Voice",
    category: "বাক্য গঠন",
    level: "B1",
    summary: "কে করেছে তার চেয়ে কাজটা গুরুত্বপূর্ণ হলে passive। গঠন: be + V3 — tense বদলায় be-র রূপে, V3 সবসময় একই।",
    body: `## কখন passive ব্যবহার হয়
- কর্তা অজানা: My phone was stolen. (কে নিয়েছে জানি না)
- কর্তার চেয়ে কাজ গুরুত্বপূর্ণ: Rice is grown in Bangladesh.
- আনুষ্ঠানিক/সংবাদ ভাষা: The bridge was opened in 2022.
## tense অনুযায়ী রূপ
- Present simple: is/are + V3 — English is spoken here.
- Past simple: was/were + V3 — The letter was sent yesterday.
- Present perfect: has/have been + V3 — The work has been done.
- Future: will be + V3 — The results will be published soon.
- Modal: can/must be + V3 — It must be finished today.
## বদলানোর ধাপ
- Object-কে সামনে আনো → tense অনুযায়ী be বসাও → মূল verb-এর V3 → চাইলে by + subject
- Active: Rahim wrote the letter. → Passive: The letter was written by Rahim.
## সাধারণ ভুল
- The work was did ✗ → The work was done ✓
- It is call ✗ → It is called ✓ (V3 লাগবেই)`,
  },
  {
    titleBn: "Modals — can, should, must, might",
    titleEn: "Modal Verbs",
    category: "ব্যাকরণের ভিত্তি",
    level: "B1",
    summary: "Modal verb-এর পর সবসময় V1 বসে — s, ed, to কিছুই যোগ হয় না। অর্থের সূক্ষ্ম পার্থক্যটাই আসল খেলা।",
    body: `## প্রধান modal গুলো
- can — সামর্থ্য/অনুমতি: I can swim. Can I go?
- could — অতীতের সামর্থ্য / ভদ্র অনুরোধ: I could read at five. Could you help me?
- may — সম্ভাবনা/আনুষ্ঠানিক অনুমতি: It may rain. May I come in?
- might — দুর্বল সম্ভাবনা: He might come. (আসতেও পারে, নাও পারে)
- must — বাধ্যবাধকতা/জোরালো অনুমান: You must wear a seatbelt. He must be tired.
- should — পরামর্শ: You should practise daily.
- will/would — ভবিষ্যৎ/ভদ্র প্রস্তাব: Would you like some tea?
## অপরিবর্তনীয় নিয়ম
- modal + V1 সবসময়: She can speaks ✗ → She can speak ✓
- to বসে না: must to go ✗ → must go ✓ (ব্যতিক্রম: ought to, have to)
- না করতে not যোগ হয়: cannot (এক শব্দ!), could not, should not
## mustn't বনাম don't have to — বড় পার্থক্য
- mustn't = করা যাবে না (নিষেধ): You mustn't smoke here.
- don't have to = না করলেও চলে (বাধ্য নই): You don't have to come early tomorrow.`,
  },
  {
    titleBn: "বাক্যের প্রকার — Simple, Complex, Compound",
    titleEn: "Sentence Types",
    category: "বাক্য গঠন",
    level: "B2",
    summary: "Clause গুনলেই বাক্যের প্রকার বোঝা যায়: একটা স্বাধীন clause = simple, and/but/or দিয়ে জোড়া = compound, because/if/when থাকলে complex।",
    body: `## Clause কী
যে শব্দগুচ্ছে subject + verb আছে, তাই clause। স্বাধীন clause একা দাঁড়াতে পারে; অধীন clause (because, if, when দিয়ে শুরু) পারে না।
## Simple Sentence — একটি স্বাধীন clause
- Rahim reads books every night.
- লম্বা হলেও simple হতে পারে: The young boy in the blue shirt near the gate is my cousin. (clause একটাই)
## Compound Sentence — স্বাধীন clause + স্বাধীন clause
- যোগ হয় and, but, or, so দিয়ে: I called him, but he did not answer.
- দুই পাশেই পূর্ণ বাক্য — মাঝখানে শুধু সংযোজক।
## Complex Sentence — স্বাধীন + অধীন clause
- Because it was raining, we stayed home.
- I know that he is honest. / The book which you gave me is lost.
- অধীন clause শুরু হয়: because, if, when, although, that, which, who, since দিয়ে
## লেখা ভালো করার টিপস
একটানা সব simple বাক্য লিখলে লেখা শিশুসুলভ শোনায়। ছোট বাক্যের ফাঁকে ফাঁকে একটা compound বা complex বাক্য মেশাও — লেখা পরিণত হবে, IELTS Writing-এ band-ও বাড়বে।`,
  },
  {
    titleBn: "না-বোধক বাক্য — don't, doesn't, didn't, isn't",
    titleEn: "Negative Sentences",
    category: "বাক্য গঠন",
    level: "A1",
    summary: "'না' বলাটা ইংরেজিতে আলাদা কায়দা: be verb থাকলে not সরাসরি যোগ হয়, সাধারণ verb থাকলে do/does/did এসে not নেয় — আর মূল verb ফিরে যায় V1-এ।",
    body: `## দুটো আলাদা রাস্তা
ইংরেজিতে 'না' বলার পদ্ধতি নির্ভর করে বাক্যে be verb (am/is/are/was/were) আছে কিনা তার ওপর।
## be verb থাকলে — সরাসরি not
- I am happy. → I am not happy.
- She is a teacher. → She is not a teacher. (সংক্ষেপে: She isn't a teacher.)
- They were late. → They were not late.
## সাধারণ verb থাকলে — do/does/did + not
- বর্তমানে I/you/we/they → do not (don't): I don't like tea.
- বর্তমানে he/she/it → does not (doesn't): He doesn't like tea.
- অতীতে সবার জন্য → did not (didn't): We didn't go yesterday.
## সবচেয়ে বড় নিয়ম: not এলে মূল verb V1 হয়
- He doesn't likes ✗ → He doesn't like ✓ (s-টা doesn't-এর মধ্যেই চলে গেছে)
- She didn't went ✗ → She didn't go ✓ (অতীতের ভাবটা didn't-ই বহন করে)
- কারণ: এক বাক্যে সময়ের চিহ্ন একবারই বসে — সাহায্যকারী verb-তে।
## can/modal থাকলে
- I cannot (can't) swim. / You should not (shouldn't) shout.
## নিজে চেষ্টা করো
এগুলো না-বোধক করো: (১) I speak English. (২) She reads books. (৩) They played football. উত্তর: I don't speak English. She doesn't read books. They didn't play football.`,
  },
  {
    titleBn: "আছে বলা — There is / There are",
    titleEn: "There is / There are",
    category: "বাক্য গঠন",
    level: "A1",
    summary: "কোথাও কিছু 'আছে' বলতে There is (একটি) আর There are (অনেকগুলো) — বাংলার 'আছে' শব্দটা বাক্যের শেষে থাকে, ইংরেজিতে There সবার আগে আসে।",
    body: `## কাঠামো
- There is + একটি জিনিস + জায়গা: There is a book on the table.
- There are + অনেকগুলো + জায়গা: There are many students in the class.
- এখানে There-এর আলাদা অর্থ নেই — এটা শুধু বাক্য শুরু করার ভঙ্গি।
## প্রশ্ন করা
- Is there a bank near here? — Yes, there is. / No, there isn't.
- Are there any shops open? — Yes, there are.
## না-বোধক
- There is no milk in the fridge. / There isn't any milk.
- There are no buses today.
## সময়ের সঙ্গে বদলায়
- অতীত: There was a king. / There were many people.
- ভবিষ্যৎ: There will be a meeting tomorrow.
## সাধারণ ভুল
- In the room has a table ✗ → There is a table in the room ✓ (বাংলা 'আছে'-কে has দিয়ে বলা যাবে না)
- There is many people ✗ → There are many people ✓
## প্রতিদিনের বাক্য
- There is a problem. — একটা সমস্যা আছে।
- There is no time. — সময় নেই।
- There are two ways. — দুটো উপায় আছে।`,
  },
  {
    titleBn: "আদেশ, অনুরোধ আর নিষেধ — Imperative বাক্য",
    titleEn: "Imperative Sentences",
    category: "বাক্য গঠন",
    level: "A1",
    summary: "কাউকে কিছু করতে বললে subject লাগে না — সরাসরি verb দিয়ে শুরু: Sit down. ভদ্র করতে please যোগ করলেই হয়, আর নিষেধে Don't।",
    body: `## মূল কাঠামো: শুধু verb
- Open the door. — দরজাটা খোলো।
- Listen to me. — আমার কথা শোনো।
- Be careful! — সাবধান!
- subject (you) বলা হয় না — শুনলেই বোঝা যায় কাকে বলা হচ্ছে।
## ভদ্রভাবে বলা
- Please sit down. / Sit down, please.
- Could you open the window? (অনুরোধের প্রশ্ন — আরও ভদ্র)
- বন্ধুদের মধ্যে শুধু verb-ই যথেষ্ট; বড়দের ক্ষেত্রে please/Could you ব্যবহার করো।
## নিষেধ করা — Don't
- Don't shout. — চিৎকার করো না।
- Don't be late. — দেরি করো না।
- Never give up. — কখনো হাল ছেড়ো না।
## পরামর্শ ও নির্দেশনা
- রাস্তা বলতে: Go straight, then turn left.
- রান্নায়: First, wash the rice. Then boil the water.
- ডাক্তারের পরামর্শ: Take this medicine twice a day.
## Let's দিয়ে প্রস্তাব
- Let's go. — চলো যাই।
- Let's practise English. — চলো ইংরেজি অনুশীলন করি।
- Let's not waste time. — চলো সময় নষ্ট না করি।`,
  },
  {
    titleBn: "সর্বনাম — I, me, my, mine ঠিকঠাক ব্যবহার",
    titleEn: "Pronouns (I / me / my / mine)",
    category: "ভিত্তি",
    level: "A1",
    summary: "একই মানুষের জন্য চার রকম শব্দ: কর্তা হলে I, কর্ম হলে me, 'আমার' হলে my, আর 'আমারটা' হলে mine। জায়গা অনুযায়ী রূপ বদলায় — এটাই নিয়ম।",
    body: `## পুরো ছকটা এক নজরে
- I — me — my — mine — myself (আমি, আমাকে, আমার, আমারটা, নিজে)
- you — you — your — yours — yourself
- he — him — his — his — himself
- she — her — her — hers — herself
- it — it — its — — itself
- we — us — our — ours — ourselves
- they — them — their — theirs — themselves
## কোনটা কোথায় বসে
- কর্তা (subject) হলে প্রথমটা: I love English. She helps me.
- কর্ম (object) হলে দ্বিতীয়টা: Help me. I saw him. Give it to us.
- noun-এর আগে 'কার' বোঝালে তৃতীয়টা: This is my book. Her bag is new.
- noun ছাড়াই 'কারটা' বোঝালে চতুর্থটা: This book is mine. Yours is bigger.
## সাধারণ ভুল
- Me and Rahim went ✗ → Rahim and I went ✓ (কর্তা হলে I, আর অন্যকে আগে বলা ভদ্রতা)
- This is mine book ✗ → This is my book ✓ (noun থাকলে my)
- Its raining ✗ → It's raining ✓ (its = এর/এটার, it's = it is)
## অনুশীলন
শূন্যস্থান পূরণ করো: (১) ___ am a student. (২) This pen is ___ (আমারটা). (৩) She called ___ (আমাকে). উত্তর: I, mine, me.`,
  },
  {
    titleBn: "শুভেচ্ছা ও ছোটখাটো কথাবার্তা — Greetings & Small Talk",
    titleEn: "Greetings & Small Talk",
    category: "কথোপকথন",
    level: "A1",
    summary: "ইংরেজি কথোপকথন শুরু হয় ছোট ছোট ভদ্র বাক্য দিয়ে: কেমন আছ, দিনটা কেমন যাচ্ছে, আবহাওয়া কেমন — এই প্যাটার্নগুলো মুখস্থ থাকলেই কথা শুরু করা সহজ।",
    body: `## দেখা হলে
- Good morning / Good afternoon / Good evening. (রাতে বিদায়ের সময় Good night)
- Hello! How are you? — I'm fine, thank you. And you?
- How is it going? — Pretty good. / Not bad.
- Long time no see! — অনেকদিন পর দেখা!
## পরিচয়ের পর
- Nice to meet you. — আপনার সঙ্গে পরিচিত হয়ে খুশি হলাম। (উত্তর: Nice to meet you too.)
- Where are you from? — I'm from Dhaka.
- What do you do? — I'm a student. (পেশা জানতে চাওয়া)
## Small talk — কথা চালিয়ে যাওয়া
- আবহাওয়া: It's a beautiful day, isn't it? / It's so hot today!
- খোঁজখবর: How is your family? / How was your day?
- সপ্তাহান্ত: Did you have a good weekend?
## বিদায় নেওয়া
- See you later. / See you tomorrow.
- Take care. — নিজের খেয়াল রেখো।
- Have a nice day! — দিনটা ভালো কাটুক!
- I have to go now. — আমাকে এখন যেতে হবে।
## মনে রাখো
Small talk-এ গভীর উত্তর লাগে না — এক লাইনের উত্তর আর পাল্টা একটা প্রশ্ন, এতেই কথোপকথন এগিয়ে যায়। থেমে যাওয়ার ভয় পেয়ো না; হাসিমুখে এই বাক্যগুলোই যথেষ্ট।`,
  },
  {
    titleBn: "Past Continuous — অতীতে চলছিল (was/were + -ing)",
    titleEn: "Past Continuous Tense",
    category: "Tense",
    level: "A2",
    summary: "অতীতের কোনো নির্দিষ্ট মুহূর্তে কাজটা চলছিল বোঝাতে was/were + verb-ing। গল্প বলার সময় পটভূমি তৈরি করতে এটাই সবচেয়ে কাজের tense।",
    body: `## কাঠামো
- I / he / she / it → was + verb-ing: I was sleeping at 10 pm.
- you / we / they → were + verb-ing: They were playing.
- না: was not (wasn't) / were not (weren't): She wasn't listening.
- প্রশ্ন: Were you sleeping? — Yes, I was.
## কখন ব্যবহার করবে
- অতীতের নির্দিষ্ট সময়ে চলমান কাজ: At this time yesterday, we were travelling.
- লম্বা কাজের মাঝখানে ছোট কাজ ঘটলে: I was taking a shower when the phone rang. (লম্বা কাজ = past continuous, হঠাৎ ঘটনা = past simple)
- গল্পের পটভূমি: The sun was shining and the birds were singing.
## when বনাম while
- while + চলমান কাজ: While I was cooking, he was reading.
- when + হঠাৎ ঘটনা: When the teacher came, we stood up.
## সাধারণ ভুল
- I was went ✗ → I was going / I went ✓ (was-এর পর -ing অথবা আলাদা করে V2)
- Was you sleeping? ✗ → Were you sleeping? ✓`,
  },
  {
    titleBn: "Past Perfect — দুটো অতীতের মধ্যে আগেরটা (had + V3)",
    titleEn: "Past Perfect Tense",
    category: "Tense",
    level: "B1",
    summary: "অতীতে দুটো কাজ হলে যেটা আগে শেষ হয়েছে সেটা past perfect (had + V3), পরেরটা past simple। 'আগেই' ভাবটা এলেই এই tense।",
    body: `## কাঠামো
- সবার জন্য had + V3: I had finished. She had left. They had eaten.
- না: had not (hadn't): I hadn't seen him before.
- প্রশ্ন: Had you ever been there?
## মূল ব্যবহার: দুটো অতীত কাজের ক্রম
- The train had left before we reached the station. (আগে: ট্রেন চলে গেছে; পরে: আমরা পৌঁছেছি)
- When I arrived, the class had already started.
- I had never seen snow before that winter.
## before / after দিয়ে সহজে বোঝা যায়
- After he had finished his homework, he went out to play.
- I recognised him because I had met him before.
## কখন লাগে না
একটাই অতীত কাজ থাকলে past simple-ই যথেষ্ট: I finished my homework. (had finished অপ্রয়োজনীয়)
পরপর ঘটনা বলতে গেলেও দুটোই simple হয়: He came, saw, and left.
## সাধারণ ভুল
- I had went ✗ → I had gone ✓ (had-এর পর V3)
- সব অতীত বাক্যেই had বসানো ✗ — শুধু 'আগের কাজ' বোঝালেই বসে।`,
  },
  {
    titleBn: "১২টি Tense এক নজরে — পুরো ছক",
    titleEn: "All 12 Tenses at a Glance",
    category: "Tense",
    level: "A2",
    summary: "সময় তিনটা (বর্তমান, অতীত, ভবিষ্যৎ) আর প্রতিটার চারটা রূপ (simple, continuous, perfect, perfect continuous) — মোট ১২। এই একটা ছক মুখস্থ থাকলে পুরো tense-ব্যবস্থা পরিষ্কার।",
    body: `## মূল ধারণা
Tense = সময় × ধরন। ধরন চারটা: ঘটনা (simple), চলমান (continuous), সম্পন্ন (perfect), অনেকক্ষণ ধরে চলমান (perfect continuous)।
## Present (বর্তমান) — উদাহরণ: play
- Simple: I play. — অভ্যাস/সত্য
- Continuous: I am playing. — এখন চলছে
- Perfect: I have played. — শেষ হয়েছে, ফল এখন আছে
- Perfect Continuous: I have been playing for two hours. — চলছে, কতক্ষণ ধরে জানা আছে
## Past (অতীত) — উদাহরণ: play
- Simple: I played. — অতীতে শেষ
- Continuous: I was playing. — অতীতের মুহূর্তে চলছিল
- Perfect: I had played. — আরেকটা অতীত কাজের আগেই শেষ
- Perfect Continuous: I had been playing for hours before lunch.
## Future (ভবিষ্যৎ) — উদাহরণ: play
- Simple: I will play. — সিদ্ধান্ত/প্রতিশ্রুতি
- Continuous: I will be playing. — ভবিষ্যতের মুহূর্তে চলবে
- Perfect: I will have played by then. — নির্দিষ্ট সময়ের আগেই শেষ হবে
- Perfect Continuous: I will have been playing for two hours by noon.
## চেনার সূত্র
- continuous মানেই be + -ing; perfect মানেই have/has/had + V3; দুটো মিললে have been + -ing।
- সময়ের শব্দ দেখে চেনো: every day → simple present; now → present continuous; yesterday → past simple; since/for → perfect ঘরানার।
## কোনগুলো আগে শিখবে
রোজকার কথায় ৮০% কাজ চলে: present simple, present continuous, past simple, future (will/going to), present perfect দিয়ে। বাকিগুলো ধীরে ধীরে যোগ করো।`,
  },
  {
    titleBn: "অতীতের অভ্যাস — Used to",
    titleEn: "Used to (Past Habits)",
    category: "Tense",
    level: "B1",
    summary: "আগে নিয়মিত করতে কিন্তু এখন করো না — এমন অভ্যাস বা অবস্থা বোঝাতে used to + V1। 'আগে করতাম' কথাটা এলেই এই গঠন।",
    body: `## কাঠামো
- used to + V1: I used to play cricket every Friday. (এখন আর খেলি না)
- অবস্থার ক্ষেত্রেও: He used to be shy. / There used to be a pond here.
## না ও প্রশ্ন
- না: I didn't use to like coffee. (did এলে used-এর d ঝরে যায়: use to)
- প্রশ্ন: Did you use to live in Dhaka?
## used to বনাম be used to — গুলিয়ে ফেলো না
- used to + V1 = আগের অভ্যাস: I used to wake up early.
- be used to + -ing/noun = অভ্যস্ত: I am used to waking up early. (এখন অভ্যস্ত)
- get used to = অভ্যস্ত হয়ে ওঠা: You will get used to the weather.
## would দিয়েও আগের অভ্যাস বলা যায়
- Every summer, we would visit our village. (শুধু কাজের ক্ষেত্রে; অবস্থায় নয় — be-এর বদলে would চলে না)
## সাধারণ ভুল
- I use to play (বর্তমান অভ্যাস বোঝাতে) ✗ → বর্তমান অভ্যাসে present simple: I play / I usually play.
- I am used to play ✗ → I am used to playing ✓`,
  },
  {
    titleBn: "তুলনা করা — big, bigger, the biggest",
    titleEn: "Comparison of Adjectives",
    category: "ব্যাকরণের ভিত্তি",
    level: "A2",
    summary: "দুজন/দুটোর মধ্যে তুলনায় -er + than, সবার মধ্যে সেরা বোঝাতে the + -est। লম্বা শব্দে more / the most, আর good–better–best-এর মতো কিছু অনিয়মিত রূপ।",
    body: `## তিনটি ধাপ
- Positive: big, fast, beautiful (শুধু বর্ণনা)
- Comparative: bigger, faster, more beautiful (দুটোর তুলনা, সঙ্গে than)
- Superlative: the biggest, the fastest, the most beautiful (সবার মধ্যে, আগে the)
## -er/-est নাকি more/most
- এক syllable: tall → taller → the tallest; big → bigger (শেষের অক্ষর দ্বিগুণ হয়)
- -y দিয়ে শেষ: happy → happier → the happiest
- দুই বা বেশি syllable: more careful → the most careful; more expensive → the most expensive
## অনিয়মিত রূপ (মুখস্থ করতেই হবে)
- good → better → the best
- bad → worse → the worst
- far → farther/further → the farthest/furthest
- little → less → the least; much/many → more → the most
## বাক্যে ব্যবহার
- Dhaka is bigger than Khulna.
- He is the tallest boy in the class.
- This book is more interesting than that one.
- সমান তুলনা: as + adjective + as — She is as tall as her brother.
## সাধারণ ভুল
- more better ✗ → better ✓ (দুটো তুলনাচিহ্ন একসঙ্গে নয়)
- the most fastest ✗ → the fastest ✓
- taller from ✗ → taller than ✓`,
  },
  {
    titleBn: "পরিমাণ বোঝানো — much, many, some, any, a few, a little",
    titleEn: "Quantity Words (much / many / some / any)",
    category: "ব্যাকরণের ভিত্তি",
    level: "A2",
    summary: "গোনা যায় এমন জিনিসে many/few, গোনা যায় না এমন হলে much/little। আর some সাধারণত হ্যাঁ-বোধক বাক্যে, any প্রশ্ন আর না-বোধক বাক্যে বসে।",
    body: `## আগে ঠিক করো: গোনা যায় তো?
- গোনা যায় (countable): books, students, taka → many, a few, few
- গোনা যায় না (uncountable): water, time, money, sugar → much, a little, little
- money গোনা যায় না (taka গোনা যায়!) — এই পার্থক্যটা মনে রাখো।
## much / many
- প্রশ্ন আর না-বোধকে বেশি চলে: How much time? How many books? I don't have much money.
- হ্যাঁ-বোধকে a lot of দুটোর বদলেই চলে: I have a lot of friends / a lot of work.
## a few / few, a little / little — ছোট্ট পার্থক্য, বড় অর্থ
- a few / a little = কিছুটা আছে (ইতিবাচক): I have a few friends. (ভালোই আছে)
- few / little = প্রায় নেই বললেই চলে (নেতিবাচক): I have few friends. (খুব কম, দুঃখের ভাব)
## some / any
- some → হ্যাঁ-বোধক: I need some water.
- any → প্রশ্ন ও না-বোধক: Do you have any questions? I don't have any money.
- ব্যতিক্রম: অনুরোধ/প্রস্তাবে some: Would you like some tea? Can I have some water?
## আরও দরকারি
- too much / too many = অতিরিক্ত (খারাপ অর্থে): too much noise, too many people
- enough = যথেষ্ট: enough money, old enough`,
  },
  {
    titleBn: "বাক্য জোড়া দেওয়া — and, but, because, so, then",
    titleEn: "Linking Words (Connectors)",
    category: "বাক্য গঠন",
    level: "A2",
    summary: "ছোট ছোট বাক্য জোড়া দিলেই কথা সাবলীল হয়। কারণে because, ফলে so, বিপরীতে but, ক্রমে first–then–finally — এই সংযোজকগুলোই কথার প্রবাহ বানায়।",
    body: `## প্রধান সংযোজকগুলো
- and — যোগ: I read and write every day.
- but — বিপরীত: It is cheap but good. / I tried, but I failed.
- or — বিকল্প: Tea or coffee?
- because — কারণ: I stayed home because I was ill.
- so — ফলাফল: I was ill, so I stayed home. (because আর so একই সম্পর্কে দুই দিক!)
- then / after that — তারপর: First wash the rice. Then boil the water.
## দুটো পূর্ণ বাক্য জুড়তে
- কমা + and/but/so: He called me, and I answered at once.
- because থাকলে কমা লাগে না (পেছনে থাকলে): I left because it was late.
- because বাক্যের শুরুতে এলে মাঝখানে কমা: Because it was late, I left.
## কথা সাজানোর ক্রম
- First … Then … After that … Finally … — গল্প বা প্রক্রিয়া বলতে সেরা কাঠামো।
- উদাহরণ: First, I wake up at six. Then I take a shower. After that, I have breakfast. Finally, I leave for work.
## আরও কিছু জোড়া-শব্দ
- also / too — আরও: I also speak Hindi. Me too.
- however — তবে (আনুষ্ঠানিক): It is expensive. However, it is very good.
- if / when / while — শর্ত ও সময়ের জন্য আলাদা লেসন দেখো (Conditionals)।
## সাধারণ ভুল
- Because I was ill. (অর্ধেক বাক্য একা) ✗ → পূর্ণ বাক্য লাগবে: I stayed home because I was ill.
- and দিয়ে প্রতিটা বাক্য শুরু করা ✗ — মাঝে মাঝে then, so, but বদলাও।`,
  },
  {
    titleBn: "ভদ্রভাবে অনুরোধ ও অনুমতি — Could you…? May I…?",
    titleEn: "Polite Requests & Permission",
    category: "কথোপকথন",
    level: "A2",
    summary: "সরাসরি আদেশ অনেক সময় অভদ্র শোনায়। Can I, Could you, Would you mind — এই নরম গঠনগুলোই ভদ্র ইংরেজির প্রাণ, অফিস-আদালত-দোকান সব জায়গায় চলে।",
    body: `## অনুমতি চাওয়া (নিজে কিছু করতে চাইলে)
- Can I use your phone? — সাধারণ, বন্ধুদের মধ্যে
- Could I use your phone? — আরেকটু ভদ্র
- May I come in? — আনুষ্ঠানিক/শিক্ষক-বসের কাছে
- উত্তর: Sure. / Of course. / Sorry, you can't.
## অনুরোধ করা (অন্যকে কিছু করতে বলা)
- Can you help me? → Could you help me, please? (ভদ্রতর)
- Could you please repeat that? — আবার বলবেন?
- Could you speak slowly, please? — ধীরে বলবেন? (শেখার সময় সবচেয়ে কাজের বাক্য!)
## Would you mind…? — সবচেয়ে ভদ্র রূপ
- Would you mind opening the window? (mind-এর পর verb-ing)
- উত্তর 'না' মানে সম্মতি: No, not at all. (= অবশ্যই, খুলছি) — এখানে Yes বললে অর্থ উল্টে যায়, সাবধান!
## প্রস্তাব দেওয়া
- Would you like some tea? — Yes, please. / No, thanks.
- Shall I help you? — আমি সাহায্য করি?
- Let me help you. — আমাকে সাহায্য করতে দিন।
## দোকান/অফিসে চেনা বাক্য
- Excuse me, where is the counter?
- Just a moment, please. — একটু অপেক্ষা করুন।
- Thank you so much. — You are welcome.`,
  },
  {
    titleBn: "কেনাকাটার ইংরেজি — দাম জিজ্ঞাসা ও দরদাম",
    titleEn: "Shopping: Prices & Bargaining",
    category: "কথোপকথন",
    level: "A2",
    summary: "দোকানে ঢোকা থেকে দাম কমানো পর্যন্ত পুরো কথোপকথনের তৈরি প্যাটার্ন — How much is this? থেকে That's too expensive পর্যন্ত ধাপে ধাপে।",
    body: `## দোকানে ঢুকে
- Excuse me, I'm just looking. — শুধু দেখছি। (দোকানি এগিয়ে এলে)
- Can I help you? (দোকানি বলবে) → Yes, I'm looking for a shirt.
- Do you have this in a smaller size? — ছোট সাইজ আছে?
- Can I try this on? — এটা পরে দেখতে পারি? (fitting room = ট্রায়াল রুম)
## দাম জানা
- How much is this? (একটির জন্য) / How much are these? (অনেকগুলোর জন্য)
- How much does it cost?
- Is there any discount? — কোনো ছাড় আছে?
## দরদাম করা
- That's too expensive. — এটা খুব দামি।
- Can you make it a bit cheaper? — একটু কমানো যাবে?
- What's your last price? — শেষ দাম কত?
- I'll take it. — নিলাম। / I'll think about it. — ভেবে দেখছি। (না কেনার ভদ্র উপায়)
## টাকা দেওয়া ও ফেরত
- Can I pay by bKash / card? — বিকাশে/কার্ডে দিতে পারি?
- Please give me a receipt. — রসিদটা দিন।
- Sorry, this is damaged. Can I exchange it? — এটা নষ্ট, বদলানো যাবে?
## অনুশীলন: পুরো দৃশ্যটা মনে মনে বলো
দোকানে ঢোকা → পছন্দের জিনিস দেখা → সাইজ চাওয়া → দাম শোনা → একবার দরদাম → কেনা বা ভদ্রভাবে বেরিয়ে আসা। প্রতিটা ধাপে ওপরের একটা করে বাক্য বসালেই পুরো কথোপকথন তৈরি!`,
  },
  {
    titleBn: "Question Tags — …, isn't it? / …, don't you?",
    titleEn: "Question Tags",
    category: "কথোপকথন",
    level: "B1",
    summary: "বাক্যের শেষে ছোট্ট প্রশ্ন জুড়ে দেওয়া — 'তাই না?' ভাবটা। নিয়ম সহজ: হ্যাঁ-বোধক বাক্যে না-বোধক tag, না-বোধকে হ্যাঁ-বোধক tag, আর verb-টা বাক্য থেকেই ধার নিতে হয়।",
    body: `## মূল নিয়ম
- বাক্য হ্যাঁ-বোধক হলে tag না-বোধক: You are a student, aren't you?
- বাক্য না-বোধক হলে tag হ্যাঁ-বোধক: You are not late, are you?
- সাহায্যকারী verb (be, do, does, did, can, will, have) বাক্য থেকে নাও, subject-টা pronoun হয়ে যায়।
## উদাহরণ দেখে প্যাটার্নটা ধরো
- It is hot today, isn't it?
- She can swim, can't she?
- They went home, didn't they? (সাধারণ verb → did ধার)
- He doesn't smoke, does he?
- You have finished, haven't you?
## বিশেষ ক্ষেত্র
- I am … → aren't I? (amn't হয় না!): I am right, aren't I?
- Let's … → shall we?: Let's go, shall we?
- আদেশের বাক্যে → will you?: Close the door, will you?
## উত্তরের ধরন
Tag question-এর উত্তর বাস্তবতা অনুযায়ী দাও, বাক্যের রূপ অনুযায়ী নয়:
- You don't like tea, do you? → সত্যি পছন্দ না হলে: No, I don't. (বাংলা ভাবধারায় 'হ্যাঁ' বলে ফেলো না!)
## কথোপকথনে কেন দরকার
Tag দিয়ে কথা চালু রাখা যায়, সম্মতি নেওয়া যায়, আবহাওয়া নিয়ে small talk হয়: Lovely day, isn't it?`,
  },
  {
    titleBn: "অন্যের কথা বলা — Reported Speech",
    titleEn: "Reported Speech",
    category: "ব্যাকরণের ভিত্তি",
    level: "B1",
    summary: "'সে বলল যে…' — অন্যের কথা নিজের মুখে বলতে tense এক ধাপ পেছায়, আর I/you বদলে যায় বক্তা অনুযায়ী। say আর tell-এর পার্থক্যটাও এখানেই।",
    body: `## মূল নিয়ম: tense এক ধাপ পেছায়
- Present simple → Past simple: "I am busy." → He said he was busy.
- Present continuous → Past continuous: "I am working." → She said she was working.
- Past simple / Present perfect → Past perfect: "I saw him." → He said he had seen him.
- will → would, can → could: "I will come." → She said she would come.
## say বনাম tell
- say (to + মানুষ থাকতেও পারে): He said that he was tired. / He said to me …
- tell + মানুষ লাগবেই: He told me that he was tired. (He told that … ✗)
- that বলা বাধ্যতামূলক নয়: He said he was tired. ✓
## শব্দগুলোও বদলায়
- now → then, today → that day, yesterday → the day before, tomorrow → the next day
- here → there, this → that
## প্রশ্ন রিপোর্ট করা
- প্রশ্নচিহ্ন থাকে না, শব্দের ক্রম বক্তব্যের মতো হয়: "Where do you live?" → He asked me where I lived.
- yes/no প্রশ্নে if/whether: "Are you ready?" → She asked if I was ready.
## আদেশ/অনুরোধ রিপোর্ট করা
- told/asked + object + to + verb: "Open the door." → He told me to open the door.
- না-বোধকে: She asked me not to be late.
## কখন tense পেছায় না
চিরন্তন সত্য হলে: The teacher said that the earth moves round the sun. (present-ই থাকে)`,
  },
  {
    titleBn: "Phrasal Verbs — প্রতিদিনের ছোট ছোট যুগ্ম-ক্রিয়া",
    titleEn: "Phrasal Verbs for Daily Life",
    category: "কথোপকথন",
    level: "B1",
    summary: "verb + up/down/out/on — মিলিয়ে একদম নতুন অর্থ! Native speaker-রা বইয়ের শব্দের বদলে এসবই ব্যবহার করে। প্রতিদিনের সবচেয়ে কাজের ২০টা এখানে।",
    body: `## ধারণাটা আগে
Get মানে পাওয়া, কিন্তু get up = ঘুম থেকে ওঠা, get on = বাসে চড়া/সম্পর্ক ভালো থাকা। Phrasal verb-এর অর্থ অংশগুলো যোগ করে পাওয়া যায় না — পুরোটা একটা একক হিসেবে শিখতে হয়।
## সকাল থেকে রাত — একদিনের phrasal verb
- wake up — ঘুম ভাঙা: I wake up at six.
- get up — বিছানা ছাড়া: Then I get up and brush my teeth.
- put on — পোশাক পরা: Put on your shirt. (খোলা = take off)
- go out — বাইরে যাওয়া: We went out for dinner.
- come back — ফিরে আসা: He came back late.
- sit down / stand up — বসা / দাঁড়ানো
- turn on / turn off — চালু / বন্ধ করা: Turn off the light.
- hurry up — তাড়াতাড়ি করো!
## আরও দরকারি ১০টা
- look for — খোঁজা: I am looking for my keys. (look at = তাকানো, look after = দেখাশোনা করা)
- give up — হাল ছাড়া: Never give up.
- find out — জেনে ফেলা: I found out the truth.
- put off — পিছিয়ে দেওয়া: Don't put off today's work.
- carry on — চালিয়ে যাওয়া: Carry on, you are doing well.
- run out of — শেষ হয়ে যাওয়া: We ran out of rice.
- get on / get off — (বাস-ট্রেনে) ওঠা / নামা
- take care of — যত্ন নেওয়া: Take care of your health.
- break down — নষ্ট হয়ে যাওয়া: The bus broke down.
- call off — বাতিল করা: They called off the meeting.
## শেখার কৌশল
আলাদা তালিকা মুখস্থ না করে প্রতিদিনের কাজের সঙ্গে জুড়ে শেখো — সকালে উঠে মনে মনে বলো: I woke up, I got up, I put on my clothes… এভাবেই এগুলো মুখে এসে যাবে।`,
  },
  {
    titleBn: "Verb-এর পর -ing নাকি to? — Gerund ও Infinitive",
    titleEn: "Gerund & Infinitive (verb + -ing / to + verb)",
    category: "ব্যাকরণের ভিত্তি",
    level: "B2",
    summary: "দুটো verb পাশাপাশি এলে দ্বিতীয়টা কোন রূপ নেবে তা প্রথম verb-টাই ঠিক করে দেয়: enjoy-এর পর -ing, want-এর পর to। কিছু verb-এ দুটোই চলে — তবে অর্থ বদলায়।",
    body: `## দুটো রূপ
- Gerund: verb-ing noun-এর মতো কাজ করে: Swimming is good exercise.
- Infinitive: to + verb: I want to learn English.
## -ing নেওয়া verb (মুখস্থ তালিকা)
- enjoy, finish, mind, avoid, practise, suggest, keep, stop (ছাড়া অর্থে)
- I enjoy reading. / Have you finished writing? / Would you mind closing the door?
- preposition-এর পর সবসময় -ing: I am good at drawing. Thank you for coming.
## to নেওয়া verb
- want, need, decide, hope, plan, learn, agree, promise, would like
- We decided to stay. / I hope to see you soon. / Would you like to come?
## দুটোই চলে, অর্থ প্রায় এক
- like, love, hate, start, begin: I like swimming. = I like to swim.
## দুটোই চলে, অর্থ বদলায় — সাবধান
- stop to do = থেমে অন্য কাজ করা: He stopped to smoke. (সিগারেট খেতে থামল)
- stop doing = কাজটা ছেড়ে দেওয়া: He stopped smoking. (ধূমপান ছেড়ে দিল)
- remember to do = করার কথা মনে রাখা: Remember to lock the door.
- remember doing = করে থাকার স্মৃতি: I remember locking the door.
- try to do = চেষ্টা করা; try doing = পরীক্ষামূলকভাবে করে দেখা
## সাধারণ ভুল
- I enjoy to read ✗ → I enjoy reading ✓
- I want learn ✗ → I want to learn ✓
- He suggested me to go ✗ → He suggested that I go / He suggested going ✓`,
  },
  {
    titleBn: "যে ভুলগুলো সবাই করে — বাংলাদেশি শিক্ষার্থীদের সাধারণ ভুল",
    titleEn: "Common Mistakes",
    category: "ভিত্তি",
    level: "B1",
    summary: "বাংলা ভাবধারা থেকে আসা ভুলগুলো প্রায় সবার একই রকম: he don't, I am agree, discuss about… এই লেসনে সবচেয়ে বেশি হওয়া ভুলগুলো এক জায়গায় ঠিক করা হলো।",
    body: `## Verb-এর ভুল
- He don't know ✗ → He doesn't know ✓ (he/she/it-তে does)
- She is agree ✗ → She agrees ✓ (agree নিজেই verb, is লাগে না)
- I am having a car ✗ → I have a car ✓ (মালিকানায় continuous হয় না)
- Did you went? ✗ → Did you go? ✓ (did থাকলে V1)
## শব্দ বাছাইয়ের ভুল
- discuss about the problem ✗ → discuss the problem ✓ (discuss-এর পর about নয়)
- marry with her ✗ → marry her ✓
- He gave exam ✗ → He took/sat for an exam ✓ (পরীক্ষা 'দেওয়া' ইংরেজিতে take)
- My cousin brother ✗ → My cousin ✓ (cousin-ই যথেষ্ট)
- I feel boring ✗ → I feel bored ✓ (boring = যে বিরক্ত করে, bored = যে বিরক্ত হয়)
## বাক্য গঠনের ভুল
- Myself Jarif ✗ → I am Jarif / My name is Jarif ✓
- He is more smarter ✗ → He is smarter ✓
- Although he was ill, but he went ✗ → Although he was ill, he went ✓ (although থাকলে but নয়)
- I am living here since 2020 ✗ → I have been living here since 2020 ✓ (since থাকলে perfect)
## উচ্চারণ-ঘটিত সতর্কতা
- 'আমি একমত' বলতে I am agree নয়, I agree।
- 'সে আমার ভাই হয়' — He is my brother। (হয় ≠ is সবসময় নয়, তবে এখানে ঠিক আছে)
## ভুল ধরার অভ্যাস গড়ো
নিজের বলা/লেখা বাক্য একবার মনে মনে যাচাই করো: (১) he/she/it-তে verb-এ s আছে তো? (২) did থাকলে verb V1 তো? (৩) since/for থাকলে perfect tense তো? — এই তিন প্রশ্নেই বেশিরভাগ ভুল ধরা পড়ে।`,
  },
];
