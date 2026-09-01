import { env } from "@/lib/gazette/env";

type Source = "newsdata_io" | "rbi_rss" | "pib_rss" | "sebi_rss";
type Scope = "national" | "international";

export type ExamProfile = {
  id: string;
  /** NewsData.io latest-news calls. Two calls: India national + world. */
  newsdata: {
    endpoint: string;
    national: Record<string, string>;
    international: Record<string, string>;
    /** Hard cap on pagination pages per call — NewsData bills per credit. */
    maxPages: number;
  };
  /** Official announcement feeds — the RBI/PIB/SEBI items exams actually test. */
  rssFeeds: { source: Source; url: string; scope: Scope }[];
  /** Cap per ingest run and per generate run — bounds cost and blast radius. */
  maxArticlesPerIngest: number;
  maxQuestionsPerGenerate: number;
  /**
   * Max LLM calls per minute, enforced queue-global by the BullMQ worker's
   * limiter. Set to the model's safe RPM (Gemini free-tier flash-lite is low;
   * paid is thousands).
   */
  llmMaxRpm: number;
  /** Model for MCQ drafting. Overridable via GENERATION_MODEL. */
  generationModel: string;
  /** Dedup lookback: salient-facts checks compare against this many days. */
  recentWindowDays: number;
  /**
   * Free deterministic relevance pre-filter (stage A). Only applied to
   * NewsData articles — RSS feeds are the regulators' own announcements.
   * A candidate is hard-dropped only when it hits a negative term and no
   * positive term; the model gate in generation is the real filter.
   */
  relevanceLexicon: { positive: string[]; negative: string[] };
  /** Allowed `topic` values on a generated question (model picks one). */
  topics: string[];
};

