import React from "react";
import { allProjects } from "contentlayer/generated";
import { Navigation } from "../components/nav";
import { ExpandableProjects } from "./expandable-projects";
import { Redis } from "@upstash/redis";
import AuroraBg from "../components/aurora-bg";
import FloatingOrbs from "../components/floating-orbs";

export const revalidate = 60;

export default async function ProjectsPage() {
	let views: Record<string, number> = {};
	if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
		try {
			const redis = Redis.fromEnv();
			const fetchViews = redis.mget<number[]>(
				...allProjects.map((p) => ["pageviews", "projects", p.slug].join(":")),
			);
			const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 800));
			const rawViews = (await Promise.race([fetchViews, timeout])) as number[] | null;
			views = (rawViews || []).reduce((acc, v, i) => {
				if (allProjects[i]) {
					acc[allProjects[i].slug] = v ?? 0;
				}
				return acc;
			}, {} as Record<string, number>);
		} catch {
			views = {};
		}
	}

	const featuredOrder = [
		"Waymo",
		"ChessOdds",
		"SolarSystem",
		"Polymarket",
		"InstagramFollowers",
		"Math142",
		"Math156",
		"VehicularMedia",
		"Rourke",
		"BetFree",
	];

	const featuredProjects = featuredOrder
		.map((slug) => allProjects.find((p) => p.slug === slug))
		.filter((p): p is (typeof allProjects)[number] => Boolean(p));

	const featuredSlugs = new Set(featuredProjects.map((p) => p.slug));

	const remainingProjects = allProjects
		.filter((p) => p.published && !featuredSlugs.has(p.slug))
		.sort(
			(a, b) =>
				new Date(b.date ?? Number.POSITIVE_INFINITY).getTime() -
				new Date(a.date ?? Number.POSITIVE_INFINITY).getTime(),
		);

	return (
		<div className="relative min-h-screen pb-16 bg-black text-white">
			<AuroraBg />
			<FloatingOrbs />
			<Navigation />

			<div className="px-6 pt-20 mx-auto space-y-8 max-w-7xl lg:px-8 md:space-y-16 md:pt-28 lg:pt-36">
				{/* Section header */}
				<div className="max-w-2xl mx-auto lg:mx-0 opacity-0 animate-slide-up">
					<h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display text-white">
						Projects
					</h2>
					<p className="mt-4 text-zinc-400 leading-relaxed">
						Featured software applications, systems engineering, and client projects.
					</p>
				</div>
				<div className="divider-gradient w-full" />

				{/* Featured Projects + Collapsible ... Archive Menu */}
				<ExpandableProjects
					featuredProjects={featuredProjects}
					remainingProjects={remainingProjects}
					views={views}
				/>
			</div>
		</div>
	);
}

