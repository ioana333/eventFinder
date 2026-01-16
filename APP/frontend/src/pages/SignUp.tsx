import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { register } from "./services";
import type { Role } from "../services";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");

  // functionality from SignUp-style.tsx
  const [role, setRole] = useState<Role>("PARTYER");
  const [adminCode, setAdminCode] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  // Narrow the possible `state` shape coming from react-router
  const locState = (location.state as { from?: { pathname?: string } } | undefined) ?? undefined;
  const from = locState?.from?.pathname ?? "/";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      await register({
        email,
        password,
        username,
        city: city.trim() ? city.trim() : undefined,
        role,
        adminCode: role === "ADMIN" ? adminCode : undefined,
      });

      navigate(from, { replace: true });
      window.location.href = "/";
    } catch (error: unknown) {
      let message = "Registration failed";
      if (typeof error === "object" && error !== null) {
        const errObj = error as { response?: { data?: { error?: string } } };
        message = errObj.response?.data?.error ?? message;
      }
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Sign Up</h1>

      <div style={{ display: "grid", gap: ".75rem" }}>
        <label>
          <div>Email</div>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          <div>Username</div>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          <div>Password</div>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label>
          <div>City*</div>
          <input
            className="input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>

        {/* functionality from SignUp-style.tsx, styled like SignUp.tsx */}
        <label>
          <div>You come as an: </div>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="PARTYER">PARTYER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        {role === "ADMIN" && (
          <label>
            <div>Admin invite code</div>
            <input
              className="input"
              type="text"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Admin invite code"
            />
          </label>
        )}

        {err && <div style={{ color: "#ff6b6b" }}>{err}</div>}

        <button className="btn" disabled={loading}>
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </div>
    </form>
  );
}
