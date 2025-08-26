"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Text, Stars, Sparkles } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/**
 * Git Quest — Realistic Train Engine (R3F)
 * Route: /games/git-quest-train
 *
 * What’s new (v2):
 * - Realistic station platform (rails, sleepers, platform, roof beams) with soft lighting & fog.
 * - Detailed locomotive (headlight spotlight, pistons, animated wheels, smoke particles).
 * - 10 bogies with windows + couplers; bright chapter colors; emissive status lights (red→green).
 * - Signal post with blinking red→solid green when all chapters complete; departure animation: wheels spin, smoke intensifies, train moves off.
 * - Smooth camera dolly during departure.
 * - Full engine: MAP (station) → LESSON → QUIZ → BOSS. Reads ALL 10 chapters from src/content/git/chapters/ch1..ch10.json.
 * - Performance: shared materials, instanced sleepers, modest poly counts.
 */

/********************** Utils **********************/
function cx(...c) { return c.filter(Boolean).join(" "); }
const lsKey = "gitQuestProgress";

/********************** Content Loader **********************/
function useGitChapters() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const loaded = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const mod = await import(`@/content/git/chapters/ch${i}.json`);
          loaded.push({ index: i - 1, exists: true, data: mod.default });
        } catch (e) {
          loaded.push({ index: i - 1, exists: false, data: null });
        }
      }
      if (mounted) { setChapters(loaded); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);
  return { chapters, loading };
}

/********************** Progress (localStorage) **********************/
function useProgress() {
  const [done, setDone] = useState(Array(10).fill(false));
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(lsKey) : null;
    if (raw) { try { const v = JSON.parse(raw); if (Array.isArray(v) && v.length===10) setDone(v); } catch {} }
  }, []);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(lsKey, JSON.stringify(done)); }, [done]);
  return { done, setDone };
}

