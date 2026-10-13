"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Printer, ExternalLink, Mail, Phone, MapPin, Briefcase, GraduationCap, Code2, Award, Sparkles, Filter } from "lucide-react";
import { Navigation } from "../components/nav";
import AuroraBg from "../components/aurora-bg";

type CourseCat = "all" | "systems" | "math" | "ml" | "graphics";

const COURSES: { name: string; cat: CourseCat }[] = [
  { name: "Computer Organization", cat: "systems" },
  { name: "Software Construction (Python, JS, C, Bash)", cat: "systems" },
  { name: "Operating Systems", cat: "systems" },
  { name: "Algorithms and Complexity", cat: "systems" },
  { name: "Discrete Structures", cat: "math" },
  { name: "Analysis", cat: "math" },
  { name: "Mathematical Game Theory", cat: "math" },
  { name: "Applied Numerical Methods", cat: "math" },
  { name: "Optimization", cat: "math" },
  { name: "Systems of Differential Equations", cat: "math" },
  { name: "Statistics", cat: "math" },
  { name: "Computer Graphics", cat: "graphics" },
  { name: "Deep Learning for Computer Vision", cat: "graphics" },
  { name: "Machine Learning", cat: "ml" },
  { name: "Artificial Intelligence", cat: "ml" },
  { name: "Data Science", cat: "ml" },
];

