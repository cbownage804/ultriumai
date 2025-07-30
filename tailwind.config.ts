import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					soft: 'hsl(var(--primary-soft))',
					dark: 'hsl(var(--primary-dark))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				hero: {
					DEFAULT: 'hsl(var(--hero))',
					foreground: 'hsl(var(--hero-foreground))'
				},
				'ai-message': {
					DEFAULT: 'hsl(var(--ai-message))',
					foreground: 'hsl(var(--ai-message-foreground))'
				},
				'user-message': {
					DEFAULT: 'hsl(var(--user-message))',
					foreground: 'hsl(var(--user-message-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				// Accordion Animations
				'accordion-down': {
					from: { height: "0", opacity: "0" },
					to: { height: "var(--radix-accordion-content-height)", opacity: "1" }
				},
				'accordion-up': {
					from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
					to: { height: "0", opacity: "0" }
				},
				
				// Fade Animations
				'fade-in': {
					"0%": {
						opacity: "0",
						transform: "translateY(10px)"
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)"
					}
				},
				'fade-out': {
					"0%": {
						opacity: "1",
						transform: "translateY(0)"
					},
					"100%": {
						opacity: "0",
						transform: "translateY(10px)"
					}
				},
				'fade-in-up': {
					"0%": {
						opacity: "0",
						transform: "translateY(30px)"
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)"
					}
				},
				
				// Scale Animations
				'scale-in': {
					"0%": {
						transform: "scale(0.95)",
						opacity: "0"
					},
					"100%": {
						transform: "scale(1)",
						opacity: "1"
					}
				},
				'scale-out': {
					from: { transform: "scale(1)", opacity: "1" },
					to: { transform: "scale(0.95)", opacity: "0" }
				},
				
				// Slide Animations
				'slide-in-right': {
					"0%": { transform: "translateX(100%)" },
					"100%": { transform: "translateX(0)" }
				},
				'slide-out-right': {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(100%)" }
				},
				'slide-in-left': {
					"0%": { transform: "translateX(-100%)" },
					"100%": { transform: "translateX(0)" }
				},
				'slide-up': {
					"0%": {
						opacity: "0",
						transform: "translateY(20px)"
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)"
					}
				},
				
				// Bounce and Float
				'bounce-gentle': {
					'0%, 20%, 50%, 80%, 100%': {
						transform: 'translateY(0)'
					},
					'40%': {
						transform: 'translateY(-5px)'
					},
					'60%': {
						transform: 'translateY(-3px)'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				
				// Glow and Shimmer
				'glow': {
					'0%': {
						filter: 'brightness(1)'
					},
					'100%': {
						filter: 'brightness(1.2)'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
					},
					'50%': {
						boxShadow: '0 0 40px hsl(var(--primary) / 0.6)'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '200% 0'
					},
					'100%': {
						backgroundPosition: '-200% 0'
					}
				},
				
				// 3D Effects
				'fold-in': {
					'0%': {
						transform: 'perspective(1000px) rotateX(0deg)',
						opacity: '1'
					},
					'100%': {
						transform: 'perspective(1000px) rotateX(-90deg)',
						opacity: '0'
					}
				},
				'unfold': {
					'0%': {
						transform: 'perspective(1000px) rotateX(-90deg)',
						opacity: '0'
					},
					'100%': {
						transform: 'perspective(1000px) rotateX(0deg)',
						opacity: '1'
					}
				},
				
				// Rotation
				'rotate-slow': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' }
				}
			},
			animation: {
				// Basic Animations
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'fade-in-up': 'fade-in-up 0.5s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'scale-out': 'scale-out 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'slide-in-left': 'slide-in-left 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				
				// Interactive Effects
				'bounce-gentle': 'bounce-gentle 2s infinite',
				'float': 'float 6s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'rotate-slow': 'rotate-slow 20s linear infinite',
				
				// 3D Effects
				'fold-in': 'fold-in 0.8s ease-in-out',
				'unfold': 'unfold 0.8s ease-in-out',
				
				// Combined Animations
				'enter': 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
				'exit': 'fade-out 0.3s ease-out, scale-out 0.2s ease-out'
			},
			backdropBlur: {
				xs: '2px',
			},
			transitionTimingFunction: {
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: any) {
			const newUtilities = {
				// Interactive Elements
				'.story-link': {
					'@apply': 'relative inline-block after:content-[""] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left'
				},
				
				// Hover Scale Animation
				'.hover-scale': {
					'@apply': 'transition-transform duration-200 hover:scale-105'
				},
				
				// Hover Glow Effect
				'.hover-glow': {
					'@apply': 'transition-all duration-300 hover:shadow-lg hover:shadow-primary/25'
				},
				
				// Stagger Animation Delays
				'.stagger-1': { 'animation-delay': '0.1s' },
				'.stagger-2': { 'animation-delay': '0.2s' },
				'.stagger-3': { 'animation-delay': '0.3s' },
				'.stagger-4': { 'animation-delay': '0.4s' },
				'.stagger-5': { 'animation-delay': '0.5s' },
			}
			addUtilities(newUtilities)
		}
	],
} satisfies Config;