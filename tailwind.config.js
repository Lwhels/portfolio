const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx}",
		"./mdx-components.tsx",
		"content/**/*.mdx",
	],

	theme: {
		extend: {
			typography: {
				DEFAULT: {
					css: {
						"code::before": {
							content: '""',
						},
						"code::after": {
							content: '""',
						},
					},
				},
				quoteless: {
					css: {
						"blockquote p:first-of-type::before": { content: "none" },
						"blockquote p:first-of-type::after": { content: "none" },
					},
				},
			},
			fontFamily: {
				sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
				display: ["var(--font-calsans)"],
			},
			colors: {
				accent: {
					indigo: "rgb(99 102 241)",
					violet: "rgb(139 92 246)",
					fuchsia: "rgb(217 70 239)",
				},
			},
			backgroundImage: {
				"gradient-radial":
					"radial-gradient(50% 50% at 50% 50%, var(--tw-gradient-stops))",
				"gradient-accent":
					"linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246), rgb(217 70 239))",
				"gradient-accent-subtle":
					"linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15), rgba(217,70,239,0.15))",
			},
			animation: {
				"fade-in": "fade-in 3s ease-in-out forwards",
				"fade-in-fast": "fade-in-fast 0.8s ease-out forwards",
				title: "title 3s ease-out forwards",
				"fade-left": "fade-left 3s ease-in-out forwards",
				"fade-right": "fade-right 3s ease-in-out forwards",
				"slide-up": "slide-up 0.6s ease-out forwards",
				"slide-up-delay-1": "slide-up 0.6s ease-out 0.15s forwards",
				"slide-up-delay-2": "slide-up 0.6s ease-out 0.3s forwards",
				"slide-up-delay-3": "slide-up 0.6s ease-out 0.45s forwards",
				"pulse-glow": "pulse-glow 3s ease-in-out infinite",
				float: "float 6s ease-in-out infinite",
				"aurora-1": "aurora-1 18s ease-in-out infinite",
				"aurora-2": "aurora-2 22s ease-in-out infinite",
				"aurora-3": "aurora-3 15s ease-in-out infinite",
				"float-a": "float-a 7s ease-in-out infinite",
				"float-b": "float-b 9s ease-in-out infinite",
				"float-c": "float-c 5.5s ease-in-out infinite",
				"depth-in": "depth-in 0.9s cubic-bezier(0.16,1,0.3,1) forwards",
			},
			keyframes: {
				"fade-in": {
					"0%": {
						opacity: "0%",
					},
					"75%": {
						opacity: "0%",
					},
					"100%": {
						opacity: "100%",
					},
				},
				"fade-in-fast": {
					"0%": {
						opacity: "0",
						transform: "translateY(10px)",
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)",
					},
				},
				"fade-left": {
					"0%": {
						transform: "translateX(100%)",
						opacity: "0%",
					},

					"30%": {
						transform: "translateX(0%)",
						opacity: "100%",
					},
					"100%": {
						opacity: "0%",
					},
				},
				"fade-right": {
					"0%": {
						transform: "translateX(-100%)",
						opacity: "0%",
					},

					"30%": {
						transform: "translateX(0%)",
						opacity: "100%",
					},
					"100%": {
						opacity: "0%",
					},
				},
				title: {
					"0%": {
						"line-height": "0%",
						"letter-spacing": "0.25em",
						opacity: "0",
					},
					"25%": {
						"line-height": "0%",
						opacity: "0%",
					},
					"80%": {
						opacity: "100%",
					},

					"100%": {
						"line-height": "100%",
						opacity: "100%",
					},
				},
				"slide-up": {
					"0%": {
						opacity: "0",
						transform: "translateY(30px)",
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)",
					},
				},
				"pulse-glow": {
					"0%, 100%": {
						opacity: "0.4",
					},
					"50%": {
						opacity: "1",
					},
				},
				float: {
					"0%, 100%": {
						transform: "translateY(0)",
					},
					"50%": {
						transform: "translateY(-10px)",
					},
				},
			},
		},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("tailwindcss-debug-screens"),
	],
};
