import { Link, Route, Routes, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Wishlist from "./pages/Wishlist";
import Protected from "./Protected";

// Layout-ul pentru paginile care au nevoie de margini (Home, Wishlist)
const LayoutCuContainer = () => {
  return (
    <div className="container mx-auto p-4">
      <Outlet />
    </div>
  );
};

export default function App() {
  return (
    <>
      {/* --- BARA DE NAVIGARE ORIGINALĂ (Cea care ți-a plăcut) --- */}
      <nav className="w-full h-[60px] bg-brand-purple flex items-center justify-between px-6 shadow-md relative z-50">
        
        {/* Link-urile din stânga */}
        <div className="flex gap-6 text-white font-bold text-lg">
          <Link to="/" className="hover:text-brand-yellow transition-colors duration-300">
            Acasă
          </Link>
          <Link to="/wishlist" className="hover:text-brand-yellow transition-colors duration-300">
            Wishlist
          </Link>
        </div>

        {/* Zona din dreapta (Butoane) */}
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

      {/* Rutele aplicației */}
      <Routes>
        {/* Paginile standard (cu margini) */}
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
        </Route>

        {/* Paginile Full Screen (Login, SignUp) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}