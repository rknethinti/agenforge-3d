"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Html, Stars, Sparkles, Text } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/**
 * Git Quest 3D Engine (graphics-first)
 * Route: /games/git-quest-3d
 *
 * What this file gives you today:
 * - A complete 3D world hub with 10 chapter portals (placeholders).
 * - Engine states: MAP → LESSON → QUIZ → BOSS (simplified in this file).
 * - Content loader hook that will look for JSON files at:
 *     src/content/git/chapters/ch1.json ... ch10.json
 *   If a chapter file is missing, the portal still renders but shows "No content yet".
 * - HUD overlay (XP / Coins / Streak) + soft feedback.
 *
 * How to add content later:
 * - Create JSON files (e.g., src/content/git/chapters/ch1.json) that match the shape below.
 * - The engine will automatically pick them up on next build.
 *
 * JSON shape (example):
 * {
 *   "id": "ch1",
 *   "title": "Chapter 1 — The Awakening: What is Git?",
 *   "lore": "Story paragraph...",
 *   "topics": [
 *     { "id":"t1", "title":"Why Git?", "lesson":"...markdown text...",
 *       "demo": { "code": "git --version", "notes": "..." },
 *       "quiz": { "type":"mcq", "prompt":"Git is...", "options":["A","B","C","D"], "answer":1, "explain":"...", "xp":40 }
 *     }
 *   ],
 *   "boss": { "id":"b1", "title":"Boss name", "intro":"...", "questions":[ ...same shape as quiz... ] }
 * }
 */

/**********************
 * SMALL UTILS
 **********************/
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function cx(...c) { return c.filter(Boolean).join(" "); }

/**********************
 * CONTENT LOADER (CLIENT)
 **********************/
function useGitChapters() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const loaded = [];
      // Try importing ch1..ch10; missing files are allowed.
      const importers = [
        () => import(/* webpackMode: "lazy-once" */ "@/content/git/chapters/ch1.json"),
        () => import("@/content/git/chapters/ch2.json"),

      ];
      for (let i = 0; i < importers.length; i++) {
        try {
          const mod = await importers[i]();
          loaded.push({ index: i, exists: true, data: mod.default });
        } catch (e) {
          loaded.push({ index: i, exists: false, data: null });
        }
      }
      if (isMounted) {
        setChapters(loaded);
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return { chapters, loading };
}

/**********************
 * ENGINE PAGE
 **********************/
export default function GitQuest3D() {
  const { chapters, loading } = useGitChapters();
  const [state, setState] = useState("MAP"); // MAP | LESSON | QUIZ | BOSS
  const [current, setCurrent] = useState({ chapterIdx: null, topicIdx: 0 });
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);

  const chapter = useMemo(() => {
    if (current.chapterIdx == null) return null;
    const ch = chapters[current.chapterIdx];
    return ch?.exists ? ch.data : null;
  }, [chapters, current.chapterIdx]);

  function enterChapter(idx) {
    setCurrent({ chapterIdx: idx, topicIdx: 0 });
    setState("LESSON");
  }
  function backToMap() { setState("MAP"); }

  function award(x) {
    const bonus = streak >= 3 ? 10 : 0;
    setXp((v) => v + x + bonus);
    setCoins((v) => v + Math.floor(x / 10));
    setStreak((s) => s + 1);
  }
  function miss() { setStreak(0); }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Git Quest — 3D Engine</h1>
            <p className="text-xs text-zinc-400">Graphics-first world. Chapters auto-load from <code>src/content/git/chapters/</code>.</p>
          </div>
          <div className="flex items-center gap-2">
            <HUDStat label="XP" value={xp} />
            <HUDStat label="Coins" value={coins} />
            <HUDStat label="Streak" value={streak} />
            <Link href="/world" className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/20">World</Link>
            <Link href="/" className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Home</Link>
          </div>
        </header>

        {/* World Canvas */}
        <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10">
          <Canvas camera={{ position: [0, 6, 13], fov: 55 }} shadows>
            <color attach="background" args={["#0b0f17"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[6, 10, 2]} intensity={1.1} castShadow />

            <Stars radius={140} depth={60} count={4500} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={80} scale={[40, 14, 40]} size={2.2} speed={0.5} noise={1} />

            {/* Ground ring */}
            <Float floatIntensity={0.3} rotationIntensity={0.05}>
              <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
                <ringGeometry args={[4.8, 5.2, 64]} />
                <meshStandardMaterial color="#111827" metalness={0.2} roughness={0.8} />
              </mesh>
            </Float>

            {/* 10 portals around a circle */}
            <ChapterRing chapters={chapters} onEnter={enterChapter} />

            <OrbitControls minDistance={7} maxDistance={18} enablePan={false} />
          </Canvas>

          {/* UI Overlays */}
          {state === "MAP" && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-3 text-xs">
              <div className="pointer-events-auto rounded-lg bg-black/50 px-3 py-2 ring-1 ring-white/10">Drag to orbit • Scroll to zoom • Click a glowing node to open a chapter</div>
              <div className="rounded-lg bg-black/50 px-3 py-2 ring-1 ring-white/10">{loading ? "Loading chapters…" : `${chapters.filter(c=>c.exists).length}/10 chapters found`}</div>
            </div>
          )}
        </div>

        {/* Lesson/Quiz/Boss Panels */}
        {state !== "MAP" && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-zinc-400">Chapter {current.chapterIdx != null ? current.chapterIdx + 1 : "?"} / 10</div>
              <button onClick={backToMap} className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Back to Map</button>
            </div>

            {!chapter && (
              <div className="text-sm text-zinc-300">
                <p className="font-semibold">No content yet.</p>
                <p>Create <code>src/content/git/chapters/ch{(current.chapterIdx??0)+1}.json</code> to populate this chapter.</p>
              </div>
            )}

            {chapter && <ChapterPanel chapter={chapter} award={award} miss={miss} />}
          </div>
        )}
      </div>
    </main>
  );
}

