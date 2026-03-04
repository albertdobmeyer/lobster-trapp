import { CheckCircle } from "lucide-react";

interface CompleteStepProps {
  onFinish: () => void;
}

export default function CompleteStep({ onFinish }: CompleteStepProps) {
  return (
    <div className="text-center max-w-md mx-auto py-12">
      <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-100 mb-3">All Set!</h2>
      <p className="text-gray-400 mb-8">
        Your environment is ready. Head to the dashboard to start managing your
        OpenClaw components.
      </p>
      <button
        onClick={onFinish}
        className="btn bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-base"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
