import Link from "next/link";

// AgenForge Landing Page (Next.js App Router)
// Drop this file at: app/page.jsx
// TailwindCSS required. No external UI libraries used.
// The Git game lives at: app/games/git-quest-train/page.jsx → route "/games/git-quest-train".
// Add more game pages at: app/games/<slug>/page.jsx and update the cards below.

export const metadata = {
  title: "AgenForge — Gamified DevOps Learning",
  description:
    "Master DevOps through quick, fun game quests. Git, Docker, Kubernetes, Jenkins, Terraform and more.",
};

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Navbar />
        <Hero />
        <GameGrid />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}

function Navbar() {
  return (
    <header className="flex items-center justify-between py-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">AF</span>
        <span className="text-lg font-semibold tracking-tight">AgenForge</span>
      </Link>
      <nav className="hidden gap-6 text-sm text-zinc-300 sm:flex">
        <Link href="#games" className="hover:text-emerald-300">Games</Link>
        <Link href="#how" className="hover:text-emerald-300">How it works</Link>
        <Link href="#pricing" className="hover:text-emerald-300">Pricing</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/games/git-quest-train" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20">
          Play Git Quest
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/5 to-black p-6 sm:p-10 shadow-2xl backdrop-blur">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Gamified <span className="text-emerald-400">DevOps</span> Learning
          </h1>
          <p className="mt-3 max-w-prose text-zinc-300">
            Learn Git, Docker, Kubernetes, Jenkins, Terraform and more through quick missions,
            XP, coins, and boss battles. Built for speed-learning and real skills.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* IMPORTANT: this links to app/games/git-quest-train/page.jsx → "/games/git-quest-train" */}
            <Link
              href="/games/git-quest-train"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-black shadow-lg hover:bg-emerald-400"
            >
              Start Git Quest →
            </Link>
            <Link
              href="#games"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-base font-medium text-zinc-100 hover:bg-white/10"
            >
              Browse All Games
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400" id="how">
            No signup needed for beta. Play in the browser. Save progress coming soon.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <ul className="grid grid-cols-2 gap-3 text-sm text-zinc-200">
            <li className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">⚡ 3–5 min micro-levels</li>
            <li className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">🪙 Earn coins & XP</li>
            <li className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">🏆 Badges & streaks</li>
            <li className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">🧪 Real CLI scenarios</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function GameGrid() {
  const games = [
    {
      slug: "git-quest",
      title: "Git Quest",
      desc: "Init, config, commits, branches, remotes.",
      level: "Beginner • 3 levels",
      href: "/games/git-quest-train",
      status: "live",
      emoji: "🗡️",
    },
    {
      slug: "docker-dungeon",
      title: "Docker Dungeon",
      desc: "Images, containers, ports, volumes.",
      level: "Beginner • 3 levels",
      href: "/games/docker-dungeon",
      status: "soon",
      emoji: "🧱",
    },
    {
      slug: "k8s-arena",
      title: "Kubernetes Arena",
      desc: "Pods, Deployments, Services, rollouts.",
      level: "Intermediate • 4 levels",
      href: "/games/k8s-arena",
      status: "soon",
      emoji: "🛡️",
    },
    {
      slug: "jenkins-runner",
      title: "Jenkins Runner",
      desc: "Pipelines, agents, triggers, artifacts.",
      level: "Intermediate • 4 levels",
      href: "/games/jenkins-runner",
      status: "soon",
      emoji: "🏃",
    },
    {
      slug: "terraform-trials",
      title: "Terraform Trials",
      desc: "HCL, plan/apply, state & modules.",
      level: "Intermediate • 4 levels",
      href: "/games/terraform-trials",
      status: "soon",
      emoji: "🗺️",
    },
  ];

  return (
    <section id="games" className="mx-auto mt-12 max-w-6xl">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-2xl font-semibold">Games</h2>
        <span className="text-xs text-zinc-400">More are coming soon</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
    </section>
  );
}

function GameCard({ game }) {
  const isLive = game.status === "live";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl">
      <div className="flex items-start justify-between">
        <div className="text-3xl">{game.emoji}</div>
        <span
          className={`rounded-lg px-2 py-1 text-xs ${
            isLive
              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
              : "bg-white/10 text-zinc-300"
          }`}
        >
          {isLive ? "Live" : "Coming soon"}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{game.title}</h3>
      <p className="mt-1 text-sm text-zinc-300">{game.desc}</p>
      <p className="mt-2 text-xs text-zinc-400">{game.level}</p>
      <div className="mt-4">
        {isLive ? (
          <Link
            href={game.href}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
          >
            Play now <span aria-hidden>→</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-300"
            title="This quest will unlock soon"
          >
            Locked
          </button>
        )}
      </div>
      {isLive && (
        <div className="pointer-events-none absolute inset-px rounded-[14px] ring-1 ring-emerald-500/20 opacity-0 transition group-hover:opacity-100" />
      )}
    </div>
  );
}

function CTA() {
  return (
    <section id="pricing" className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold">Intro Price — ₹299</h3>
          <p className="mt-2 text-sm text-zinc-300">
            Unlock all current and upcoming quests. Lifetime access for early adopters.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-200">
            <li>All beginner + intermediate quests</li>
            <li>New quests added monthly</li>
            <li>Progress sync (soon)</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/games/git-quest-train" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400">
            Play Git Quest Free
          </Link>
          <button className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm text-zinc-100 hover:bg-white/10">
            Buy Access (Coming Soon)
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-sm text-zinc-400 sm:flex-row">
      <p>© {new Date().getFullYear()} AgenForge. All rights reserved.</p>
      <div className="flex items-center gap-4">
        <Link href="/privacy" className="hover:text-emerald-300">Privacy</Link>
        <Link href="/terms" className="hover:text-emerald-300">Terms</Link>
        <Link href="#how" className="hover:text-emerald-300">How it works</Link>
      </div>
    </footer>
  );
}
