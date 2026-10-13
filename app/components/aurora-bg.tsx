export default function AuroraBg() {
	return (
		<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
			{/* Deep background */}
			<div className="absolute inset-0 bg-black" />

			{/* Aurora blob 1 — indigo */}
			<div
				className="aurora-blob animate-aurora-1"
				style={{
					width: "65vw",
					height: "60vh",
					top: "-10%",
					left: "-10%",
					background: "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)",
					animationDelay: "0s",
				}}
			/>

			{/* Aurora blob 2 — violet */}
			<div
				className="aurora-blob animate-aurora-2"
				style={{
					width: "70vw",
					height: "65vh",
					top: "20%",
					right: "-20%",
					background: "radial-gradient(ellipse at center, rgba(139,92,246,0.16) 0%, transparent 70%)",
					animationDelay: "-6s",
				}}
			/>

			{/* Aurora blob 3 — fuchsia */}
			<div
				className="aurora-blob animate-aurora-3"
				style={{
					width: "55vw",
					height: "50vh",
					bottom: "-15%",
					left: "20%",
					background: "radial-gradient(ellipse at center, rgba(217,70,239,0.12) 0%, transparent 70%)",
					animationDelay: "-3s",
				}}
			/>

			{/* Subtle vignette to contain glow */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_black_100%)]" />
		</div>
	);
}
