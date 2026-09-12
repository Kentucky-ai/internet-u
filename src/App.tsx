import { NavLink, Route, Routes, Link } from "react-router-dom";
import { Home } from "./pages/Home";
import { Rules } from "./pages/Rules";
import { useProfile } from "./state/profile";

export default function App() {
  const { user } = useProfile();
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand"><span className="mark">U</span>Internet U</Link>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/rules">My Rules</NavLink>
          <span className="userchip"><i className={`dot${user.authenticated ? " on" : ""}`} />{user.authenticated ? user.name : "Demo user"}</span>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="*" element={<div className="empty">Nothing here. <Link to="/">Back home</Link>.</div>} />
      </Routes>
      <footer className="small muted" style={{ marginTop: 40 }}>Internet U · AI Tinkerers Louisville hackathon, September 12, 2026 · Demo mode: no store, cart or payment is connected.</footer>
    </div>
  );
}
