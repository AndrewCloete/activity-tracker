import { useState } from "react";
import ActivityList from "./components/ActivityList";
import ActivityDetail from "./components/ActivityDetail";

type View = { type: "list" } | { type: "detail"; id: number };

export default function App() {
  const [view, setView] = useState<View>({ type: "list" });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem 1.5rem" }}>
      {view.type === "list" ? (
        <ActivityList onSelect={(id) => setView({ type: "detail", id })} />
      ) : (
        <ActivityDetail
          id={view.id}
          onBack={() => setView({ type: "list" })}
        />
      )}
    </div>
  );
}
