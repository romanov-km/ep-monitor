import { useParams } from "react-router-dom";
import RealmChat from "../components/chat/RealmChat";
import UsernameModal from "../components/chat/UsernameModal";
import { useState } from "react";

const ChatPage = () => {
  const { realm } = useParams<{ realm: string }>();
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");

  const handleUsernameSubmit = (name: string) => {
    localStorage.setItem("username", name);
    setUsername(name);
  };

  if (!realm) return <div className="p-4 text-white">Реалм не указан</div>;

  return (
    <div className="p-4 font-mono">
      {!username && <UsernameModal onSubmit={handleUsernameSubmit} />}
      {username && <RealmChat realm={realm} username={username} onUsernameSubmit={handleUsernameSubmit} />}
    </div>
  );
};

export default ChatPage;