// The banking-exam profile from the Gazette Engine spec. A second profile
// (e.g. A-level general studies) would be added as another export here and
// selected in the pipeline entrypoints — no pipeline code changes.
export const BANKING_EXAM_PROFILE: ExamProfile = {
  id: "banking-exam-in",
  newsdata: {
    endpoint: "https://newsdata.io/api/1/latest",
    national: { country: "in", language: "en", category: "top,politics,business" },
    international: { language: "en", category: "world" },
    maxPages: 2,
  },
  // Feed URLs are best-effort and occasionally change — the ingest run treats a
  // dead feed as empty rather than failing the whole pass.
  //   - SEBI: www.sebi.gov.in firewalls non-India IPs; expect 0 items off an
  //     overseas host.
  //   - PIB: this feed's language is inconsistent (English or Hindi); Hindi
  //     items are dropped at generation by the isMostlyEnglish gate.
  rssFeeds: [
    { source: "rbi_rss", url: "https://www.rbi.org.in/pressreleases_rss.xml", scope: "national" },
    { source: "pib_rss", url: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", scope: "national" },
    { source: "sebi_rss", url: "https://www.sebi.gov.in/sebirss.xml", scope: "national" },
  ],
  maxArticlesPerIngest: 120,
  // One Gemini request per candidate. gemini-3.x-flash free tier is only ~20
  // req/day; gemini-flash-lite-latest's is far higher. Raise once billing is
  // on the key. Thin articles are skipped before spending a request (see
  // MIN_SOURCE_CHARS in pipeline/generate.ts).
  maxQuestionsPerGenerate: 40,
  // Conservative — safe for paid Flash-Lite and won't instantly exhaust a
  // free-tier daily cap. Bump on a paid key with headroom.
  llmMaxRpm: 12,
  // getter so importing this module doesn't read env at load time
  get generationModel() {
    return env.GENERATION_MODEL;
  },
  recentWindowDays: 3,

  relevanceLexicon: {
    // Kept specific on purpose: a single generic word like "award" or "mission"
    // shows up in horoscopes and film blurbs and would neutralise the negative
    // signal. Prefer multi-word / unambiguous terms.
    positive: [
      "rbi", "reserve bank", "sebi", "monetary policy", "mpc", "repo rate",
      "reverse repo", "mclr", "base rate", "bank rate", "inflation",
      "cpi", "wpi", "gdp", "gva", "fiscal deficit", "current account deficit",
      "forex reserves", "foreign exchange reserves", "bond yield",
      "npa", "non-performing asset", "bad loan", "basel", "psu bank",
      "public sector bank", "bank merger", "recapitalisation", "nabard",
      "irdai", "pfrda", "npci", "upi", "digital rupee", "cbdc",
      "priority sector lending", "financial inclusion", "jan dhan", "mudra",
      "life insurance", "mutual fund", "initial public offering", "ipo",
      "sensex", "nifty", "stock market", "gst collection", "gst council",
      "union budget", "disinvestment", "divestment", "pli scheme",
      "government scheme", "central scheme", "yojana", "space mission",
      "cabinet approved", "cabinet nod", "parliament passed", "lok sabha passed",
      "rajya sabha passed", "bill passed", "ordinance", "world bank",
      "asian development bank", "aiib", "wto", "brics", "united nations",
      "g20", "g7", "imf", "opec", "nato", "sanctions", "summit",
      "central bank", "finance ministers", "bilateral talks",
      "bilateral meeting", "bilateral agreement", "mou signed",
      "trade agreement", "trade deal", "free trade agreement", "tariff",
      "defence deal", "defence agreement", "defence pact", "defence ministry",
      "defence acquisition", "ballistic missile", "warship", "submarine",
      "aircraft carrier", "drdo", "isro", "launch vehicle", "pslv", "gslv",
      "chandrayaan", "gaganyaan", "nobel prize", "booker prize", "padma award",
      "padma shri", "padma bhushan", "bharat ratna", "national award to",
      "appointed as", "appointed the new", "named ceo", "named chairman",
      "takes over as", "sworn in as", "new rbi governor", "new cji",
      "chief justice of india", "chief election commissioner",
      "ease of doing business", "global hunger index", "press freedom index",
      "human development index", "economic survey", "gi tag",
      "world heritage site", "ramsar site", "olympic", "asian games",
      "commonwealth games", "world cup", "grand slam", "world championship",
      "gold medal", "test series", "wins the title", "passes away",
      "veteran actor", "veteran politician", "former president",
      "former prime minister", "climate summit", "climate change",
      "carbon emission", "renewable energy",
    ],
    negative: [
      "billboard", "hoarding", "pothole", "encroachment", "manhole",
      "sewage", "garbage", "traffic jam", "water logging", "power cut",
      "load shedding", "local body", "municipal corporation", "ward",
      "colony residents", "residents seek", "residents demand",
      "peon recruitment", "clerk recruitment", "vacancy notification",
      "recruitment 2026", "admit card", "answer key", "result declared",
      "exam postponed", "hall ticket", "cut off", "merit list",
      "horoscope", "rashifal", "zodiac", "numerology", "astrology",
      "box office", "film review", "movie review", "trailer", "teaser",
      "web series", "ott release", "song launch", "first look",
      "wedding", "engagement", "birthday bash", "spotted at", "airport look",
      "viral video", "viral photo", "fan asks", "netizens react",
      "recipe", "skincare", "weight loss", "home remedy", "diet plan",
      "gadget review", "unboxing", "discount", "sale offer", "deal of the day",
      "match preview", "dream11", "fantasy tips", "probable playing xi",
      "bridal", "emi guide", "monthly emi", "housefull", "standing ovation",
      "missing:", "who knew her", "who knew him", "starstruck", "crazy fan",
      "childhood nostalgia", "dating", "girlfriend", "boyfriend",
    ],
  },

  topics: [
    "Monetary Policy & RBI",
    "Banking & Regulation",
    "Economy & Fiscal",
    "Markets & SEBI",
    "Schemes & Government",
    "International & Trade",
    "Appointments",
    "Awards & Honours",
    "Sports",
    "Science & Technology",
    "Defence",
    "Reports & Rankings",
    "Obituaries",
    "Miscellaneous",
  ],
};

export const activeProfile = BANKING_EXAM_PROFILE;
