import { Link, Route, Routes, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Wishlist from "./pages/Wishlist";
import Protected from "./Protected";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";

// Layout-ul pentru paginile care au nevoie de margini (Home, Wishlist)
const LayoutCuContainer = () => {
  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Outlet />
    </div>
  );
};

export default function App() {

   const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

  return (
    <>
      <nav className="w-full h-[60px] bg-brand-purple flex items-center justify-between px-6 shadow-md relative z-50">
        
        {/* Link-uri*/}
        <div className="flex gap-6 text-white font-bold text-lg">
          {token ? <Link to="/profile">Profile</Link> : null}
          <Link to="/" className="hover:text-brand-yellow transition-colors duration-300">
            Home
          </Link>
          <Link to="/wishlist" className="hover:text-brand-yellow transition-colors duration-300">
            Wishlist
          </Link>
          {token && role === "ADMIN" ? <Link to="/admin">Management</Link> : null}
        </div>

        {/*Butoane*/}
        <div className="flex items-center gap-4">
          {localStorage.getItem("token") ? (
            <button
              className="px-5 py-2 rounded-lg font-semibold text-white bg-brand-pink hover:bg-brand-orange transition-all duration-300 shadow-sm hover:shadow-lg"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("userid");
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <Link 
                className="px-5 py-2 rounded-lg font-semibold text-white bg-brand-pink hover:bg-brand-orange transition-all duration-300 shadow-sm hover:shadow-lg" 
                to="/login"
              >
                Login
              </Link>
              <Link 
                className="px-5 py-2 rounded-lg font-semibold text-brand-purple bg-brand-yellow hover:bg-white transition-all duration-300 shadow-sm hover:shadow-lg" 
                to="/signup"
              >
                SignUp
              </Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route element={<LayoutCuContainer />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/wishlist"
            element={
              <Protected>
                <Wishlist />
              </Protected>
            }
          />
          <Route  path="/admin" element={
            <Protected>
              <Admin />
            </Protected>
            }
          />
          <Route path="/profile" element={
              <Protected>
                <Profile />
              </Protected>
              }
          />
        </Route >


        {/* Paginile Full Screen (Login, SignUp) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}