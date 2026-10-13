import { notFound } from "next/navigation";
import { allProjects } from "contentlayer/generated";
import { Mdx } from "@/app/components/mdx";
import { Header } from "./header";
import "./mdx.css";
import { ReportView } from "./view";
import { Redis } from "@upstash/redis";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Box, Grid, Clock } from "lucide-react";
import { InteractiveBenchmark } from "@/app/components/interactive-benchmark";
import { Ext2Visualizer } from "@/app/components/ext2-visualizer";
import { SolarSystemPreview } from "@/app/components/solar-system-preview";

export const revalidate = 60;

type Props = {
	params: {
		slug: string;
	};
};

export async function generateStaticParams(): Promise<Props["params"][]> {
	return allProjects
		.filter((p) => p.published)
		.map((p) => ({
			slug: p.slug,
		}));
}

export default async function PostPage({ params }: Props) {
	const slug = params?.slug;
	const project = allProjects.find((project) => project.slug === slug);

	if (!project) {
		notFound();
	}

	let views = 0;
	if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
		try {
			const redis = Redis.fromEnv();
			const fetchView = redis.get<number>(["pageviews", "projects", slug].join(":"));
			const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 800));
			const raw = await Promise.race([fetchView, timeout]);
			views = (raw as number | null) ?? 0;
		} catch {
			views = 0;
		}
	}

	// Calculate Next & Previous Project
	const sortedProjects = allProjects
		.filter((p) => p.published)
		.sort((a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime());

	const currentIndex = sortedProjects.findIndex((p) => p.slug === slug);
	const prevProject = currentIndex > 0 ? sortedProjects[currentIndex - 1] : null;
	const nextProject = currentIndex < sortedProjects.length - 1 ? sortedProjects[currentIndex + 1] : null;

	// Reading time estimate
	const words = project.body.raw ? project.body.raw.split(/\s+/).length : 250;
	const readTimeMinutes = Math.max(1, Math.ceil(words / 180));

	return (
		<div className="bg-black min-h-screen text-white pb-20">
			<Header project={project} views={views} />
			<ReportView slug={project.slug} />

			{/* Gradient accent bar */}
			<div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

			{/* Case Study Body */}
			<div className="container max-w-4xl mx-auto px-6 py-12">
				<div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-8 pb-4 border-b border-zinc-800">
					<Clock className="w-3.5 h-3.5 text-violet-400" />
					<span>Estimated {readTimeMinutes} min read</span>
					<span className="text-zinc-600">·</span>
					<span>Last updated {project.date ? new Date(project.date).toLocaleDateString() : "Recent"}</span>
				</div>

				<article className="prose prose-zinc prose-invert prose-quoteless prose-strong:text-white prose-strong:font-bold prose-headings:text-white max-w-none">
					<Mdx code={project.body.code} />
				</article>

				{project.slug === "Waymo" && (
					<div className="mt-12">
						<InteractiveBenchmark />
					</div>
				)}

				{project.slug === "ext2" && (
					<div className="mt-12">
						<Ext2Visualizer />
					</div>
				)}

				{project.slug === "SolarSystem" && (
					<div className="mt-12">
						<SolarSystemPreview />
					</div>
				)}

				{/* Next / Previous Project Carousel Navigation */}
				<div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6">
					{prevProject ? (
						<Link
							href={`/projects/${prevProject.slug}`}
							className="group p-5 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-violet-500/50 transition-all hover:scale-[1.02] flex flex-col justify-between"
						>
							<span className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-violet-400 transition-colors">
								<ArrowLeft className="w-3.5 h-3.5" /> Previous Project
							</span>
							<h4 className="mt-2 text-base font-bold text-white group-hover:text-violet-300 transition-colors font-display">
								{prevProject.title}
							</h4>
							<p className="mt-1 text-xs text-zinc-400 line-clamp-2">
								{prevProject.description}
							</p>
						</Link>
					) : (
						<div />
					)}

					{nextProject ? (
						<Link
							href={`/projects/${nextProject.slug}`}
							className="group p-5 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-violet-500/50 transition-all hover:scale-[1.02] flex flex-col justify-between text-right"
						>
							<span className="flex items-center justify-end gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-violet-400 transition-colors">
								Next Project <ArrowRight className="w-3.5 h-3.5" />
							</span>
							<h4 className="mt-2 text-base font-bold text-white group-hover:text-violet-300 transition-colors font-display">
								{nextProject.title}
							</h4>
							<p className="mt-1 text-xs text-zinc-400 line-clamp-2">
								{nextProject.description}
							</p>
						</Link>
					) : (
						<div />
					)}
				</div>

				{/* Bottom Quick Hub Buttons */}
				<div className="mt-12 flex flex-wrap items-center justify-center gap-4">
					<Link
						href="/projects"
						className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 border border-white/10 hover:border-white/30 text-xs font-semibold text-zinc-200 transition-all hover:scale-105"
					>
						<Grid className="w-4 h-4 text-zinc-400" />
						<span>View All Projects</span>
					</Link>
					<Link
						href="/simulation"
						className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600/30 border border-violet-500/50 hover:bg-violet-600 text-xs font-semibold text-violet-200 hover:text-white transition-all hover:scale-105 shadow-lg shadow-violet-500/10"
					>
						<Box className="w-4 h-4 text-violet-400" />
						<span>Explore in 3D Vault</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
