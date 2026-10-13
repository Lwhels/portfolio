"use client";
import {
	motion,
	useMotionTemplate,
	useMotionValue,
	useSpring,
} from "framer-motion";
import { useRef } from "react";
import { PropsWithChildren } from "react";

const SPRING = { stiffness: 400, damping: 60, mass: 0.6 };
const MAX_TILT = 14; // degrees

export const TiltCard: React.FC<PropsWithChildren> = ({ children }) => {
	const ref = useRef<HTMLDivElement>(null);

	// Raw mouse position relative to card centre, normalised -1 → 1
	const rawX = useMotionValue(0);
	const rawY = useMotionValue(0);

	const rotateX = useSpring(rawX, SPRING);
	const rotateY = useSpring(rawY, SPRING);

	// Spotlight cursor position (px)
	const spotX = useMotionValue(0);
	const spotY = useMotionValue(0);
	const springSpotX = useSpring(spotX, SPRING);
	const springSpotY = useSpring(spotY, SPRING);

	const spotlight = useMotionTemplate`radial-gradient(300px circle at ${springSpotX}px ${springSpotY}px, rgba(139,92,246,0.12), transparent 70%)`;
	const glowMask  = useMotionTemplate`radial-gradient(260px at ${springSpotX}px ${springSpotY}px, white, transparent)`;

	function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		const el = ref.current;
		if (!el) return;
		const { left, top, width, height } = el.getBoundingClientRect();
		const cx = left + width / 2;
		const cy = top + height / 2;
		const dx = (e.clientX - cx) / (width / 2);
		const dy = (e.clientY - cy) / (height / 2);

		rawX.set(-dy * MAX_TILT);   // rotateX tilts toward cursor vertically
		rawY.set(dx * MAX_TILT);    // rotateY tilts toward cursor horizontally
		spotX.set(e.clientX - left);
		spotY.set(e.clientY - top);
	}

	function onMouseLeave() {
		rawX.set(0);
		rawY.set(0);
	}

	return (
		<motion.div
			ref={ref}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
			style={{
				rotateX,
				rotateY,
				transformPerspective: 900,
				transformStyle: "preserve-3d",
			}}
			className="relative overflow-hidden rounded-xl glass gradient-border glow-shadow transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.35)]"
		>
			{/* Ambient gradient layer */}
			<div className="pointer-events-none absolute inset-0 z-0 [mask-image:linear-gradient(black,transparent)]" />

			{/* Cursor-following spotlight */}
			<motion.div
				className="pointer-events-none absolute inset-0 z-10"
				style={{ background: spotlight }}
			/>

			{/* Edge shimmer on lit side */}
			<motion.div
				className="pointer-events-none absolute inset-0 z-10 opacity-0 mix-blend-overlay transition duration-500 group-hover:opacity-100"
				style={{ WebkitMaskImage: glowMask, maskImage: glowMask }}
			/>

			{/* Content — floated above base plane in 3D */}
			<div className="relative z-20" style={{ transform: "translateZ(2px)" }}>
				{children}
			</div>
		</motion.div>
	);
};
