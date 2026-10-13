"use client";
import React, { useEffect, useRef, useState } from "react";

interface FadeInProps {
	children: React.ReactNode;
	className?: string;
	delay?: number;
	direction?: "up" | "down" | "left" | "right";
}

export const FadeIn: React.FC<FadeInProps> = ({
	children,
	className = "",
	delay = 0,
	direction = "up",
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setVisible] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);

		if (ref.current) observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	const transforms = {
		up: "translateY(30px)",
		down: "translateY(-30px)",
		left: "translateX(30px)",
		right: "translateX(-30px)",
	};

	return (
		<div
			ref={ref}
			className={className}
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? "translate(0)" : transforms[direction],
				transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
			}}
		>
			{children}
		</div>
	);
};
