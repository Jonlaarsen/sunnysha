"use client";
import React, { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username.trim() === "admin" && password === "password") {
      setStatusMessage("Login successful!");
    } else {
      setStatusMessage("Invalid credentials. Please try again.");
    }
  };
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center border-2 rounded-3xl h-100 w-auto">
        <h1>LOGIN</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            value={username}
            className="p-4 border rounded-2xl"
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            placeholder="username"
          ></input>
          <input
            value={password}
            className="p-4 border rounded-2xl"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="password"
          ></input>
          <button type="submit" className="px-2 border rounded-2xl">
            Login
          </button>
          {statusMessage && (
            <p className="text-sm text-center text-gray-600">{statusMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
