"use client";
import React, { useEffect, useRef, useState } from "react";

interface TextScrambleProps {
	text: string;
	className?: string;
	speed?: number;
	delay?: number;
}

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export const TextScramble: React.FC<TextScrambleProps> = ({
	text,
	className = "",
	speed = 50,
	delay = 1500,
}) => {
	const [displayText, setDisplayText] = useState("");
	const [started, setStarted] = useState(false);
	const iterationRef = useRef(0);
	const frameRef = useRef<number>();

	useEffect(() => {
		const timer = setTimeout(() => setStarted(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	useEffect(() => {
		if (!started) return;

		iterationRef.current = 0;

		const scramble = () => {
			const iteration = iterationRef.current;

			const newText = text
				.split("")
				.map((char, index) => {
					if (char === " ") return " ";
					if (index < iteration) return text[index];
					return chars[Math.floor(Math.random() * chars.length)];
				})
				.join("");

			setDisplayText(newText);

			if (iteration < text.length) {
				iterationRef.current += 0.5;
				frameRef.current = requestAnimationFrame(() =>
					setTimeout(scramble, speed),
				);
			}
		};

		scramble();

		return () => {
			if (frameRef.current) cancelAnimationFrame(frameRef.current);
		};
	}, [started, text, speed]);

	return (
		<span className={className}>
			{started ? displayText : "\u00A0"}
		</span>
	);
};
