import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { register } from "./services";
import type { Role } from "../services";
import { Mail, Lock, User, MapPin, Key, Eye, EyeOff, Briefcase, ChevronDown, Map } from "lucide-react";
import ImageTrail from "@/components/ImageTrail";
import RomaniaMap from "../components/RomaniaMap";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<Role>("PARTYER");
  const [adminCode, setAdminCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
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

  const trailImages = [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1000",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000",
    "https://images.unsplash.com/photo-1514525253344-7814d9196a07?q=80&w=1000",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <ImageTrail items={trailImages} variant={7} />
      </div>

      {/* 2. ROMANIA MAP */}
      {showMap && (
        <RomaniaMap 
          onSelect={(selectedCounty) => setCity(selectedCounty)} 
          onClose={() => setShowMap(false)} 
        />
      )}

      {/* 3. SIGNUP CARD */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative z-10 border border-brand-purple/10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10 text-brand-purple mb-4">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 text-sm">Join the party community!</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-purple h-5 w-5" />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-purple bg-white/50 transition-all" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email Address" 
              required 
            />
          </div>

          {/* Username */}
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-purple h-5 w-5" />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-purple bg-white/50 transition-all" 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Username" 
              required 
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-purple bg-white/50 transition-all" 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password" 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-purple"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* City with Map Button */}
          <div className="relative group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 outline-none bg-gray-50/50 cursor-pointer transition-all focus:border-brand-purple" 
              type="text" 
              value={city} 
              readOnly // nu am mai lasat casuta de text
              onClick={() => setShowMap(true)}
              placeholder="Select from map" 
              required
            />
            <button 
              type="button" 
              onClick={() => setShowMap(true)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-purple hover:text-brand-pink p-1 transition-colors"
              title="Open map"
            >
              <Map size={20} />
            </button>
          </div>

          {/* Role Select */}
          <div className="relative group">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select 
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-purple bg-white/50 appearance-none cursor-pointer text-gray-700 transition-all" 
              value={role} 
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="PARTYER">I want to party (PARTYER)</option>
              <option value="ADMIN">I organize events (ADMIN)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none h-5 w-5" />
          </div>

          {/* Admin Code */}
          {role === "ADMIN" && (
            <div className="relative group animate-in slide-in-from-top-2 duration-300">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange h-5 w-5" />
              <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-brand-orange/30 outline-none focus:border-brand-pink bg-white/50 transition-all" 
                type="text" 
                value={adminCode} 
                onChange={(e) => setAdminCode(e.target.value)} 
                placeholder="Admin Invite Code" 
              />
            </div>
          )}

          {err && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center animate-pulse">
              {err}
            </div>
          )}

          <button 
            className="w-full py-3.5 rounded-xl font-bold text-white bg-brand-purple hover:bg-brand-pink active:scale-[0.98] transition-all duration-300 shadow-lg shadow-brand-purple/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-purple font-bold hover:text-brand-pink transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}