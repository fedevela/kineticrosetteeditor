import { Navigate, Route, Routes } from "react-router-dom";
import { RosetteMechanism } from "@/components/RosetteMechanism";

const HomePage = () => (
  <main className="home-main">
    <RosetteMechanism />
  </main>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}