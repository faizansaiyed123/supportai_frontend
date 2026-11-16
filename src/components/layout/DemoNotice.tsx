"use client";

import { resetDemoData } from "@/lib/demo/api";

export function DemoNotice() {
  const reset = () => {
    resetDemoData();
    window.location.assign("/login");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-950">
      <span><strong>SupportAI interactive demo</strong> · synthetic data · local browser state · no real AI, email, or customer data</span>
      <button type="button" onClick={reset} className="font-semibold underline underline-offset-2">Reset demo</button>
    </div>
  );
}