/**********************
 * WORLD OBJECTS
 **********************/
function ChapterRing({ chapters, onEnter }) {
  const radius = 6;
  const nodes = new Array(10).fill(0).map((_,i)=>{
    const a = (i/10) * Math.PI * 2;
    return [Math.cos(a)*radius, 0, Math.sin(a)*radius];
  });
  return (
    <group>
      {nodes.map((pos, i) => (
        <ChapterPortal key={i} position={pos} index={i} exists={chapters[i]?.exists} onClick={() => onEnter(i)} />
      ))}
    </group>
  );
}

function ChapterPortal({ position=[0,0,0], index, exists, onClick }) {
  const ref = useRef();
  useFrame((s)=>{
    const t = s.clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(t + index) * 0.25;
    ref.current.rotation.y = Math.sin(t*0.4 + index) * 0.25;
  });
  const color = exists ? "#34d399" : "#6b7280"; // emerald or gray
  return (
    <group position={position}>
      <Float floatIntensity={0.6} rotationIntensity={0.2}>
        <mesh ref={ref} castShadow onClick={(e)=>{ e.stopPropagation(); onClick(); }}>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.2} emissive={color} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0,-1.2,0]}>
          <torusKnotGeometry args={[0.55, 0.13, 80, 16]} />
          <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.85} />
        </mesh>
      </Float>
      <Text position={[0,1.6,0]} fontSize={0.35} color={exists ? "#a7f3d0" : "#cbd5e1"} anchorX="center" anchorY="middle">Ch {index+1}</Text>
    </group>
  );
}

/**********************
 * CHAPTER PANEL (LESSON → QUIZ → BOSS)
 **********************/
function ChapterPanel({ chapter, award, miss }) {
  const [mode, setMode] = useState("LESSON"); // LESSON | QUIZ | BOSS
  const [topicIdx, setTopicIdx] = useState(0);
  const topic = chapter.topics?.[topicIdx] ?? null;

  function nextTopic() {
    const next = topicIdx + 1;
    if (chapter.topics && next < chapter.topics.length) {
      setTopicIdx(next);
      setMode("LESSON");
    } else {
      setMode("BOSS");
    }
  }

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-lg font-semibold">{chapter.title}</h2>
        {chapter.lore && <p className="mt-1 text-sm text-zinc-300">{chapter.lore}</p>}
        {chapter.topics && <p className="mt-1 text-xs text-zinc-400">Topic {Math.min(topicIdx+1, chapter.topics.length)} of {chapter.topics.length}</p>}
      </div>

      {mode === "LESSON" && topic && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="text-sm font-medium">{topic.title}</div>
          {topic.lesson && <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{topic.lesson}</p>}
          {topic.demo?.code && (
            <div className="mt-3 rounded-lg border border-white/10 bg-zinc-950 p-3">
              <div className="mb-1 text-xs text-zinc-400">Try this</div>
              <pre className="overflow-auto text-emerald-300"><code>{topic.demo.code}</code></pre>
              {topic.demo.notes && <p className="mt-2 text-xs text-zinc-400">{topic.demo.notes}</p>}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {topic.quiz ? (
              <button onClick={()=>setMode("QUIZ")} className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30">Start Challenge →</button>
            ) : (
              <button onClick={nextTopic} className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Next Topic →</button>
            )}
          </div>
        </div>
      )}

      {mode === "QUIZ" && topic?.quiz && (
        <QuizPanel data={topic.quiz} onCorrect={(xp)=>{ award(xp); nextTopic(); }} onWrong={()=>{ miss(); }} />
      )}

      {mode === "BOSS" && chapter.boss && (
        <BossPanel boss={chapter.boss} onWin={(total)=>{ award(total); }} />
      )}

      {!topic && mode !== "BOSS" && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">No topics in this chapter yet.</div>
      )}
    </div>
  );
}

