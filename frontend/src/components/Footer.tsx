import React from "react";

interface FooterProps {
  t: {
    support: string;
    donateLink: string;
  };
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  return (

   <footer className="
       mt-auto pt-6 pb-4 px-2
       bg-black/40 backdrop-blur border-t border-gray-700/60
       rounded-t-2xl shadow-inner
       text-sm text-gray-200 text-center space-y-2
       max-w-screen-md mx-auto
     ">
      <p className="font-semibold text-emerald-400 drop-shadow-sm">
        💼 Looking for a frontend & backend dev? Contact me:
      </p>

      <div className="flex flex-col md:flex-row justify-center items-center gap-2 text-sm">
        <p>
          <span className="mr-1 text-emerald-300">Telegram:</span>
          <a
            href="https://t.me/kmromanov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:text-emerald-400 underline underline-offset-2 transition"
          >
            @kmromanov
          </a>
        </p>
        <p>
          <span className="mr-1 text-sky-300">Discord:</span>
          <span className="text-emerald-200 font-mono">yakuji</span>
        </p>
        <p>
          <span className="mr-1 text-yellow-300">Email:</span>
          <a
            href="mailto:kirill.dev.job@gmail.com"
            className="text-yellow-200 hover:text-yellow-300 underline underline-offset-2 transition"
          >
            kirill.dev.job@gmail.com
          </a>
        </p>
        <p>
          <span className="mr-1 text-gray-400">GitHub:</span>
          <a
            href="https://github.com/romanov-km"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white underline underline-offset-2 transition"
          >
            @romanov-km
          </a>
        </p>
      </div>

      <p className="text-xs text-gray-400">
        {t.support}{" "}
        <a
          href="https://www.donationalerts.com/r/yakuji_"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
        >
          {t.donateLink}
        </a>{" "}
        <span className="inline-block animate-bounce">☕</span>
      </p>

      <p className="text-xs text-gray-600 mt-2">
        Built by a frontend dev searching for epic quests <span className="inline-block animate-pulse">🧙‍♂️</span>
      </p>
    </footer>
  );
};

export default Footer;
