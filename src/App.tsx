import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const RosetteMechanism = lazy(async () => {
  const module = await import("@/components/RosetteMechanism");
  return { default: module.RosetteMechanism };
});

const HomePage = () => (
  <main className="home-main">
    <Suspense fallback={<div>Loading editor…</div>}>
      <RosetteMechanism />
    </Suspense>
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