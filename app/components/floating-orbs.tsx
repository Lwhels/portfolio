export default function FloatingOrbs() {
	const orbs = [
		{
			cls: "float-a",
			size: "w-2 h-2",
			glow: "glow-indigo",
			color: "bg-indigo-400",
			pos: "top-1/4 left-[15%]",
			delay: "0s",
			opacity: "opacity-60",
		},
		{
			cls: "float-b",
			size: "w-1.5 h-1.5",
			glow: "glow-violet",
			color: "bg-violet-400",
			pos: "top-1/3 right-[20%]",
			delay: "-2s",
			opacity: "opacity-50",
		},
		{
			cls: "float-c",
			size: "w-2.5 h-2.5",
			glow: "glow-fuchsia",
			color: "bg-fuchsia-400",
			pos: "bottom-1/3 left-[30%]",
			delay: "-4s",
			opacity: "opacity-40",
		},
		{
			cls: "float-a",
			size: "w-1 h-1",
			glow: "glow-violet",
			color: "bg-violet-300",
			pos: "top-[60%] left-[70%]",
			delay: "-1s",
			opacity: "opacity-70",
		},
		{
			cls: "float-b",
			size: "w-1.5 h-1.5",
			glow: "glow-indigo",
			color: "bg-indigo-300",
			pos: "top-[20%] right-[35%]",
			delay: "-5s",
			opacity: "opacity-50",
		},
		{
			cls: "float-c",
			size: "w-1 h-1",
			glow: "glow-fuchsia",
			color: "bg-fuchsia-300",
			pos: "bottom-[20%] right-[15%]",
			delay: "-3s",
			opacity: "opacity-60",
		},
	];

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			{orbs.map((orb, i) => (
				<div
					key={i}
					className={`absolute rounded-full ${orb.size} ${orb.color} ${orb.glow} ${orb.cls} ${orb.pos} ${orb.opacity}`}
					style={{ animationDelay: orb.delay }}
				/>
			))}
		</div>
	);
}
