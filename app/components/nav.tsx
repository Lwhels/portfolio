"use client";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

export const Navigation: React.FC = () => {
	const ref = useRef<HTMLElement>(null);
	const [isIntersecting, setIntersecting] = useState(true);

	useEffect(() => {
		if (!ref.current) return;
		const observer = new IntersectionObserver(([entry]) =>
			setIntersecting(entry.isIntersecting),
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	return (
		<header ref={ref}>
			<div
				className={`fixed inset-x-0 top-0 z-50 duration-500 ${
					isIntersecting
						? "bg-transparent border-transparent"
						: "glass-strong border-b border-zinc-800/50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
				}`}
				style={{
					transform: isIntersecting ? undefined : "perspective(600px) rotateX(-1.5deg)",
					transformOrigin: "top center",
				}}
			>
				<div className="container flex flex-row-reverse items-center justify-between p-6 mx-auto">
					<div className="flex justify-between gap-8">
						{[
							{ name: "Projects", href: "/projects" },
							{ name: "Resume", href: "/resume" },
							{ name: "3D Vault", href: "/simulation" },
							{ name: "Contact", href: "/contact" },
						].map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className="relative text-sm text-zinc-400 hover:text-white transition-all duration-300 group"
							>
								{item.name}
								{/* Gradient underline expands from center */}
								<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-300 group-hover:w-full" />
							</Link>
						))}

						<button
							onClick={() => {
								window.dispatchEvent(
									new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
								);
							}}
							className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-[11px] font-mono text-zinc-400 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95"
							title="Open Command Palette (⌘K)"
						>
							<Search className="w-3 h-3 text-violet-400" />
							<span>⌘K</span>
						</button>
					</div>

					<Link
						href="/"
						className="text-zinc-400 hover:text-white transition-all duration-300 hover:scale-110"
					>
						<ArrowLeft className="w-5 h-5" />
					</Link>
				</div>
			</div>
		</header>
	);
};
