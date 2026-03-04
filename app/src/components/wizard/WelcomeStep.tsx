import { Shell } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center max-w-md mx-auto py-12">
      <div className="w-20 h-20 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
        <Shell size={40} className="text-orange-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-100 mb-3">
        Welcome to Lobster-TrApp
      </h1>
      <p className="text-gray-400 mb-8">
        Your security-first desktop GUI for the OpenClaw ecosystem.
        Let's check that everything is set up correctly.
      </p>
      <button
        onClick={onNext}
        className="btn bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-base"
      >
        Let's get started
      </button>
    </div>
  );
}
