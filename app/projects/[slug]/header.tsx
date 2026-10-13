"use client";
import { ArrowLeft, Eye, Github, Linkedin } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

type Props = {
	project: {
		slug: string;
		url?: string;
		title: string;
		description: string;
		repository?: string;
	};
	views: number;
};

export const Header: React.FC<Props> = ({ project, views }) => {
	const ref = useRef<HTMLElement>(null);
	const [isIntersecting, setIntersecting] = useState(true);

	const links: { label: string; href: string }[] = [];
	if (project.repository) {
		links.push({
			label: "GitHub Repository",
			href: `https://github.com/${project.repository}`,
		});
	}
	if (project.url) {
		links.push({
			label: "Live Demo",
			href: project.url,
		});
	}

	useEffect(() => {
		if (!ref.current) return;
		const observer = new IntersectionObserver(([entry]) =>
			setIntersecting(entry.isIntersecting),
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	return (
		<header
			ref={ref}
			className="relative isolate overflow-hidden bg-gray-950 border-b border-white/10"
		>
			{/* Parallax aurora orbs */}
			<div className="absolute inset-0 -z-10 pointer-events-none">
				<div
					className="aurora-blob animate-aurora-1"
					style={{
						width: "70vw",
						height: "60vh",
						top: "-20%",
						left: "-10%",
						background: "radial-gradient(ellipse at center, rgba(139,92,246,0.25) 0%, transparent 70%)",
					}}
				/>
				<div
					className="aurora-blob animate-aurora-2"
					style={{
						width: "60vw",
						height: "50vh",
						bottom: "-20%",
						right: "-15%",
						background: "radial-gradient(ellipse at center, rgba(6,182,212,0.2) 0%, transparent 70%)",
					}}
				/>
				<div
					className="absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage:
							"linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
						backgroundSize: "40px 40px",
					}}
				/>
			</div>

			{/* Sticky nav bar */}
			<div
				className={`fixed inset-x-0 top-0 z-50 duration-300 border-b ${
					isIntersecting
						? "bg-transparent border-transparent"
						: "bg-gray-955/90 backdrop-blur-md border-white/10 shadow-2xl"
				}`}
			>
				<div className="container flex flex-row-reverse items-center justify-between p-6 mx-auto">
					<div className="flex justify-between gap-6">
						<span
							title="View counter for this page"
							className="duration-200 flex items-center gap-1.5 text-zinc-300 font-mono text-sm hover:text-white"
						>
							<Eye className="w-5 h-5 text-violet-400" />{" "}
							{Intl.NumberFormat("en-US", { notation: "compact" }).format(views)}
						</span>
						<Link target="_blank" href="https://www.linkedin.com/in/lucas-wheeler-0693651b3" className="text-zinc-300 hover:text-white transition-colors duration-200">
							<Linkedin className="w-6 h-6 text-sky-400" />
						</Link>
						<Link target="_blank" href="https://github.com/lwhels" className="text-zinc-300 hover:text-white transition-colors duration-200">
							<Github className="w-6 h-6 text-violet-400" />
						</Link>
					</div>

					<Link
						href="/projects"
						className="flex items-center gap-2 text-zinc-300 hover:text-white text-sm font-semibold transition-all duration-200 hover:scale-105 bg-white/5 border border-white/10 px-4 py-2 rounded-full"
					>
						<ArrowLeft className="w-4 h-4 text-violet-400" />
						<span>Back to Projects</span>
					</Link>
				</div>
			</div>

			{/* Hero Content & Representative Image */}
			<div className="container mx-auto relative isolate overflow-hidden pt-28 pb-16 px-6 lg:px-8">
				<div className="mx-auto max-w-4xl text-center flex flex-col items-center">
					{/* Project Title */}
					<h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl font-display leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
						{project.title}
					</h1>

					{/* High-Contrast Description Badge */}
					<p className="mt-6 text-base sm:text-xl leading-relaxed text-zinc-100 max-w-2xl bg-gray-900/90 border border-white/15 p-5 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-md">
						{project.description}
					</p>

					{/* CTA links */}
					{links.length > 0 && (
						<div className="mt-8 flex flex-wrap justify-center gap-4">
							{links.map((link) => (
								<a
									target="_blank"
									rel="noopener noreferrer"
									key={link.label}
									href={link.href}
									className="group flex items-center gap-2 px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(139,92,246,0.6)] border border-violet-400 transition-all duration-300 active:scale-95"
								>
									{link.label}{" "}
									<span className="arrow-slide" aria-hidden="true">&rarr;</span>
								</a>
							))}
						</div>
					)}

					{/* Representative Project Image Preview Frame */}
					<div className="mt-12 w-full max-w-4xl rounded-3xl p-2 bg-gradient-to-b from-white/15 via-white/5 to-transparent border border-white/20 shadow-[0_0_50px_rgba(139,92,246,0.25)] overflow-hidden">
						<div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-900">
							<img
								src={`/projects/${project.slug}.png`}
								alt={`${project.title} System Interface Mockup`}
								className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
								onError={(e) => {
									// Fallback if image not present
									(e.target as HTMLElement).style.display = "none";
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};
