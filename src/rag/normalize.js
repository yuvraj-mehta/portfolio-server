import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ---------- ESM-safe __dirname ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------- Paths ---------- */
const INPUT_FILE = path.join(__dirname, "../data/portfolio.latest.json");
const OUTPUT_FILE = path.join(__dirname, "../data/normalized.json");

/* ---------- Utilities ---------- */
function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error("Failed to read/parse input file:", e.message);
    process.exit(1);
  }
}

function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function mkId(prefix, title) {
  return `${prefix}-${slugify(title || "item")}`;
}

function cleanText(s) {
  if (!s) return "";
  return String(s)
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

/* ---------- Grammar Guard ---------- */
function toFirstPerson(text) {
  return cleanText(text)
    .replace(/^i\s+/i, "I ")
    .replace(/^i\s+am\s+/i, "I am ")
    .replace(/^i\s+as\s+/i, "As a ")
    .replace(/^i\s+when/i, "When")
    .replace(/^as a/i, "As a")
    .replace(/^when i/i, "When I")
    .replace(/^\w/, c => c.toUpperCase());
}

function pushChunk(arr, chunk) {
  arr.push({
    id: chunk.id || mkId(chunk.chunkType, chunk.title),
    chunkType: chunk.chunkType,
    source: chunk.source,
    title: chunk.title,
    tags: chunk.tags || [],
    text: toFirstPerson(chunk.text),
    meta: chunk.meta || {},
    shouldEmbed: chunk.shouldEmbed !== false
  });
}

/* ---------- Main Normalizer ---------- */
export function normalizePortfolio() {
  const profile = safeReadJson(INPUT_FILE);
  const chunks = [];
  const name = profile.personalInfo?.name || "User";
  const p = profile.personalInfo || {};

  /* ---------- Meta ---------- */
  if (profile.meta) {
    pushChunk(chunks, {
      chunkType: "meta",
      source: "meta",
      title: `Profile metadata for ${name}`,
      tags: ["meta"],
      text: `This profile belongs to ${profile.meta.owner || name} and is currently at version ${profile.meta.version}.`,
      shouldEmbed: false
    });
  }

  /* ---------- Meta Audit ---------- */
  if (profile._savedAt || profile.meta?.owner) {
    pushChunk(chunks, {
      chunkType: "metaAudit",
      source: "meta",
      title: `${name} — Profile Audit`,
      tags: ["meta", "audit"],
      text: `This profile is owned by ${profile.meta?.owner || name} and was last saved at ${profile._savedAt}.`,
      meta: {
        owner: profile.meta?.owner,
        savedAt: profile._savedAt
      },
      shouldEmbed: false
    });
  }

  /* ---------- Identity ---------- */
  pushChunk(chunks, {
    chunkType: "identity",
    source: "personalInfo",
    title: `${name} — Overview`,
    tags: ["identity"],
    text: `I am ${name}, a ${p.title}. I am a B.Tech Computer Science student at ${p.university} and currently based in ${p.currentLocation || p.location}.`
  });

  /* ---------- Contact & Availability ---------- */
  pushChunk(chunks, {
    chunkType: "contact",
    source: "personalInfo",
    title: `${name} — Contact & Availability`,
    tags: ["contact", "availability"],
    text: `I can be contacted via email at ${p.email} and phone at ${p.phone}. I am currently ${profile.careerPreferences?.availability} and prefer ${profile.careerPreferences?.workModePreferences?.join(", ")} work modes. I operate in the ${p.timezone} timezone.`,
    meta: {
      email: p.email,
      phone: p.phone,
      availability: profile.careerPreferences?.availability,
      workModes: profile.careerPreferences?.workModePreferences,
      timezone: p.timezone,
      location: p.location,
      currentLocation: p.currentLocation
    }
  });

  /* ---------- Social Links ---------- */
  if (profile.socialLinks) {
    pushChunk(chunks, {
      chunkType: "social",
      source: "socialLinks",
      title: `${name} — Social & Coding Profiles`,
      tags: ["social"],
      text: `I maintain active profiles across platforms such as GitHub, LinkedIn, LeetCode, CodeChef, Codeforces, GeeksForGeeks, Twitter, and Instagram.`,
      meta: profile.socialLinks,
      shouldEmbed: false
    });
  }

  /* ---------- Bio ---------- */
  if (p.bio && typeof p.bio === "object") {
    Object.entries(p.bio).forEach(([k, v]) => {
      pushChunk(chunks, {
        chunkType: "bio",
        source: "personalInfo",
        title: `${name} — Bio (${k})`,
        tags: ["bio", k],
        text: v
      });
    });
  }

  /* ---------- Career Preferences ---------- */
  if (profile.careerPreferences) {
    const cp = profile.careerPreferences;
    pushChunk(chunks, {
      chunkType: "careerPreference",
      source: "careerPreferences",
      title: `${name} — Career Preferences`,
      tags: ["career"],
      text: `I am seeking ${cp.jobTypes?.join(" and ")} roles such as ${cp.targetRoles?.join(", ")} in domains including ${cp.preferredDomains?.join(", ")}.`
    });
  }

  /* ---------- Interests ---------- */
  profile.interests?.forEach(it => {
    pushChunk(chunks, {
      chunkType: "interest",
      source: "interests",
      title: it.name,
      tags: ["interest"],
      text: `When I'm not coding, I enjoy ${it.description}.`
    });
  });

  /* ---------- Education ---------- */
  profile.education?.forEach(edu => {
    pushChunk(chunks, {
      chunkType: "education",
      source: "education",
      title: `${edu.degree} — ${edu.institution}`,
      tags: ["education"],
      text: `${edu.degree} at ${edu.institution}. Duration: ${edu.duration}. Courses include ${edu.courses?.join(", ")}. Activities include ${edu.activities?.length ? edu.activities.join(", ") : "academic coursework"}.`,
      meta: {
        location: edu.location,
        status: edu.status,
        cgpa: edu.cgpa || edu.percentage
      }
    });
  });

  /* ---------- Achievements ---------- */
  profile.achievements?.awards?.forEach(a => {
    pushChunk(chunks, {
      chunkType: "achievement",
      source: "achievements",
      title: a.title,
      tags: ["achievement"],
      text: `I earned the ${a.title} in ${a.year}. ${a.description}`
    });
  });

  /* ---------- Competitive Programming Stats ---------- */
  const cps = profile.achievements?.competitiveProgramming;

  if (cps?.leetcode) {
    pushChunk(chunks, {
      chunkType: "stat",
      source: "achievements",
      title: "LeetCode Performance",
      tags: ["leetcode", "competitive-programming"],
      text: `I have a LeetCode rating of ${cps.leetcode.rating} with a maximum rating of ${cps.leetcode.maxRating}. I rank in the top ${cps.leetcode.percentile} globally with a global rank of ${cps.leetcode.globalRanking} and have solved ${cps.leetcode.problemsSolved} problems.`
    });
  }

  if (cps?.codechef) {
    pushChunk(chunks, {
      chunkType: "stat",
      source: "achievements",
      title: "CodeChef Performance",
      tags: ["codechef", "competitive-programming"],
      text: `I am a ${cps.codechef.stars} rated CodeChef programmer competing in ${cps.codechef.division}. My rating is ${cps.codechef.rating} with a maximum of ${cps.codechef.maxRating}.`
    });
  }

  if (cps?.codeforces) {
    pushChunk(chunks, {
      chunkType: "stat",
      source: "achievements",
      title: "Codeforces Performance",
      tags: ["codeforces", "competitive-programming"],
      text: `I have a Codeforces rating of ${cps.codeforces.rating} with a maximum of ${cps.codeforces.maxRating}. My rank is ${cps.codeforces.rank} and I have solved ${cps.codeforces.problemsSolved} problems.`
    });
  }

  if (cps?.geeksforgeeks) {
    pushChunk(chunks, {
      chunkType: "stat",
      source: "achievements",
      title: "GeeksForGeeks Performance",
      tags: ["geeksforgeeks", "competitive-programming"],
      text: `I have solved ${cps.geeksforgeeks.problemsSolved} problems on GeeksForGeeks and hold a global rank of ${cps.geeksforgeeks.rank}.`
    });
  }

  /* ---------- Overall Stats ---------- */
  const overall = profile.achievements?.overallStats;
  if (overall) {
    pushChunk(chunks, {
      chunkType: "stat",
      source: "achievements",
      title: "Overall Coding Statistics",
      tags: ["stats"],
      text: `I have over ${overall.yearsExperience} years of coding experience, made more than ${overall.commits} commits, and solved over ${overall.totalProblemsSolved} algorithmic problems.`
    });
  }

  /* ---------- Experience ---------- */
  profile.experience?.forEach(ex => {
    pushChunk(chunks, {
      chunkType: "experience",
      source: "experience",
      title: `${ex.role} at ${ex.organization}`,
      tags: ["experience"],
      text: `As a ${ex.role} at ${ex.organization}, I ${ex.description}`,
      meta: { skills: ex.skills, location: ex.location }
    });
  });

  /* ---------- Projects ---------- */
  profile.projects?.forEach(prj => {
    const desc = prj.description.replace(
      new RegExp(`^${prj.name}\\s+is\\s+`, "i"),
      ""
    );

    pushChunk(chunks, {
      chunkType: "project",
      source: "projects",
      title: `${prj.name} — ${prj.status}`,
      tags: ["project", prj.category],
      text: `I built ${prj.name}, ${desc}. I used ${prj.techStack.join(", ")} to implement features such as ${prj.features.join(", ")}.`,
      meta: prj.links
    });
  });

  /* ---------- Skills ---------- */
  Object.entries(profile.skills || {}).forEach(([cat, skills]) => {
    pushChunk(chunks, {
      chunkType: "skill",
      source: "skills",
      title: `Skills — ${cat}`,
      tags: ["skills", cat],
      text: `I am proficient in ${skills.join(", ")}.`
    });
  });

  /* ---------- Persist ---------- */
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), count: chunks.length, chunks },
      null,
      2
    )
  );

  console.log(`✅ Normalized ${chunks.length} chunks written to ${OUTPUT_FILE}`);
  return chunks;
}

/* ---------- Run Directly ---------- */
if (process.argv[1] === __filename) {
  normalizePortfolio();
}
