import React from "react";

interface FooterProps {
  t: {
    support: string;
    donateLink: string;
  };
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="mt-10 pt-6 border-t border-gray-700 text-sm text-gray-300 text-center space-y-2">
      <p>💼 Looking for a frontend & backend dev? Contact me:</p>

      <div className="flex flex-col md:flex-row justify-center items-center gap-2 text-sm">
        <p>
          Telegram:{" "}
          <a
            href="https://t.me/kmromanov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 underline"
          >
            @kmromanov
          </a>
        </p>
        <p>
          Discord: <span className="text-green-300">yakuji</span>
        </p>
        <p>
          Email:{" "}
          <a
            href="mailto:kirill.dev.job@gmail.com"
            className="text-green-400 underline"
          >
            kirill.dev.job@gmail.com
          </a>
        </p>
        <p>
          GitHub:{" "}
          <a
            href="https://github.com/romanov-km"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 underline"
          >
            @romanov-km
          </a>
        </p>
      </div>

      <p className="text-xs text-gray-400">
        {t.support}
        <a
          href="https://www.donationalerts.com/r/yakuji_"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >
          {t.donateLink}
        </a>{" "}
        ☕
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Built by a frontend dev searching for epic quests (a.k.a. a job) 🧙‍♂️
      </p>
    </footer>
  );
};

export default Footer;