/**
 * GPT Builder Onboarding Tour
 * Guided walkthrough for first-time GPT builder users
 */

import { ProductTour, TourStep } from '@/components/onboarding/ProductTour';

const GPT_BUILDER_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to GPT Builder ✨',
    description: 'Create a custom AI assistant in minutes. Chat with the AI to configure your GPT — no coding required.',
    position: 'center',
  },
  {
    id: 'chat',
    title: 'Chat to Build',
    description: 'Describe what you want your GPT to do. The AI will generate the name, personality, and system prompt automatically.',
    target: '[data-tour="gpt-chat"]',
    position: 'right',
  },
  {
    id: 'preview',
    title: 'Live Preview',
    description: 'See your GPT in action as you build it. Test conversations and tweak the design in real-time.',
    target: '[data-tour="gpt-preview"]',
    position: 'left',
  },
  {
    id: 'config-bar',
    title: 'Config & Tools',
    description: 'Fine-tune settings, upload knowledge files, configure actions, set up embed widgets, and export your GPT.',
    target: '[data-tour="gpt-config-bar"]',
    position: 'bottom',
  },
  {
    id: 'save',
    title: 'Save & Publish',
    description: 'Hit Save to store your GPT. Then use the Embed panel to generate shareable links and embed codes.',
    target: '[data-tour="gpt-save"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🚀',
    description: 'Start by telling the AI what kind of assistant you want. Try: "Create a customer support bot for a SaaS product."',
    position: 'center',
  },
];

interface GPTBuilderOnboardingTourProps {
  forceShow?: boolean;
}

export function GPTBuilderOnboardingTour({ forceShow }: GPTBuilderOnboardingTourProps) {
  return (
    <ProductTour
      tourId="gpt-builder-onboarding"
      steps={GPT_BUILDER_TOUR_STEPS}
      autoStart={!forceShow}
    />
  );
}
