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
    <div className="min-h-screen bg-[#fcfcfc] pt-[60px]"> 
      <Outlet />
    </div>
  );
};

export default function App() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return (
    <>
      <nav className="fixed top-0 left-0 w-full h-[60px] bg-brand-purple flex items-center justify-between px-6 shadow-md z-[100]">
        
        {/* Link-uri*/}
        <div className="flex gap-6 text-white font-bold text-lg">
          {token ? <Link to="/profile" className="hover:text-brand-yellow transition-all">Profile</Link> : null}
          <Link to="/" className="hover:text-brand-yellow transition-colors duration-300">
            Home
          </Link>
          <Link to="/wishlist" className="hover:text-brand-yellow transition-colors duration-300">
            Wishlist
          </Link>
          {token && role === "ADMIN" ? <Link to="/admin" className="hover:text-brand-yellow transition-all">Management</Link> : null}
        </div>

        {/*Butoane*/}
        <div className="flex items-center gap-4">
          {token ? (
            <button
              className="px-5 py-2 rounded-lg font-semibold text-white bg-brand-pink hover:bg-brand-orange transition-all duration-300 shadow-sm hover:shadow-lg"
              onClick={() => {
                localStorage.clear(); // la logout curatam tot
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

      <div className="min-h-screen bg-[#fcfcfc]">
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
            <Route path="/admin" element={
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

          <Route path="/login" element={<div className="pt-[60px]"><Login /></div>} />
          <Route path="/signup" element={<div className="pt-[60px]"><SignUp /></div>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}