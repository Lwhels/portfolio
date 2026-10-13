"use client";

import React, { useState } from "react";
import { Github, Mail, Linkedin, Copy, Check, Send, MapPin, Phone, FileText } from "lucide-react";
import Link from "next/link";
import { Navigation } from "../components/nav";
import { TiltCard } from "../components/tilt-card";
import AuroraBg from "../components/aurora-bg";

const primaryEmail = "wheeler.lucas2002@gmail.com";

const socials = [
  {
    icon: <Linkedin size={22} />,
    href: "https://www.linkedin.com/in/lucas-wheeler-0693651b3",
    label: "LinkedIn",
    handle: "Lucas Wheeler",
    glow: "hover:shadow-[0_0_32px_rgba(99,102,241,0.3)]",
    action: "open",
  },
  {
    icon: <Mail size={22} />,
    href: "mailto:" + primaryEmail,
    label: "Primary Email",
    handle: primaryEmail,
    glow: "hover:shadow-[0_0_32px_rgba(139,92,246,0.3)]",
    action: "copy",
  },
  {
    icon: <Github size={22} />,
    href: "https://github.com/lwhels",
    label: "GitHub",
    handle: "lwhels",
    glow: "hover:shadow-[0_0_32px_rgba(217,70,239,0.3)]",
    action: "open",
  },
];

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleCopyEmail = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    navigator.clipboard.writeText(primaryEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setSubmitted(true);
    // Prepare mailto fallback
    const subject = encodeURIComponent(`Portfolio Message from ${formState.name}`);
    const body = encodeURIComponent(`From: ${formState.name} (${formState.email})\n\n${formState.message}`);
    window.location.href = `mailto:${primaryEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative min-h-screen bg-black text-white pb-24">
      <AuroraBg />
      <Navigation />

      <div className="container max-w-5xl mx-auto px-4 pt-28 md:pt-36">
        {/* Heading */}
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold font-display sm:text-5xl opacity-0 animate-slide-up text-3d">
            <span className="text-gradient">Let&apos;s Connect</span>
          </h1>
          <p className="mt-4 text-zinc-400 max-w-lg opacity-0 animate-slide-up-delay-1 leading-relaxed text-sm sm:text-base">
            Whether discussing opportunities in systems engineering, high-performance 3D graphics, or full-stack software, I’d love to connect.
          </p>

          {/* Quick Copy Pill */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => handleCopyEmail()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-white/15 hover:border-violet-500/60 text-xs font-mono text-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-violet-400" />
                  <span>Copy: {primaryEmail}</span>
                </>
              )}
            </button>
            <Link
              href="/resume"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600/20 border border-violet-500/30 hover:border-violet-400 text-xs text-violet-300 transition-all hover:scale-105 active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Resume</span>
            </Link>
          </div>
        </div>

        {/* Social / Contact Cards */}
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 lg:gap-8 mb-16 opacity-0 animate-slide-up-delay-2">
          {socials.map((s) => (
            <TiltCard key={s.label}>
              <div
                className={`p-6 relative flex flex-col items-center justify-between text-center gap-6 h-full min-h-[220px] rounded-2xl ${s.glow} transition-shadow`}
              >
                {/* Vertical accent line */}
                <span
                  className="absolute w-px h-2/3 bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent"
                  aria-hidden="true"
                />

                {/* Icon */}
                <span
                  className="relative z-10 flex items-center justify-center w-12 h-12 text-sm duration-500 border rounded-full text-zinc-200 border-zinc-600 bg-zinc-900 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                  style={{ transform: "translateZ(28px)" }}
                >
                  {s.icon}
                </span>

                {/* Text labels */}
                <div className="z-10 flex flex-col items-center w-full" style={{ transform: "translateZ(16px)" }}>
                  <span className="text-base sm:text-lg font-medium text-zinc-200 font-display break-all px-2">
                    {s.handle}
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">{s.label}</span>
                </div>

                {/* Button Action */}
                <div className="z-10 mt-2" style={{ transform: "translateZ(20px)" }}>
                  {s.action === "copy" ? (
                    <button
                      onClick={() => handleCopyEmail()}
                      className="px-3.5 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600 hover:text-white text-xs font-semibold transition-all hover:scale-105"
                    >
                      {copied ? "Copied!" : "Copy Email"}
                    </button>
                  ) : (
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white hover:border-violet-500/40 text-xs font-semibold transition-all hover:scale-105"
                    >
                      Open Link →
                    </a>
                  )}
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        {/* Direct Contact Form & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Info Card */}
          <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl space-y-6">
            <h3 className="text-xl font-bold font-display text-white">Location & Background</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Based in Cupertino, CA and Los Angeles (UCLA). Open to full-time SWE roles, systems/graphics engineering opportunities, and innovative computational projects.
            </p>

            <div className="space-y-4 text-xs font-mono text-zinc-300 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Cupertino, CA / Los Angeles, CA</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-violet-400 shrink-0" />
                <span>(408) 318-2112</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                <span>wheeler.lucas2002@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-3 p-6 md:p-8 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold font-display text-white mb-2">Send a Message</h3>
            <p className="text-xs text-zinc-400 mb-6">Leave your details and message to start a conversation.</p>

            {submitted ? (
              <div className="p-6 rounded-xl bg-violet-950/30 border border-violet-500/40 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-white">Email Draft Initialized</h4>
                <p className="text-xs text-zinc-400">
                  Your message has been drafted to Lucas. If your email client didn&apos;t open automatically, feel free to copy{" "}
                  <strong className="text-violet-300">{primaryEmail}</strong>.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs text-violet-400 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="Ada Lovelace"
                      className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">Your Email</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="ada@example.com"
                      className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Hi Lucas, I saw your portfolio and wanted to reach out regarding..."
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message Draft</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
