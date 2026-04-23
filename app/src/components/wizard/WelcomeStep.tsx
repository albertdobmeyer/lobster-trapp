import { useEffect, useRef } from "react";

interface Props {
  onNext: () => void;
  /** Shown only when the wizard detects an already-complete install (spec 07 §Step 1). */
  canSkipToDashboard: boolean;
  onSkipToDashboard: () => void;
}

export default function WelcomeStep({
  onNext,
  canSkipToDashboard,
  onSkipToDashboard,
}: Props) {
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);

  // Spec §Step 1 Accessibility: "Button has keyboard focus on load"
  useEffect(() => {
    primaryBtnRef.current?.focus();
  }, []);

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="animate-slide-up w-full">
        <HeroIllustration className="mx-auto mb-10" />

        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100 sm:text-4xl">
          Welcome to Lobster-TrApp
        </h1>
        <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-neutral-400">
          Your personal AI assistant, safe on your computer. Let's get you set
          up — it takes about 3 minutes.
        </p>

        <button
          ref={primaryBtnRef}
          type="button"
          onClick={onNext}
          className="btn btn-xl btn-primary"
        >
          Get Started
        </button>

        {canSkipToDashboard && (
          <p className="mt-8 text-xs text-neutral-500">
            Already set up?{" "}
            <button
              type="button"
              onClick={onSkipToDashboard}
              className="text-primary-400 hover:text-primary-300 underline-offset-4 hover:underline"
            >
              Skip to dashboard
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline hero SVG — friendly lobster holding a shield. Hand-rolled using
 * design-token colors so it themes cleanly. Placeholder visual standard
 * for E.2.1; a real unDraw asset replaces this in E.4.
 */
function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="280"
      height="200"
      viewBox="0 0 280 200"
      role="img"
      aria-label="A friendly lobster next to a shield, representing your safe AI assistant"
    >
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="lobster-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a5c" />
          <stop offset="100%" stopColor="#e55527" />
        </linearGradient>
      </defs>

      {/* Shield (security, trust) */}
      <g transform="translate(30 20)">
        <path
          d="M60 10 L105 28 Q108 29 108 32 L108 80 Q108 110 60 140 Q12 110 12 80 L12 32 Q12 29 15 28 Z"
          fill="url(#shield-grad)"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path
          d="M45 70 L55 82 L80 55"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Lobster — right side */}
      <g transform="translate(150 40)">
        {/* Body */}
        <ellipse cx="50" cy="80" rx="48" ry="32" fill="url(#lobster-body)" />
        {/* Tail segments */}
        <path
          d="M2 80 Q -12 72 -8 52 Q 10 56 14 70 Z"
          fill="#ff6b35"
        />
        <path
          d="M14 70 Q 5 82 -2 84"
          fill="none"
          stroke="#b84520"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Left claw */}
        <g transform="translate(96 60)">
          <ellipse cx="10" cy="8" rx="16" ry="10" fill="#ff6b35" />
          <path
            d="M 22 2 L 30 -4 M 22 14 L 30 20"
            stroke="#ff6b35"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
        {/* Right claw */}
        <g transform="translate(90 90)">
          <ellipse cx="14" cy="8" rx="18" ry="10" fill="#ff6b35" />
          <path
            d="M 28 2 L 40 -2 M 28 14 L 42 16"
            stroke="#ff6b35"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
        {/* Antennae */}
        <path
          d="M 18 55 Q 8 30 20 18"
          fill="none"
          stroke="#b84520"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 26 55 Q 24 30 38 20"
          fill="none"
          stroke="#b84520"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Eyes */}
        <circle cx="30" cy="66" r="4" fill="#0b1120" />
        <circle cx="32" cy="64" r="1.2" fill="#f9fafb" />
        <circle cx="44" cy="66" r="4" fill="#0b1120" />
        <circle cx="46" cy="64" r="1.2" fill="#f9fafb" />
        {/* Smile */}
        <path
          d="M 30 78 Q 37 84 44 78"
          fill="none"
          stroke="#0b1120"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