function QuizPanel({ data, onCorrect, onWrong }) {
  const [answer, setAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);

  function submit() {
    let ok = false;
    if (data.type === "mcq") ok = answer === data.answer;
    if (data.type === "blank") ok = (answer||"").trim().toLowerCase() === data.answerText?.toLowerCase();
    setFeedback({ ok, msg: ok ? "✅ Correct!" : "❌ Not quite" });
    if (ok) setTimeout(()=> onCorrect(data.xp ?? 30), 600); else onWrong();
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="text-sm font-medium">Challenge</div>
      <p className="mt-1 text-sm text-zinc-300">{data.prompt ?? "(no prompt)"}</p>

      {data.type === "mcq" && (
        <div className="mt-3 grid gap-2">
          {data.options?.map((opt,i)=> (
            <label key={i} className={cx("flex items-center gap-2 rounded border p-2 text-sm", answer===i?"border-emerald-500 bg-emerald-500/10":"border-white/10 hover:bg-white/5") }>
              <input type="radio" checked={answer===i} onChange={()=>setAnswer(i)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {data.type === "blank" && (
        <div className="mt-3 flex gap-2">
          <input className="w-full rounded border border-white/10 bg-black/40 p-2 text-sm outline-none ring-emerald-500/30 focus:ring" value={answer ?? ""} onChange={(e)=>setAnswer(e.target.value)} placeholder="Type answer…" />
          <button onClick={submit} className="shrink-0 rounded bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30">Check</button>
        </div>
      )}

      {data.type === "mcq" && (
        <div className="mt-3 flex justify-end">
          <button onClick={submit} className="rounded bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30">Submit</button>
        </div>
      )}

      {feedback && (
        <div className={cx("mt-2 text-sm", feedback.ok?"text-emerald-300":"text-red-300")}>{feedback.msg} — {data.explain ?? ""}</div>
      )}
    </div>
  );
}

function BossPanel({ boss, onWin }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const q = boss.questions?.[idx];
  if (!q) return <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">Boss not configured yet.</div>;

  function submit() {
    let ok = false;
    if (q.type === "mcq") ok = answer === q.answer;
    if (q.type === "blank") ok = (answer||"").trim().toLowerCase() === q.answerText?.toLowerCase();
    if (ok) {
      const gained = q.xp ?? 50;
      const next = idx + 1;
      setScore((s)=> s + gained);
      if (next < (boss.questions?.length ?? 0)) {
        setIdx(next); setAnswer(null);
      } else { onWin(score + gained); }
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="text-sm font-medium">{boss.title ?? "Boss"}</div>
      <p className="mt-1 text-sm text-zinc-300">{boss.intro ?? "Prove your mastery."}</p>

      <div className="mt-3">
        <p className="text-sm text-zinc-200">{q.prompt ?? "(no prompt)"}</p>
        {q.type === "mcq" && (
          <div className="mt-3 grid gap-2">
            {q.options?.map((opt,i)=> (
              <label key={i} className={cx("flex items-center gap-2 rounded border p-2 text-sm", answer===i?"border-emerald-500 bg-emerald-500/10":"border-white/10 hover:bg-white/5") }>
                <input type="radio" checked={answer===i} onChange={()=>setAnswer(i)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
        {q.type === "blank" && (
          <input className="mt-3 w-full rounded border border-white/10 bg-black/40 p-2 text-sm" value={answer ?? ""} onChange={(e)=>setAnswer(e.target.value)} />
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <button onClick={submit} className="rounded bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30">Submit</button>
      </div>
    </div>
  );
}

/**********************
 * HUD
 **********************/
function HUDStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
      <div className="text-[10px] text-zinc-400">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
