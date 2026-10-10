"use client";

import { SubscribeForm } from "./SubscribeForm";

export function GetNotifiedModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-neutral-100">Get notified</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-sm">✕</button>
        </div>
        <p className="text-xs text-neutral-500 mb-5">
          We'll email you whenever the macro regime changes.
        </p>
        <SubscribeForm />
      </div>
    </div>
  );
}
