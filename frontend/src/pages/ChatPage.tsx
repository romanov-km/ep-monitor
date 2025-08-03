import { useParams } from "react-router-dom";
import RealmChat from "../components/chat/RealmChat";
import UsernameModal from "../components/chat/UsernameModal";
import { useState, useRef } from "react";

const ChatPage = () => {
  const { realm } = useParams<{ realm: string }>();
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleUsernameSubmit = (name: string) => {
    localStorage.setItem("username", name);
    setUsername(name);
  };

  const playChatSound = () => {
    console.log("ChatPage: playChatSound called");
    // Получаем настройки звука из localStorage
    const savedSettings = localStorage.getItem("soundSettings");
    console.log("ChatPage: saved settings:", savedSettings);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      console.log("ChatPage: parsed settings:", settings);
      if (settings.chat && settings.chat.enabled) {
        console.log("ChatPage: chat sound is enabled, playing...");
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        const audioPath = `/sounds/${settings.chat.soundType}${settings.chat.soundType === 'newmsg' ? '.ogg' : '.mp3'}`;
        console.log("ChatPage: loading audio from:", audioPath);
        const audio = new Audio(audioPath);
        audio.volume = settings.chat.volume;
        audioRef.current = audio;

        audio
          .play()
          .then(() => console.log("ChatPage: successfully playing chat sound"))
          .catch((err) => console.error("ChatPage: ошибка при воспроизведении звука:", err));
      } else {
        console.log("ChatPage: chat sound is disabled or not found");
      }
    } else {
      console.log("ChatPage: no saved settings found");
    }
  };

  if (!realm) return <div className="p-4 text-white">Реалм не указан</div>;

  return (
    <div className="p-4 font-mono">
      {!username && <UsernameModal onSubmit={handleUsernameSubmit} error={null}/>}
      {username && <RealmChat realm={realm} username={username} onUsernameSubmit={handleUsernameSubmit} onChatMessage={playChatSound} />}
    </div>
  );
};

export default ChatPage;