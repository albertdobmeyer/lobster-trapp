import { CheckCircle, MessageCircle } from "lucide-react";

interface CompleteStepProps {
  onFinish: () => void;
}

export default function CompleteStep({ onFinish }: CompleteStepProps) {
  return (
    <div className="text-center max-w-md mx-auto py-12">
      <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-100 mb-3">
        Your Assistant is Ready!
      </h2>
      <p className="text-gray-400 mb-8">
        Message your bot on Telegram to start chatting.
        You can manage your assistant from the dashboard.
      </p>

      <div className="space-y-3">
        <a
          href="https://telegram.org"
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-base inline-flex items-center gap-2"
        >
          <MessageCircle size={18} />
          Open Telegram
        </a>
        <div>
          <button
            onClick={onFinish}
            className="btn text-gray-400 hover:text-gray-200 px-8 py-3 text-base"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