export default function ResumePage() {
  const [courseCategory, setCourseCategory] = useState<CourseCat>("all");

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white pb-20 print:bg-white print:text-black print:pb-0">
      <div className="print:hidden">
        <AuroraBg />
        <Navigation />
      </div>

      <div className="container max-w-4xl mx-auto px-6 pt-24 md:pt-32 print:p-0 print:pt-4">
        {/* Top Control Bar (Hidden on print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portfolio</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-violet-500/50 hover:bg-zinc-800 text-sm font-medium text-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-lg"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4 text-violet-400" />
              <span>Print / Save PDF</span>
            </button>
            <a
              href="mailto:wheeler.lucas2002@gmail.com?subject=Lucas%20Wheeler%20Opportunity"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Lucas</span>
            </a>
          </div>
        </div>

        {/* Resume Content Sheet */}
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl print:bg-transparent print:border-none print:p-0 print:shadow-none">
          {/* Header */}
          <div className="border-b border-zinc-800 print:border-zinc-300 pb-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-display text-white print:text-black tracking-tight">
                  LUCAS WHEELER
                </h1>
                <p className="text-violet-400 print:text-zinc-700 font-medium text-sm sm:text-base mt-1">
                  Mathematics of Computation @ UCLA · Software Engineer
                </p>
              </div>
              <div className="flex flex-col text-xs sm:text-sm text-zinc-400 print:text-zinc-700 space-y-1">
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-violet-400 print:text-zinc-600" />
                  Cupertino, CA 95014
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-violet-400 print:text-zinc-600" />
                  (408) 318-2112
                </span>
                <a
                  href="mailto:wheeler.lucas2002@gmail.com"
                  className="flex items-center gap-2 hover:text-white transition-colors print:text-zinc-800"
                >
                  <Mail className="w-3.5 h-3.5 text-violet-400 print:text-zinc-600" />
                  wheeler.lucas2002@gmail.com
                </a>
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-violet-400 print:text-zinc-600" />
                  <a href="https://lucasw.dev" className="hover:text-white transition-colors">lucasw.dev</a>
                  {" · "}
                  <a href="https://www.linkedin.com/in/lucas-wheeler-0693651b3" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
                  {" · "}
                  <a href="https://github.com/lwhels" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
                </span>
              </div>
            </div>
          </div>

          {/* Education */}
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-violet-400 print:text-zinc-900 border-b border-zinc-800/80 print:border-zinc-300 pb-2 mb-4">
              <GraduationCap className="w-4 h-4" />
              <span>Education</span>
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white print:text-black">
                    University of California, Los Angeles (UCLA)
                  </h3>
                  <p className="text-sm text-zinc-300 print:text-zinc-700 italic">
                    Bachelor of Science in Mathematics of Computation
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs sm:text-sm text-zinc-400 print:text-zinc-600 mt-1 sm:mt-0">
                  <span className="font-semibold text-emerald-400 print:text-emerald-700">GPA: 3.964</span>
                  <span className="block text-zinc-500">Expected Graduation: June 2025</span>
                </div>
              </div>
              {/* Interactive Coursework Filter (Screen Only) */}
              <div className="print:hidden space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-zinc-300 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-violet-400" /> Filter:
                  </span>
                  {[
                    { id: "all", label: "All" },
                    { id: "systems", label: "Systems & Architecture" },
                    { id: "math", label: "Math & Numerical Theory" },
                    { id: "graphics", label: "Graphics & Vision" },
                    { id: "ml", label: "Machine Learning & AI" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCourseCategory(cat.id as CourseCat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                        courseCategory === cat.id
                          ? "bg-violet-600 text-white font-semibold shadow-[0_0_12px_rgba(139,92,246,0.5)] border border-violet-400"
                          : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COURSES.map((course) => {
                    const isMatched = courseCategory === "all" || course.cat === courseCategory;
                    return (
                      <span
                        key={course.name}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isMatched
                            ? "bg-violet-950/40 border-violet-500/40 text-violet-200 font-medium"
                            : "bg-zinc-900/30 border-white/5 text-zinc-500 opacity-40"
                        }`}
                      >
                        {course.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Standard List for Print View */}
              <div className="hidden print:block text-xs text-zinc-700 leading-relaxed">
                <span className="font-semibold text-zinc-900">Relevant Coursework: </span>
                Computer Organization, Software Construction (Python, JavaScript, C, Bash), Operating Systems, Discrete Structures, Algorithms and Complexity, Analysis, Mathematical Game Theory, Applied Numerical Methods, Data Science, Computer Graphics, Machine Learning, Statistics, Optimization, Systems of Differential Equations, Artificial Intelligence, Deep Learning for Computer Vision.
              </div>
            </div>
          </section>

          {/* Work Experience */}
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-violet-400 print:text-zinc-900 border-b border-zinc-800/80 print:border-zinc-300 pb-2 mb-4">
              <Briefcase className="w-4 h-4" />
              <span>Work Experience</span>
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white print:text-black">
                      Waymo
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-sm sm:text-base font-semibold text-violet-300 print:text-zinc-800">
                      Software Engineer Intern
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-400 print:text-zinc-600">
                    June 2024 – September 2024
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-2 text-xs sm:text-sm text-zinc-300 print:text-zinc-700 leading-relaxed">
                  <li>
                    Spearheaded development of an internal data visualization plotting tool. Launched the project to hundreds of employees within 3 months. <strong className="text-white print:text-black">Ranked #1 in submitted code count</strong> across all interns and amongst top of full-time employees in the org. Presented demo to 100+ employees, earning a <strong className="text-emerald-400 print:text-emerald-700">Spot and Peer Bonus</strong> for project impact and user satisfaction.
                  </li>
                  <li>
                    Utilized modern <strong className="text-white print:text-black">C++</strong> on server, <strong className="text-white print:text-black">gRPC</strong>, <strong className="text-white print:text-black">Protobuf</strong> for transport, Angular TypeScript, Sass on frontend, <strong className="text-white print:text-black">D3.js</strong> for interactive plotting, and <strong className="text-white print:text-black">Three.js</strong> for WebGL graphics.
                  </li>
                  <li>
                    Improved autocomplete feature latency by <strong className="text-emerald-400 print:text-emerald-700">400x</strong> (fuzzy searches 1.7 million fields) from ~4s on client TypeScript to &lt;10ms on C++ server (~200ms e2e). Improved load performance <strong className="text-emerald-400 print:text-emerald-700">10x</strong> (~80s to ~8s) with parallelized requests and dynamic downsampling of tens of millions of data points, preserving UX during user interaction by updating data on zoom.
                  </li>
                  <li>
                    Developed comprehensive unit and screenshot tests, maintaining highest test coverage within the team. Collaborated closely with UX designers and end-users, rapidly iterating on features based on feedback to maximize user experience and product influence.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Key Projects */}
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-violet-400 print:text-zinc-900 border-b border-zinc-800/80 print:border-zinc-300 pb-2 mb-4">
              <Code2 className="w-4 h-4" />
              <span>Projects</span>
            </h2>
            <div className="space-y-5">
              {/* Chess Odds AI */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white print:text-black">
                      Chess Odds AI: Deep Learning & Betting Engine
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700">
                      Machine Learning & Full-Stack Developer
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Sep 2024 – Nov 2024</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-sm text-zinc-400 print:text-zinc-700">
                  <li>Engineered a deep neural network in PyTorch utilizing Residual MLP architecture with Batch Normalization, PReLU activations, and skip connections, predicting Grandmaster match outcomes with 74.73% accuracy.</li>
                  <li>Processed and engineered 14 non-linear player rating and historical features across 600,000+ FIDE tournament games from The Week in Chess (TWIC).</li>
                  <li>Built an interactive Next.js 14 glassmorphism dashboard with live ELO sliders, head-to-head historic rivalry simulators, and vig-adjusted decimal and moneyline betting odds calculation.</li>
                </ul>
              </div>

              {/* Polymarket Wallet & Trade Monitor */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white print:text-black">
                      Polymarket Wallet & Trade Monitor
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700">
                      Software Developer
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Feb 2024 – Feb 2026</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-sm text-zinc-400 print:text-zinc-700">
                  <li>Built a cross-platform desktop application in Python to track target prediction market wallet addresses in real time with configurable per-wallet thresholds.</li>
                  <li>Delivered real-time alerting via native desktop notifications, sound cues, and dual-channel Discord webhooks (trades & system logs).</li>
                  <li>Architected profile management, CSV/JSON trade history export, automated updates via GitHub Releases, and 153 automated pytest unit and visual regression tests.</li>
                </ul>
              </div>

              {/* Follower Vault */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white print:text-black">
                      Follower Vault (Instagram Follower Analyzer)
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700">
                      Software Developer
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Nov 2023 – Oct 2026</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-sm text-zinc-400 print:text-zinc-700">
                  <li>Created a privacy-first, 100% offline connection auditor parsing Meta data archives with zero risk of account credentials or scraping bans.</li>
                  <li>Designed an interactive 3D Tinder-style swipe deck with keyboard shortcuts, swipe physics, tactile Web Audio feedback, and instant undo (Cmd+Z).</li>
                  <li>Developed a persistent SQLite vault with relationship tagging, notes, and a multi-snapshot diff engine tracking lost, gained, and removed followers over time.</li>
                </ul>
              </div>

              {/* Solar System */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white print:text-black">
                      3D Solar System
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700">
                      Graphics Software Developer
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Feb 2024 – Mar 2024</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-sm text-zinc-400 print:text-zinc-700">
                  <li>Built a dynamic 3D celestial simulation in WebGL and JavaScript emphasizing realistic lighting and procedural scene composition.</li>
                  <li>Programmed custom GLSL shaders (Gouraud shading, Phong specular reflection, and multi-banded planetary Ring shaders).</li>
                  <li>Implemented hierarchical matrix coordinate transformations (Mat4) for orbital mechanics and interactive body-locked camera navigation.</li>
                </ul>
              </div>

              {/* Tale of Fennec */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white print:text-black">
                      Tale of Fennec (RourkePalmer.com)
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700">
                      Website Developer & Team Lead
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">May 2023 – Sep 2023</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-sm text-zinc-400 print:text-zinc-700">
                  <li>Designed and developed an e-commerce and media streaming web platform supporting the publication of sci-fi novels.</li>
                  <li>Integrated Next.js, Tailwind CSS, TypeScript, Firebase Auth & Firestore, Stripe Checkout, and AWS SES bulk email pipelines.</li>
                  <li>Led technical planning meetings and transitioned Figma UI designs into production responsive web components.</li>
                </ul>
              </div>

              {/* EXT2 FileSystem */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white print:text-black">
                      EXT2 FileSystem
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700">
                      Systems Software Developer
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Apr 2023 – May 2023</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-sm text-zinc-400 print:text-zinc-700">
                  <li>Applied knowledge of C and EXT filesystem architecture to create files, directories, and symbolic links in a mountable EXT-2 filesystem for the Linux Kernel.</li>
                </ul>
              </div>

              {/* BetFree */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white print:text-black">
                      BetFree
                    </h3>
                    <span className="text-zinc-500">|</span>
                    <span className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700">
                      Application Developer
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Jan 2023 – Mar 2023</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-sm text-zinc-400 print:text-zinc-700">
                  <li>Collaborated with four team members to build a free sports betting mobile application in React Native and CSS.</li>
                  <li>Implemented real-time odds API data fetching, Firebase data synchronization, and form input validation.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Technical Skills */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-violet-400 print:text-zinc-900 border-b border-zinc-800/80 print:border-zinc-300 pb-2 mb-4">
              <Award className="w-4 h-4" />
              <span>Technical Skills</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 print:border-none print:p-0">
                <span className="font-semibold text-zinc-200 print:text-zinc-900 block mb-1">Languages:</span>
                <span className="text-zinc-400 print:text-zinc-700">
                  C++/C, TypeScript, JavaScript, Python, GLSL, Sass/CSS, SQL, Bash, LaTeX, MATLAB
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 print:border-none print:p-0">
                <span className="font-semibold text-zinc-200 print:text-zinc-900 block mb-1">Frameworks & Graphics:</span>
                <span className="text-zinc-400 print:text-zinc-700">
                  PyTorch, Three.js, WebGL, Next.js, React, Angular, React Native, D3.js, Tailwind CSS
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 print:border-none print:p-0">
                <span className="font-semibold text-zinc-200 print:text-zinc-900 block mb-1">Backend & Systems:</span>
                <span className="text-zinc-400 print:text-zinc-700">
                  gRPC, Protobuf, Linux Kernel / POSIX, Multithreading, SQLite, Firebase, AWS (SES/S3), Stripe
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 print:border-none print:p-0">
                <span className="font-semibold text-zinc-200 print:text-zinc-900 block mb-1">Developer Tools:</span>
                <span className="text-zinc-400 print:text-zinc-700">
                  Git, GitHub Actions / CI/CD, VS Code, Google Cloud / GCP, Pytest, Jest, Playwright, Figma
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
