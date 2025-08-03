import React, { useState, useEffect } from "react";

interface Props {
  onSubmit: (username: string) => void;
  error: string | null;
  currentUsername?: string;
}

const UsernameModal: React.FC<Props> = ({ onSubmit, error, currentUsername }) => {
  const [name, setName] = useState(currentUsername || "");
  const [hasChanged, setHasChanged] = useState(false);

  // Определяем язык из localStorage или по умолчанию английский
  const language = localStorage.getItem("lang") || "en";

  const handleSave = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasChanged(e.target.value.trim() !== currentUsername);
  };

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Обновляем поле при изменении currentUsername
  useEffect(() => {
    if (currentUsername) {
      setName(currentUsername);
      setHasChanged(false);
    }
  }, [currentUsername]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-sm text-white">
        <h2 className="text-xl mb-4 font-semibold">
          {currentUsername 
            ? (language === "ru" ? "Изменить имя" : "Change your name")
            : (language === "ru" ? "Введите имя" : "Enter your name")
          }
        </h2>
        {error && (
          <div className="text-red-400 text-sm mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
            {error.includes("duplicate") ? (
              <>
                <div className="font-semibold mb-1">
                  ⚠️ {language === "ru" ? "Имя уже занято" : "Username already taken"}
                </div>
                <div className="text-xs text-red-300">
                  {language === "ru" 
                    ? "Это имя уже используется. Пожалуйста, выберите другое."
                    : "This username is already in use. Please choose a different one."
                  }
                </div>
              </>
            ) : (
              error
            )}
          </div>
        )}
        <input
          type="text"
          autoFocus
          className="w-full p-2 rounded bg-gray-700 text-white mb-4 outline-none"
          value={name}
          onChange={handleNameChange}
          placeholder={language === "ru" ? "Например, пользователь" : "For example, user"}
        />
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className={`w-full py-2 rounded transition-colors ${
            hasChanged 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {language === "ru" ? "Сохранить" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default UsernameModal;
