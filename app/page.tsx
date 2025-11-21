"use client";
import Qc2Component from "@/components/Qc2Component";
import QcComponent from "@/components/QcComponent";
import { useState } from "react";

export default function Home() {
  const [currentview, setCurrentview] = useState<"qc" | "qc2">("qc");
  const [loggedin, setLoggedin] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username.trim() === "admin" && password === "password") {
      setLoggedin(true);
      setErrorMessage("");
      setPassword("");
    } else {
      setErrorMessage("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-blue-50/50">
      {!loggedin ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-sky-800 px-4">
          <div className="w-full max-w-md bg-white/95 border border-white/40 backdrop-blur shadow-2xl rounded-3xl px-10 py-12 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 text-2xl font-extrabold shadow-inner">
                QC
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
                  SUSU Warehouse
                </p>
                <h1 className="text-3xl font-bold text-slate-900">
                  Secure Sign In
                </h1>
                <p className="text-sm text-slate-500">
                  Enter your credentials to continue
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Username
                </label>
                <input
                  className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  type="text"
                  placeholder="admin"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Password
                </label>
                <input
                  className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                Sign in
              </button>
            </form>

            <p className="text-xs text-center text-slate-400">
              QC Report System • Internal use only
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="my-8">
            <div className="bg-white flex justify-between border-black border rounded-lg shadow-sm p-4 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">
                  <span className="bg-gradient-to-bl from-blue-400 to-purple-700 text-white rounded-full px-3.5 py-2 font-extrabold">
                    SUSU WareHouse LC
                  </span>{" "}
                  QC Report System{" "}
                  <span className="text-xs text-zinc-400 font-normal">
                    By jon larsen
                  </span>
                </h1>
              </div>
              <div className="space-x-5">
                <button
                  onClick={() => setCurrentview("qc")}
                  className={`${
                    currentview === "qc"
                      ? " text-blue-600 border-blue-600"
                      : "text-gray-600 border-gray-600 "
                  } border p-2 font-bold rounded-2xl  bg-white min-w-20`}
                >
                  Qc
                </button>
                <button
                  onClick={() => setCurrentview("qc2")}
                  className={`${
                    currentview === "qc2"
                      ? " text-blue-600 border-blue-600"
                      : "text-gray-600 border-gray-600 "
                  } border p-2 font-bold rounded-2xl  bg-white min-w-20`}
                >
                  Qc2
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white border-black border h-full min-h-screen rounded-lg shadow-lg p-6 w-full max-w-6xl mx-auto pb-8 overflow-y-auto">
            {currentview === "qc" ? <QcComponent /> : <Qc2Component />}
          </div>
        </>
      )}
      {/* Navigation Header */}
    </div>
  );
}