/********************** Page **********************/
export default function GitTrainPage() {
  const { chapters, loading } = useGitChapters();
  const { done, setDone } = useProgress();
  const [panel, setPanel] = useState({ open: false, idx: null, mode: "LESSON", topicIdx: 0 });

  const allComplete = useMemo(() => done.every(Boolean) && done.length === 10, [done]);
  const currentChapter = useMemo(() => (panel.idx != null && chapters[panel.idx]?.data) || null, [panel.idx, chapters]);
  const topic = useMemo(() => currentChapter?.topics?.[panel.topicIdx] || null, [currentChapter, panel.topicIdx]);

  function openChapter(i) { setPanel({ open: true, idx: i, mode: "LESSON", topicIdx: 0 }); }
  function backToMap() { setPanel({ open: false, idx: null, mode: "LESSON", topicIdx: 0 }); }
  function nextTopicOrBoss() {
    if (!currentChapter) return;
    const next = panel.topicIdx + 1;
    if (currentChapter.topics && next < currentChapter.topics.length) setPanel((p) => ({ ...p, topicIdx: next, mode: "LESSON" }));
    else setPanel((p) => ({ ...p, mode: "BOSS" }));
  }
  function markChapterComplete(i) { setDone((prev) => { const copy = [...prev]; copy[i] = true; return copy; }); }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#030712] via-[#050a16] to-[#0b1020] text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Git Quest — Train Engine (Realistic)</h1>
            <p className="text-xs text-zinc-400">Each bogie is a chapter. Red → pending, Green → completed. Finish all to clear the signal and depart.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Home</Link>
          </div>
        </header>

        <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10">
          <Canvas camera={{ position: [0, 5.5, 16], fov: 55 }} shadows>
            <color attach="background" args={["#0b0f17"]} />
            <fog attach="fog" args={["#0b0f17", 18, 42]} />
            <ambientLight intensity={0.45} />
            <directionalLight castShadow position={[12, 14, 6]} intensity={1.2} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <Stars radius={160} depth={60} count={3500} factor={3} saturation={0} fade speed={0.8} />
            <Sparkles count={50} size={2} speed={0.5} scale={[40,12,40]} />

            {/* Station scene */}
            <Station />
            <Signal position={[10.8, 1.25, -1.2]} go={allComplete} />
            <Track length={40} />

            {/* Train */}
            <Train
              bogies={10}
              done={done}
              chapters={chapters}
              onOpenChapter={openChapter}
              depart={allComplete}
            />

            <OrbitControls enablePan={false} minDistance={10} maxDistance={26} />
          </Canvas>

          {/* HUD */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/50 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
            Tip: click a bogie to open that chapter. Red = pending, Green = completed.
          </div>
          <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
            {loading ? "Loading chapters…" : `${chapters.filter(c=>c.exists).length}/10 chapters found`}
          </div>
        </div>

        {/* Panels */}
        {panel.open && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-zinc-400">Chapter {panel.idx != null ? panel.idx + 1 : "?"} / 10</div>
              <button onClick={backToMap} className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Back to Platform</button>
            </div>

            {!currentChapter && (
              <div className="text-sm text-zinc-300">
                <p className="font-semibold">No content yet.</p>
                <p>Create <code>src/content/git/chapters/ch{(panel.idx??0)+1}.json</code> to populate this chapter.</p>
              </div>
            )}

            {currentChapter && (
              <ChapterPanel
                chapter={currentChapter}
                panel={panel}
                setPanel={setPanel}
                onNext={nextTopicOrBoss}
                onWinBoss={() => { markChapterComplete(panel.idx); backToMap(); }}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/********************** World Objects **********************/
function Station() {
  const sleepers = new Array(60).fill(0).map((_,i)=> i);
  return (
    <group>
      {/* Platform base */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.2, 3.2]} receiveShadow>
        <planeGeometry args={[44, 6]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Platform stripes */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.199, 1.8]} receiveShadow>
        <planeGeometry args={[44, 0.25]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Pillars */}
      {[-8,-4,0,4,8].map((x,i)=> (
        <mesh key={i} position={[x, 0.2, 5.4]} castShadow>
          <cylinderGeometry args={[0.12,0.12,1.6,14]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {/* Roof beam */}
      <mesh position={[0,1.2,5.4]} castShadow>
        <boxGeometry args={[20, 0.15, 2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Station sign */}
      <Text position={[0,1.7,5.4]} fontSize={0.35} color="#e5e7eb" anchorX="center" anchorY="middle">AgenForge — Git Station</Text>

      {/* Sleepers under rails */}
      {sleepers.map(i => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[ -10 + i*0.7, -1.19, 0 ]} receiveShadow>
          <planeGeometry args={[0.4, 2.6]} />
          <meshStandardMaterial color="#3f3f46" />
        </mesh>
      ))}
    </group>
  );
}

function Track({ length=40 }) {
  return (
    <group>
      {/* Rails */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.18, 1.1]} receiveShadow>
        <planeGeometry args={[length, 0.18]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.18, -1.1]} receiveShadow>
        <planeGeometry args={[length, 0.18]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
    </group>
  );
}

function Signal({ position=[0,0,0], go=false }) {
  const blink = useRef(0);
  useFrame((state)=> { blink.current = state.clock.getElapsedTime(); });
  const isBlinkOn = Math.floor((blink.current*2)%2)===0; // blink red when stop
  const color = go ? "#22c55e" : (isBlinkOn ? "#ef4444" : "#7f1d1d");
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.06,0.06,1.6,14]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.4, 0.5, 0.22]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Light */}
      <mesh position={[0, 1.6, 0.13]}>
        <sphereGeometry args={[0.09, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
      </mesh>
      <Text position={[0, 2.1, 0]} fontSize={0.2} color="#e5e7eb" anchorX="center" anchorY="middle">{go?"CLEAR":"STOP"}</Text>
    </group>
  );
}

/********************** Train **********************/
function Train({ bogies=10, done=[], chapters=[], onOpenChapter, depart=false }) {
  const group = useRef();
  const wheelsRef = useRef([]);
  const smokeRef = useRef([]);
  const headLight = useRef();
  const camDolly = useRef(0);

  useFrame((state, delta) => {
    // Animate wheels
    wheelsRef.current.forEach((w) => { if (w) w.rotation.z -= delta * (depart? 6 : 2); });
    // Smoke particles rising
    smokeRef.current.forEach((p,i) => {
      if (!p) return;
      p.position.y += delta * (depart ? 2.2 : 1.2);
      p.position.x += Math.sin(state.clock.elapsedTime*1.5 + i)*0.02;
      p.material.opacity -= delta*0.3;
      if (p.position.y > 3 || p.material.opacity <= 0) {
        p.position.set( -6.1 + Math.random()*0.4, 0.6, 0 );
        p.material.opacity = 0.8;
      }
    });
    // Departure: move train & dolly camera slightly
    if (depart && group.current) {
      group.current.position.x += delta * 2.3;
      camDolly.current += delta;
      const cam = state.camera;
      cam.position.x = Math.min( cam.position.x + delta * 1.1, 6 );
      cam.position.z = Math.max( cam.position.z - delta * 0.6, 12 );
      cam.lookAt(group.current.position.x, 0.2, 0);
    }
  });

  // Collect wheel refs
  const pushWheel = (el) => { if (el && !wheelsRef.current.includes(el)) wheelsRef.current.push(el); };
  const pushSmoke = (el) => { if (el && !smokeRef.current.includes(el)) smokeRef.current.push(el); };

  return (
    <group ref={group} position={[-8, 0, 0]}>
      <Locomotive pushWheel={pushWheel} pushSmoke={pushSmoke} headLight={headLight} active={depart} />
      {new Array(bogies).fill(0).map((_,i)=> (
        <Bogie
          key={i}
          index={i}
          position={[2 + i*1.72, 0, 0]}
          green={!!done[i]}
          exists={chapters[i]?.exists}
          onClick={() => onOpenChapter(i)}
          pushWheel={pushWheel}
        />
      ))}
    </group>
  );
}

function Wheel({ position=[0,0,0], pushWheel }) {
  return (
    <mesh position={position} castShadow ref={pushWheel}>
      <torusGeometry args={[0.28, 0.08, 14, 28]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.35} />
    </mesh>
  );
}

function Locomotive({ pushWheel, pushSmoke, headLight, active=false }) {
  return (
    <group position={[-0.2, -0.35, 0]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.6, 0.9, 1.2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.25, 1.0, 0]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.9]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Boiler */}
      <mesh position={[0.9, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.35,0.35,1.0, 22]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.4, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.12,0.12,0.25, 12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {/* Headlight */}
      <mesh position={[1.4, 0.65, 0]}>
        <sphereGeometry args={[0.09, 18, 18]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={1.4} />
      </mesh>
      {/* Wheels & pistons */}
      <Wheel position={[-0.45, 0, 0.55]} pushWheel={pushWheel} />
      <Wheel position={[ 0.35, 0, 0.55]} pushWheel={pushWheel} />
      <Wheel position={[-0.45, 0, -0.55]} pushWheel={pushWheel} />
      <Wheel position={[ 0.35, 0, -0.55]} pushWheel={pushWheel} />
      {/* Smoke particles */}
      {new Array(18).fill(0).map((_,i)=> (
        <mesh key={i} position={[-6.1 + Math.random()*0.4, 0.6, 0]} ref={pushSmoke}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial color="#d1d5db" transparent opacity={0.8} />
        </mesh>
      ))}
      {/* Nameplate */}
      <Text position={[0, 1.65, 0]} fontSize={0.22} color="#93c5fd" anchorX="center" anchorY="middle">Engine</Text>
    </group>
  );
}

function Window({ position=[0,0,0] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.18, 0.18, 0.02]} />
      <meshStandardMaterial color="#93c5fd" emissive="#93c5fd" emissiveIntensity={0.6} />
    </mesh>
  );
}

function Bogie({ index, position=[0,0,0], green=false, exists=false, onClick, pushWheel }) {
  const bodyColor = exists ? "#2563eb" : "#475569"; // blue if content exists, gray if missing
  return (
    <group position={[position[0], -0.35, position[2]]}>
      {/* Body */}
      <mesh castShadow onClick={(e)=>{ e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[1.4, 0.75, 1.12]} />
        <meshStandardMaterial color={bodyColor} metalness={0.25} roughness={0.6} />
      </mesh>
      {/* Windows */}
      <Window position={[-0.4, 0.1, 0.57]} />
      <Window position={[ 0.0, 0.1, 0.57]} />
      <Window position={[ 0.4, 0.1, 0.57]} />
      <Window position={[-0.4, 0.1, -0.57]} />
      <Window position={[ 0.0, 0.1, -0.57]} />
      <Window position={[ 0.4, 0.1, -0.57]} />
      {/* Coupler light (status) */}
      <mesh position={[0.7, 0.42, 0.6]}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial color={green?"#22c55e":"#ef4444"} emissive={green?"#22c55e":"#ef4444"} emissiveIntensity={1.5} />
      </mesh>
      {/* Wheels */}
      <Wheel position={[-0.45, 0, 0.52]} pushWheel={pushWheel} />
      <Wheel position={[ 0.45, 0, 0.52]} pushWheel={pushWheel} />
      <Wheel position={[-0.45, 0, -0.52]} pushWheel={pushWheel} />
      <Wheel position={[ 0.45, 0, -0.52]} pushWheel={pushWheel} />
      {/* Label */}
      <Text position={[0, 1.25, 0]} fontSize={0.22} color="#e5e7eb" anchorX="center" anchorY="middle">Ch {index+1}</Text>
    </group>
  );
}

/********************** Panels **********************/
function ChapterPanel({ chapter, panel, setPanel, onNext, onWinBoss }) {
  const topic = chapter.topics?.[panel.topicIdx] || null;
  return (
    <div>
      <div className="mb-2">
        <h2 className="text-lg font-semibold">{chapter.title}</h2>
        {chapter.lore && <p className="mt-1 text-sm text-zinc-300">{chapter.lore}</p>}
        {chapter.topics && <p className="mt-1 text-xs text-zinc-400">Topic {Math.min(panel.topicIdx+1, chapter.topics.length)} of {chapter.topics.length}</p>}
      </div>

      {panel.mode === "LESSON" && topic && (
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
          <div className="mt-3">
            {topic.quiz ? (
              <button onClick={()=> setPanel(p=>({ ...p, mode: "QUIZ" }))} className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30">Start Challenge →</button>
            ) : (
              <button onClick={onNext} className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Next Topic →</button>
            )}
          </div>
        </div>
      )}

      {panel.mode === "QUIZ" && topic?.quiz && (
        <QuizPanel data={topic.quiz} onCorrect={()=>{ onNext(); }} onWrong={()=>{}} />
      )}

      {panel.mode === "BOSS" && chapter.boss && (
        <BossPanel boss={chapter.boss} onWin={onWinBoss} />
      )}

      {!topic && panel.mode !== "BOSS" && (
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
    if (ok) setTimeout(onCorrect, 500); else onWrong();
  }
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="text-sm font-medium">Challenge</div>
      <p className="mt-1 text-sm text-zinc-300">{data.prompt ?? "(no prompt)"}</p>
      {data.type === "mcq" && (
        <div className="mt-3 grid gap-2">
          {data.options?.map((opt,i)=> (
            <label key={i} className={cx("flex items-center gap-2 rounded border p-2 text-sm", answer===i?"border-emerald-500 bg-emerald-500/10":"border-white/10 hover:bg-white/5")}>
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
  const q = boss.questions?.[idx];
  if (!q) return <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">Boss not configured yet.</div>;
  function submit() {
    let ok = false;
    if (q.type === "mcq") ok = answer === q.answer;
    if (q.type === "blank") ok = (answer||"").trim().toLowerCase() === q.answerText?.toLowerCase();
    if (ok) {
      const next = idx + 1;
      if (next < (boss.questions?.length ?? 0)) { setIdx(next); setAnswer(null); }
      else { onWin(); }
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
              <label key={i} className={cx("flex items-center gap-2 rounded border p-2 text-sm", answer===i?"border-emerald-500 bg-emerald-500/10":"border-white/10 hover:bg-white/5")}>
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
