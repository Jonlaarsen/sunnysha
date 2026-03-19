"use client";

import { FaSpinner } from "react-icons/fa";
import { useState, useEffect } from "react";

interface LoadingSpinnerProps {
  message?: string;
  onSkip?: () => void;
}

export default function LoadingSpinner({ message = "加载中...", onSkip }: LoadingSpinnerProps) {
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-400 via-indigo-500 to-sky-300 gap-6">
      <div className="text-center">
        <FaSpinner
          className="text-4xl text-white mx-auto mb-4"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <p className="text-white text-lg">{message}</p>
      </div>
      {showSkip && onSkip && (
        <button
          onClick={onSkip}
          className="px-6 py-2 bg-white/90 text-indigo-600 rounded-lg font-medium hover:bg-white transition-colors"
        >
          继续 / 跳过
        </button>
      )}
    </div>
  );
}


