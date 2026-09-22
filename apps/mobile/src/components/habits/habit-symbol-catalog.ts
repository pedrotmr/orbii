import type { HabitCategory } from "@orbii/backend";

interface HabitSymbolDefinition {
  id: string;
  label: string;
  category: HabitCategory;
  keywords: readonly string[];
}

export const habitCategories: HabitCategory[] = [
  "body",
  "mind",
  "learn",
  "life",
];

export const habitSymbols = [
  {
    id: "walk",
    label: "Walk",
    category: "body",
    keywords: ["walk", "walking", "steps", "stroll"],
  },
  {
    id: "read",
    label: "Read",
    category: "learn",
    keywords: ["read", "reading", "book", "books", "pages"],
  },
  {
    id: "water",
    label: "Water",
    category: "life",
    keywords: ["water", "hydrate", "hydration"],
  },
  {
    id: "stretch",
    label: "Stretch",
    category: "body",
    keywords: [
      "stretch",
      "stretching",
      "yoga",
      "mobility",
      "flexibility",
      "pilates",
      "tai chi",
    ],
  },
  {
    id: "journal",
    label: "Journal",
    category: "mind",
    keywords: ["journal", "journaling", "diary"],
  },
  {
    id: "music",
    label: "Music",
    category: "mind",
    keywords: ["music", "listen", "listening"],
  },
  {
    id: "cook",
    label: "Cook",
    category: "life",
    keywords: ["cook", "cooking", "meal prep"],
  },
  {
    id: "rest",
    label: "Rest",
    category: "mind",
    keywords: ["rest", "relax", "unwind", "pause"],
  },
  {
    id: "plant",
    label: "Grow",
    category: "life",
    keywords: ["plant", "plants", "garden", "gardening"],
  },
  {
    id: "workout",
    label: "Workout",
    category: "body",
    keywords: [
      "workout",
      "weights",
      "gym",
      "strength",
      "strength training",
      "weightlifting",
      "exercise",
      "exercising",
      "lift weights",
    ],
  },
  {
    id: "run",
    label: "Run",
    category: "body",
    keywords: ["run", "running", "jog", "jogging"],
  },
  {
    id: "cycle",
    label: "Cycle",
    category: "body",
    keywords: ["cycle", "cycling", "bike", "biking"],
  },
  {
    id: "swim",
    label: "Swim",
    category: "body",
    keywords: ["swim", "swimming", "pool"],
  },
  {
    id: "stairs",
    label: "Stairs",
    category: "body",
    keywords: ["stairs", "staircase"],
  },
  {
    id: "sleep",
    label: "Sleep",
    category: "body",
    keywords: [
      "sleep",
      "sleeping",
      "bed",
      "bedtime",
      "nap",
      "bedtime routine",
      "go to bed",
    ],
  },
  {
    id: "care",
    label: "Self-care",
    category: "body",
    keywords: ["shower", "showers", "self care"],
  },
  {
    id: "teeth",
    label: "Teeth",
    category: "body",
    keywords: ["teeth", "floss", "flossing", "tooth"],
  },
  {
    id: "meditate",
    label: "Meditate",
    category: "mind",
    keywords: [
      "meditate",
      "meditating",
      "meditation",
      "mindfulness",
      "mindful",
      "body scan",
      "zen",
      "vipassana",
      "loving kindness",
    ],
  },
  {
    id: "breathe",
    label: "Breathe",
    category: "mind",
    keywords: [
      "breathe",
      "breathing",
      "breathwork",
      "breaths",
      "box breathing",
      "pranayama",
    ],
  },
  {
    id: "nature",
    label: "Nature",
    category: "mind",
    keywords: ["nature", "outside", "outdoors", "park"],
  },
  {
    id: "gratitude",
    label: "Gratitude",
    category: "mind",
    keywords: ["gratitude", "grateful", "thankful"],
  },
  {
    id: "sunrise",
    label: "Sunrise",
    category: "mind",
    keywords: ["sunrise", "sunlight", "morning light", "morning sunlight"],
  },
  {
    id: "puzzle",
    label: "Puzzle",
    category: "mind",
    keywords: ["puzzle", "puzzles", "sudoku", "crossword", "chess"],
  },
  {
    id: "reflect",
    label: "Reflect",
    category: "mind",
    keywords: ["reflect", "reflection", "think"],
  },
  {
    id: "write",
    label: "Write",
    category: "learn",
    keywords: ["write", "writing", "poetry", "essay"],
  },
  {
    id: "language",
    label: "Language",
    category: "learn",
    keywords: [
      "language",
      "languages",
      "vocabulary",
      "spanish",
      "french",
      "german",
      "italian",
      "portuguese",
      "japanese",
      "korean",
      "mandarin",
      "chinese",
      "arabic",
      "english",
      "hindi",
      "duolingo",
      "pronunciation",
      "grammar",
    ],
  },
  {
    id: "study",
    label: "Study",
    category: "learn",
    keywords: ["study", "studying", "course", "lesson", "learn"],
  },
  {
    id: "code",
    label: "Code",
    category: "learn",
    keywords: ["code", "coding", "programming"],
  },
  {
    id: "art",
    label: "Art",
    category: "learn",
    keywords: ["art", "draw", "drawing", "sketch"],
  },
  {
    id: "instrument",
    label: "Practice",
    category: "learn",
    keywords: ["guitar", "instrument", "violin", "ukulele", "bass", "cello"],
  },
  {
    id: "photo",
    label: "Photo",
    category: "learn",
    keywords: ["photo", "photography", "camera"],
  },
  {
    id: "craft",
    label: "Craft",
    category: "learn",
    keywords: ["craft", "knit", "knitting", "crochet"],
  },
  {
    id: "explore",
    label: "Explore",
    category: "learn",
    keywords: ["explore", "museum", "discover"],
  },
  {
    id: "food",
    label: "Nourish",
    category: "life",
    keywords: ["food", "eat", "eating", "lunch", "dinner"],
  },
  {
    id: "tidy",
    label: "Tidy",
    category: "life",
    keywords: ["tidy", "clean", "cleaning", "declutter"],
  },
  {
    id: "connect",
    label: "Connect",
    category: "life",
    keywords: ["call", "friend", "friends", "family", "connect"],
  },
  {
    id: "pet",
    label: "Pet",
    category: "life",
    keywords: ["dog", "pet"],
  },
  {
    id: "home",
    label: "Home",
    category: "life",
    keywords: ["home", "house"],
  },
  {
    id: "coffee",
    label: "Slow down",
    category: "life",
    keywords: ["coffee"],
  },
  { id: "spark", label: "Something good", category: "life", keywords: [] },
  {
    id: "basketball",
    label: "Basketball",
    category: "body",
    keywords: ["basketball", "hoops"],
  },
  {
    id: "soccer",
    label: "Soccer",
    category: "body",
    keywords: ["soccer", "football"],
  },
  {
    id: "tennis",
    label: "Tennis",
    category: "body",
    keywords: ["tennis", "racket", "padel"],
  },
  {
    id: "volleyball",
    label: "Volleyball",
    category: "body",
    keywords: ["volleyball"],
  },
  {
    id: "boxing",
    label: "Boxing",
    category: "body",
    keywords: ["boxing", "kickboxing"],
  },
  {
    id: "hike",
    label: "Hike",
    category: "body",
    keywords: ["hike", "hiking", "trail"],
  },
  { id: "ski", label: "Ski", category: "body", keywords: ["ski", "skiing"] },
  {
    id: "snowboard",
    label: "Snowboard",
    category: "body",
    keywords: ["snowboard", "snowboarding"],
  },
  {
    id: "dance",
    label: "Dance",
    category: "body",
    keywords: ["dance", "dancing", "salsa"],
  },
  {
    id: "recovery",
    label: "Recovery",
    category: "body",
    keywords: ["recovery", "physio", "rehab", "physical therapy"],
  },
  {
    id: "unplug",
    label: "Unplug",
    category: "mind",
    keywords: ["unplug", "screen time", "phone free", "digital detox"],
  },
  {
    id: "pray",
    label: "Pray",
    category: "mind",
    keywords: ["pray", "prayer", "praying"],
  },
  {
    id: "kindness",
    label: "Kindness",
    category: "mind",
    keywords: ["kindness", "kind", "help someone"],
  },
  {
    id: "quiet",
    label: "Quiet time",
    category: "mind",
    keywords: ["quiet", "silence", "silent"],
  },
  {
    id: "focus",
    label: "Focus",
    category: "mind",
    keywords: ["focus", "deep work", "pomodoro"],
  },
  { id: "tea", label: "Tea", category: "mind", keywords: ["tea", "matcha"] },
  {
    id: "ocean",
    label: "Ocean",
    category: "mind",
    keywords: ["ocean", "beach", "sea"],
  },
  {
    id: "forest",
    label: "Forest",
    category: "mind",
    keywords: ["forest", "woods", "trees"],
  },
  {
    id: "sun",
    label: "Sunshine",
    category: "mind",
    keywords: ["sunshine", "sun", "daylight"],
  },
  {
    id: "play",
    label: "Play",
    category: "mind",
    keywords: ["play", "game", "gaming"],
  },
  {
    id: "piano",
    label: "Piano",
    category: "learn",
    keywords: ["piano", "keyboard practice", "practice keyboard"],
  },
  {
    id: "sing",
    label: "Sing",
    category: "learn",
    keywords: ["sing", "singing", "vocals"],
  },
  {
    id: "film",
    label: "Film",
    category: "learn",
    keywords: ["film", "filmmaking", "video", "movie"],
  },
  {
    id: "sew",
    label: "Sew",
    category: "learn",
    keywords: ["sew", "sewing", "stitch", "embroidery"],
  },
  {
    id: "lettering",
    label: "Lettering",
    category: "learn",
    keywords: ["lettering", "calligraphy", "handwriting"],
  },
  {
    id: "science",
    label: "Science",
    category: "learn",
    keywords: ["science", "experiment", "chemistry"],
  },
  {
    id: "math",
    label: "Math",
    category: "learn",
    keywords: ["math", "maths", "mathematics", "algebra"],
  },
  {
    id: "design",
    label: "Design",
    category: "learn",
    keywords: ["design", "architecture"],
  },
  {
    id: "paint",
    label: "Paint",
    category: "learn",
    keywords: ["paint", "painting", "watercolor"],
  },
  {
    id: "audio",
    label: "Listen & learn",
    category: "learn",
    keywords: ["podcast", "podcasts", "audiobook", "audiobooks"],
  },
  {
    id: "vegetables",
    label: "Vegetables",
    category: "life",
    keywords: ["vegetables", "veggies", "carrot", "salad"],
  },
  {
    id: "fruit",
    label: "Fruit",
    category: "life",
    keywords: ["fruit", "orange", "apple", "banana"],
  },
  {
    id: "breakfast",
    label: "Breakfast",
    category: "life",
    keywords: ["breakfast", "eggs"],
  },
  {
    id: "bake",
    label: "Bake",
    category: "life",
    keywords: ["bake", "baking", "bread", "sourdough"],
  },
  {
    id: "save",
    label: "Save",
    category: "life",
    keywords: ["save", "saving", "savings"],
  },
  {
    id: "budget",
    label: "Budget",
    category: "life",
    keywords: ["budget", "budgeting", "expenses", "spending"],
  },
  {
    id: "plan",
    label: "Plan",
    category: "life",
    keywords: ["plan", "planning", "calendar", "schedule"],
  },
  {
    id: "laundry",
    label: "Laundry",
    category: "life",
    keywords: ["laundry", "clothes", "fold", "ironing"],
  },
  {
    id: "recycle",
    label: "Recycle",
    category: "life",
    keywords: ["recycle", "recycling", "compost"],
  },
  {
    id: "cat",
    label: "Cat",
    category: "life",
    keywords: ["cat", "cats", "kitten"],
  },
  {
    id: "cold",
    label: "Cold shower",
    category: "body",
    keywords: [
      "cold shower",
      "cold showers",
      "cold plunge",
      "cold water",
      "ice bath",
      "ice baths",
    ],
  },
  {
    id: "bath",
    label: "Bath",
    category: "body",
    keywords: ["bath", "baths", "bathe", "soak"],
  },
  {
    id: "skincare",
    label: "Skincare",
    category: "body",
    keywords: [
      "skincare",
      "skin care",
      "moisturize",
      "moisturizer",
      "serum",
      "wash face",
      "wash my face",
    ],
  },
  {
    id: "sunscreen",
    label: "Sunscreen",
    category: "body",
    keywords: ["sunscreen", "sun protection", "spf"],
  },
  {
    id: "medicine",
    label: "Medicine",
    category: "body",
    keywords: [
      "medicine",
      "medication",
      "medications",
      "vitamin",
      "vitamins",
      "supplements",
      "pill",
      "pills",
    ],
  },
  {
    id: "balance",
    label: "Balance",
    category: "body",
    keywords: ["balance", "balancing", "stability", "stand on one leg"],
  },
  {
    id: "bodyweight",
    label: "Bodyweight",
    category: "body",
    keywords: [
      "bodyweight",
      "calisthenics",
      "push ups",
      "push up",
      "pushups",
      "pushup",
      "sit ups",
      "sit up",
      "situps",
      "situp",
      "plank",
      "planks",
      "squats",
      "squat",
      "lunges",
      "lunge",
      "crunches",
      "pull ups",
      "pullups",
      "burpees",
    ],
  },
  {
    id: "martial-arts",
    label: "Martial arts",
    category: "body",
    keywords: [
      "martial arts",
      "karate",
      "judo",
      "jiu jitsu",
      "bjj",
      "taekwondo",
      "kung fu",
    ],
  },
  {
    id: "table-tennis",
    label: "Table tennis",
    category: "body",
    keywords: ["table tennis", "ping pong"],
  },
  {
    id: "badminton",
    label: "Badminton",
    category: "body",
    keywords: ["badminton", "squash", "pickleball"],
  },
  {
    id: "baseball",
    label: "Baseball",
    category: "body",
    keywords: ["baseball", "softball"],
  },
  {
    id: "golf",
    label: "Golf",
    category: "body",
    keywords: ["golf", "golfing", "putting"],
  },
  {
    id: "bowling",
    label: "Bowling",
    category: "body",
    keywords: ["bowling", "bowl"],
  },
  {
    id: "sailing",
    label: "Sailing",
    category: "body",
    keywords: ["sail", "sailing"],
  },
  {
    id: "wake",
    label: "Wake up",
    category: "body",
    keywords: [
      "wake up",
      "waking up",
      "wake early",
      "wake up early",
      "get up early",
    ],
  },
  {
    id: "eye-rest",
    label: "Rest your eyes",
    category: "body",
    keywords: [
      "rest eyes",
      "rest my eyes",
      "rest your eyes",
      "eye rest",
      "eye break",
      "eye exercises",
    ],
  },
  {
    id: "grounding",
    label: "Grounding",
    category: "mind",
    keywords: ["grounding", "ground yourself", "ground myself", "grounded"],
  },
  {
    id: "mood",
    label: "Mood check",
    category: "mind",
    keywords: [
      "mood",
      "mood check",
      "feelings",
      "emotions",
      "emotional check in",
    ],
  },
  {
    id: "intention",
    label: "Set intentions",
    category: "mind",
    keywords: [
      "intention",
      "intentions",
      "set goals",
      "goal setting",
      "visualization",
    ],
  },
  {
    id: "mindful-eating",
    label: "Mindful eating",
    category: "mind",
    keywords: ["mindful eating", "eat slowly", "slow eating", "chew slowly"],
  },
  {
    id: "birdwatch",
    label: "Birdwatch",
    category: "mind",
    keywords: ["birdwatch", "birdwatching", "bird watching", "spot birds"],
  },
  {
    id: "therapy",
    label: "Talk it through",
    category: "mind",
    keywords: ["therapy", "counseling", "counselling", "talk it through"],
  },
  {
    id: "boundaries",
    label: "Boundaries",
    category: "mind",
    keywords: ["boundaries", "set boundaries", "say no"],
  },
  {
    id: "celebrate",
    label: "Celebrate",
    category: "mind",
    keywords: ["celebrate", "celebration", "small wins", "daily wins"],
  },
  {
    id: "flashcards",
    label: "Flashcards",
    category: "learn",
    keywords: ["flashcards", "flash cards", "anki", "spaced repetition"],
  },
  {
    id: "speaking",
    label: "Public speaking",
    category: "learn",
    keywords: [
      "public speaking",
      "presentation",
      "presentations",
      "speech",
      "speeches",
      "toastmasters",
    ],
  },
  {
    id: "ideas",
    label: "Ideas",
    category: "learn",
    keywords: ["ideas", "brainstorm", "brainstorming", "ideation"],
  },
  {
    id: "astronomy",
    label: "Astronomy",
    category: "learn",
    keywords: ["astronomy", "space", "planets", "stargazing", "stars"],
  },
  {
    id: "electronics",
    label: "Electronics",
    category: "learn",
    keywords: ["electronics", "circuits", "robotics", "arduino", "soldering"],
  },
  {
    id: "woodwork",
    label: "Woodwork",
    category: "learn",
    keywords: ["woodwork", "woodworking", "carpentry"],
  },
  {
    id: "origami",
    label: "Origami",
    category: "learn",
    keywords: ["origami", "paper folding", "paper craft"],
  },
  {
    id: "models",
    label: "Build models",
    category: "learn",
    keywords: ["model building", "build models", "model making", "lego"],
  },
  {
    id: "history",
    label: "History",
    category: "learn",
    keywords: ["history", "historical"],
  },
  {
    id: "geography",
    label: "Geography",
    category: "learn",
    keywords: ["geography", "maps", "capitals", "countries"],
  },
  {
    id: "typing",
    label: "Typing",
    category: "learn",
    keywords: ["typing", "touch typing", "typing practice"],
  },
  {
    id: "statistics",
    label: "Statistics",
    category: "learn",
    keywords: ["statistics", "data analysis", "probability"],
  },
  {
    id: "groceries",
    label: "Groceries",
    category: "life",
    keywords: ["groceries", "grocery", "shopping list"],
  },
  {
    id: "wash-hands",
    label: "Wash hands",
    category: "life",
    keywords: ["wash hands", "wash my hands", "hand washing", "handwashing"],
  },
  {
    id: "repair",
    label: "Fix things",
    category: "life",
    keywords: ["repair", "repairs", "fix things", "maintenance", "diy"],
  },
  {
    id: "email",
    label: "Inbox",
    category: "life",
    keywords: ["email", "emails", "inbox", "inbox zero"],
  },
  {
    id: "volunteer",
    label: "Volunteer",
    category: "life",
    keywords: ["volunteer", "volunteering", "community service"],
  },
  {
    id: "family",
    label: "Family time",
    category: "life",
    keywords: [
      "family time",
      "family dinner",
      "time with family",
      "parenting",
      "kids",
      "children",
    ],
  },
  {
    id: "travel",
    label: "Travel",
    category: "life",
    keywords: ["travel", "traveling", "travelling", "trip", "packing"],
  },
  {
    id: "dog-walk",
    label: "Walk the dog",
    category: "life",
    keywords: [
      "dog walk",
      "walk dog",
      "walk the dog",
      "walk my dog",
      "walking the dog",
      "walking my dog",
    ],
  },
  {
    id: "aquarium",
    label: "Aquarium",
    category: "life",
    keywords: ["aquarium", "fish tank", "feed fish", "feed the fish"],
  },
  {
    id: "errands",
    label: "Errands",
    category: "life",
    keywords: ["errands", "tasks", "to do", "checklist"],
  },
  {
    id: "roast",
    label: "Roast",
    category: "life",
    keywords: ["roast", "roasting", "oven"],
  },
  {
    id: "digital-tidy",
    label: "Digital tidy",
    category: "life",
    keywords: [
      "digital tidy",
      "organize files",
      "organise files",
      "sort photos",
      "clear downloads",
      "digital declutter",
    ],
  },
] as const satisfies readonly HabitSymbolDefinition[];

