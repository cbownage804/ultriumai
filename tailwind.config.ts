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
				},
				// SafeOps (RMM) Theme - Emerald/Green
				safeops: {
					DEFAULT: 'hsl(var(--safeops))',
					foreground: 'hsl(var(--safeops-foreground))',
					glow: 'hsl(var(--safeops-glow))',
					soft: 'hsl(var(--safeops-soft))',
					dark: 'hsl(var(--safeops-dark))',
					muted: 'hsl(var(--safeops-muted))',
				},
				// SafeDesk (Helpdesk) Theme - Cyan/Blue
				safedesk: {
					DEFAULT: 'hsl(var(--safedesk))',
					foreground: 'hsl(var(--safedesk-foreground))',
					glow: 'hsl(var(--safedesk-glow))',
					soft: 'hsl(var(--safedesk-soft))',
					dark: 'hsl(var(--safedesk-dark))',
					muted: 'hsl(var(--safedesk-muted))',
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
				},

				// Ray "thinking" — intentional violet pulse + drifting particles
				'ray-pulse': {
					'0%, 100%': { opacity: '0.55', transform: 'translateY(-50%) scale(1)' },
					'50%': { opacity: '0.95', transform: 'translateY(-50%) scale(1.06)' }
				},
				'ray-pulse-fast': {
					'0%, 100%': { opacity: '0.4', transform: 'translateY(-50%) scale(0.95)' },
					'50%': { opacity: '0.85', transform: 'translateY(-50%) scale(1.1)' }
				},
				'ray-particle': {
					'0%': { opacity: '0', transform: 'translate(0,0) scale(0.5)' },
					'25%': { opacity: '1' },
					'100%': { opacity: '0', transform: 'translate(-40px,-60px) scale(1.2)' }
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

				// Ray thinking
				'ray-pulse': 'ray-pulse 6s ease-in-out infinite',
				'ray-pulse-fast': 'ray-pulse-fast 3.2s ease-in-out infinite',
				'ray-particle': 'ray-particle 10s ease-out infinite',

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
				'.story-link': {
					position: 'relative',
					display: 'inline-block',
					'&::after': {
						content: '""',
						position: 'absolute',
						width: '100%',
						transform: 'scaleX(0)',
						height: '2px',
						bottom: '0',
						left: '0',
						backgroundColor: 'hsl(var(--primary))',
						transformOrigin: 'bottom right',
						transition: 'transform 0.3s ease',
					},
					'&:hover::after': {
						transform: 'scaleX(1)',
						transformOrigin: 'bottom left',
					},
				},
				'.hover-scale': {
					transition: 'transform 0.2s ease',
					'&:hover': {
						transform: 'scale(1.05)',
					},
				},
				'.hover-glow': {
					transition: 'all 0.3s ease',
					'&:hover': {
						boxShadow: '0 10px 25px -5px hsl(var(--primary) / 0.25)',
					},
				},
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