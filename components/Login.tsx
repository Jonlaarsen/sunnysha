"use client";
import React, { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedin, SetLoggedin] = useState(false);
  const handleLogin = () => {
    if (username === "admin" && password === "password") {
      SetLoggedin(true);
      alert("Login successful!");
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center border-2 rounded-3xl h-100 w-auto">
        <h1>LOGIN</h1>
        <form action="submit">
          <input
            className="p-4 border rounded-2xl"
            onSubmit={() => setUsername(username)}
            //   value={password}
            type="text"
            placeholder="username"
          ></input>
          <input
            value={password}
            className="p-4 border rounded-2xl"
            onSubmit={() => setPassword(password)}
            type="password"
            placeholder="password"
          ></input>
          <button className="px-2 border rounded-2xl">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
