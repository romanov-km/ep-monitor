import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/Main";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/chat/:realm" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;