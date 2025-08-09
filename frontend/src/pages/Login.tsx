import React, { useState } from "react";
import bg from '@/assets/bg/bg.png'
import cloudsBack from '@/assets/bg/unnamed.png'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleLogin = () => {
    // логика авторизации или редиректа
    console.log("Logging in with:", { username, password });
  };

  return (
    
    <div className="bg-gray-800 text-white min-h-screen min-w-screen relative">
      {/* Фон */}
      <img
        src={bg}
        alt="Fantasy jungle landscape"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute top-0 left-0 w-full h-full z-0 animate-clouds-back">
    <img
      src={cloudsBack}
      className="w-[200%] h-full object-cover opacity-30"
      alt="clouds back"
    />
  </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="absolute top-0 left-0 p-8">
   
        </header>

        {/* Main */}
        <main className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="w-full mb-4">
              <label htmlFor="accountName" className="block text-yellow-400 text-lg mb-2 text-center">
                Account Name
              </label>
              <input
                id="accountName"
                type="text"
                placeholder="Enter your Account Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black bg-opacity-70 custom-border p-2 text-center text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
            <div className="w-full mb-4">
              <label htmlFor="password" className="block text-yellow-400 text-lg mb-2 text-center">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black bg-opacity-70 custom-border p-2 text-center text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
            <button
              onClick={handleLogin}
              className="custom-button w-48 py-2 px-4 rounded-sm text-2xl mb-4"
            >
              Login
            </button>
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="form-checkbox h-4 w-4 text-yellow-500 bg-gray-800 border-yellow-500 rounded-sm focus:ring-yellow-500"
              />
              <label htmlFor="remember" className="ml-2 text-yellow-300">
                Remember Account Name
              </label>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-0 w-full p-4 flex justify-between items-center text-sm text-gray-400">
          <div className="text-left">
            <p>Build 3335 (Release)</p>
            <p>Jul 26 2025</p>
          </div>
          <div className="text-center">
            Copyright 2021-2025 Project Epoch. All Rights Reserved.
          </div>
          <div className="text-right space-x-2">
            <button className="custom-button py-1 px-4 rounded-sm">Options</button>
            <button className="custom-button py-1 px-4 rounded-sm">Quit</button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default LoginPage;
