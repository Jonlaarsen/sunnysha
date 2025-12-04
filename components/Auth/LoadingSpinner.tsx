import { FaSpinner } from "react-icons/fa";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400 via-indigo-500 to-sky-300">
      <div className="text-center">
        <FaSpinner className="animate-spin text-4xl text-white mx-auto mb-4" />
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  );
}