export interface HabitSymbol extends HabitSymbolDefinition {
  id: (typeof habitSymbols)[number]["id"];
}

const legacySymbols: Record<string, HabitSymbol["id"]> = {
  "↗": "walk",
  "∿": "stretch",
  "💧": "water",
  "○": "meditate",
  "▭": "read",
  "✎": "journal",
  "◇": "workout",
  "▢": "food",
  "●": "spark",
};

export const symbolGlyph = (id: string) => `symbol:${id}`;

export const findHabitSymbol = (glyph: string) => {
  const id = glyph.startsWith("symbol:")
    ? glyph.slice(7)
    : legacySymbols[glyph];
  return habitSymbols.find((symbol) => symbol.id === id);
};

const normalizeWords = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export const suggestHabitSymbol = (name: string) => {
  const phrase = ` ${normalizeWords(name)} `;
  let bestMatch: HabitSymbol | undefined;
  let longestMatch = 0;
  for (const symbol of habitSymbols) {
    for (const keyword of symbol.keywords) {
      if (keyword.length > longestMatch && phrase.includes(` ${keyword} `)) {
        bestMatch = symbol;
        longestMatch = keyword.length;
      }
    }
  }
  return bestMatch;
};

export const defaultHabitSymbol = habitSymbols.find(
  (symbol) => symbol.id === "spark",
)!;

export const searchHabitSymbols = (
  query: string,
  category: HabitCategory | "all",
) => {
  const words = normalizeWords(query).split(" ").filter(Boolean);
  const matches = habitSymbols.filter((symbol) => {
    if (category !== "all" && symbol.category !== category) {
      return false;
    }

    const searchable = normalizeWords(
      [symbol.label, ...symbol.keywords].join(" "),
    );
    return words.every((word) => searchable.includes(word));
  });
  if (matches.length > 0) {
    return matches;
  }

  const suggested = suggestHabitSymbol(query);
  if (suggested && (category === "all" || suggested.category === category)) {
    return [suggested];
  }

  return [];
};
