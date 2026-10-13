"use client";

import type { Project } from "@/.contentlayer/generated";
import Link from "next/link";
import { Eye } from "lucide-react";

export const PROJECT_TAGS: Record<string, string[]> = {
	Waymo: ["C++", "Three.js", "D3.js", "gRPC"],
	SolarSystem: ["WebGL", "Three.js", "GLSL Shaders"],
	Math142: ["Applied Math", "Numerical Methods", "Python"],
	Math156: ["Machine Learning", "Optimization", "Python"],
	VehicularMedia: ["3D Simulation", "Three.js", "React"],
	Rourke: ["Next.js", "TypeScript", "Tailwind CSS"],
	BetFree: ["React Native", "Firebase", "Sports API"],
	Polymarket: ["Prediction Markets", "Data Science", "Python"],
	InstagramFollowers: ["Python", "Automation", "Analytics"],
	ext2: ["C", "Linux Kernel", "EXT-2 FS"],
	hashtable: ["C++", "Multithreading", "Mutex Locks"],
	TunnelMan: ["C++", "OpenGL", "Game Dev"],
	LAhacks: ["Full Stack", "React", "Hackathon"],
};

type Props = {
	project: Project;
	views: number;
};

export const Article: React.FC<Props> = ({ project, views }) => {
	return (
		<Link href={`/projects/${project.slug}`}>
			<article className="p-4 md:p-8">
				<div className="flex justify-between gap-2 items-center">
					<span
						className="text-xs duration-1000 text-zinc-200 group-hover:text-white drop-shadow-orange"
						style={{ transform: "translateZ(6px)" }}
					>
						{project.date ? (
							<time dateTime={new Date(project.date).toISOString()}>
								{Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
									new Date(project.date),
								)}
							</time>
						) : (
							<span className="text-violet-400/80 font-medium tracking-wide">SOON</span>
						)}
					</span>
					<span className="text-zinc-500 text-xs flex items-center gap-1">
						<Eye className="w-4 h-4" />{" "}
						{Intl.NumberFormat("en-US", { notation: "compact" }).format(views)}
					</span>
				</div>

				{/* Representative project image thumbnail */}
				<div
					className="relative w-full aspect-video rounded-xl overflow-hidden my-4 border border-white/10 bg-gray-900 group-hover:border-violet-500/50 transition-colors"
					style={{ transform: "translateZ(8px)" }}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={`/projects/${project.slug}.png`}
						alt={project.title}
						className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						onError={(e) => {
							(e.target as HTMLElement).style.display = "none";
						}}
					/>
				</div>

				{/* Title floats above the card surface */}
				<h2
					className="z-20 text-xl font-medium duration-500 lg:text-3xl text-zinc-200 group-hover:text-white font-display"
					style={{ transform: "translateZ(10px)" }}
				>
					{project.title}
				</h2>

				{/* Description sits at mid-depth */}
				<p
					className="z-20 mt-4 text-sm duration-1000 text-zinc-400 group-hover:text-zinc-200 leading-relaxed"
					style={{ transform: "translateZ(6px)" }}
				>
					{project.description}
				</p>

				{/* Tech tags */}
				<div
					className="mt-4 flex flex-wrap gap-1.5"
					style={{ transform: "translateZ(10px)" }}
				>
					{(PROJECT_TAGS[project.slug] ?? []).slice(0, 3).map((tag) => (
						<span
							key={tag}
							className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 border border-white/10 text-zinc-300"
						>
							{tag}
						</span>
					))}
				</div>

				{/* Read-more link closest to viewer */}
				<div
					className="mt-5 flex items-center gap-1 text-sm text-zinc-500 group-hover:text-violet-400 transition-colors duration-500"
					style={{ transform: "translateZ(14px)" }}
				>
					<span>Read case study</span>
					<span className="arrow-slide">→</span>
				</div>
			</article>
		</Link>
	);
};
