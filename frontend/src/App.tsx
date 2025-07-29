import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useEffect } from 'react'
import axios from 'axios'

interface StatusEntry {
  time: string;
  status: string;
}

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get<StatusEntry[]>("/api/status");
      setStatuses(res.data);
    } catch (err) {
      console.error("Ошибка загрузки статуса:", err);
    }
  };

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 font-mono">
      <h1 className="text-2xl font-bold mb-4">📡 История статусов WoW-сервера</h1>
      <ul className="space-y-1">
        {statuses.map((entry, i) => (
          <li key={i} className="text-sm">
            <span className="font-bold">[{entry.time}]</span> {entry.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;