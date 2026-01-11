import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "./services";
import { SignInFlo } from "@/components/sign-in-flo";
import ImageTrail from "@/components/ImageTrail";

export default function Login() {
  // --- LOGICA FUNCTIONALĂ ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const locState = (location.state as { from?: { pathname?: string } } | undefined) ?? undefined;
  const from = locState?.from?.pathname ?? "/";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
      window.location.href = "/";
    } catch (error: unknown) {
      let message = "Logare eșuată";
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
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1000"
  ];

  return (
    // "fixed": Ignoră containerul părintelui (App.css) și se raportează la fereastra browserului.
    // "left-0 right-0 bottom-0": Se întinde pe toată lățimea și până jos.
    // "top-[60px]": Lasă spațiu sus pentru Header (ajustează 60px dacă header-ul e mai mare/mic).
    // "z-40": Se asigură că stă peste alte elemente de fundal, dar sub meniuri (dacă au z-50).
    <main className="fixed left-0 right-0 bottom-0 top-[60px] z-40 bg-white flex items-center justify-center overflow-hidden">
      
      {/* Stratul 1: Fundalul Animat */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
        {/* pointer-events-none pe wrapper, dar ImageTrail trebuie să intercepteze mouse-ul */}
        {/* De fapt, ImageTrail are nevoie de events. Scoatem pointer-events-none de aici */}
      </div>
      
      {/* RECTIFICARE: ImageTrail are nevoie de mouse events pe containerul părinte */}
      <div className="absolute inset-0 z-0 w-full h-full">
         <ImageTrail items={trailImages} variant={7} />
      </div>

      {/* Stratul 2: Formularul */}
      {/* pointer-events-none pe containerul formularului ca să poți activa animația din jurul lui */}
      <div className="relative z-10 w-full max-w-md px-4 pointer-events-none">
        <div className="pointer-events-auto shadow-2xl rounded-3xl">
          <SignInFlo 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onSubmit={onSubmit}
            loading={loading}
            error={err}
          />
        </div>
      </div>
    </main>
  );
}