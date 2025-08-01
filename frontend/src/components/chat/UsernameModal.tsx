import React, { useState, useEffect } from "react";

interface Props {
  onSubmit: (username: string) => void;
}

const UsernameModal: React.FC<Props> = ({ onSubmit }) => {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [name]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-sm text-white">
        <h2 className="text-xl mb-4 font-semibold">Enter your name</h2>
        <input
          type="text"
          className="w-full p-2 rounded bg-gray-700 text-white mb-4 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="For example, user"
        />
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 w-full py-2 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default UsernameModal;