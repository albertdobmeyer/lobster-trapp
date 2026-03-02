import { AlertTriangle, X } from "lucide-react";
import type { Danger } from "@/lib/types";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  danger: Danger;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  danger,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const btnClass =
    danger === "destructive"
      ? "bg-red-600 hover:bg-red-500"
      : "bg-amber-600 hover:bg-amber-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                danger === "destructive" ? "bg-red-500/20" : "bg-amber-500/20"
              }`}
            >
              <AlertTriangle
                size={20}
                className={
                  danger === "destructive"
                    ? "text-red-400"
                    : "text-amber-400"
                }
              />
            </div>
            <h3 className="font-medium text-gray-100">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-400">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="btn btn-safe"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`btn text-white ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
