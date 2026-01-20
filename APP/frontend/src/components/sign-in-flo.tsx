"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import SignUp from "@/pages/SignUp";
import { Link } from "react-router-dom";

interface SignInProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

interface FormFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
}

const AnimatedFormField: React.FC<FormFieldProps> = ({
  type,
  placeholder,
  value,
  onChange,
  icon,
  showToggle,
  onToggle,
  showPassword
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="relative group">
      <div
        className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 backdrop-blur-sm transition-all duration-300 ease-in-out focus-within:border-brand-purple focus-within:bg-white"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-brand-purple">
          {icon}
        </div>
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent pl-10 pr-12 py-4 text-gray-900 placeholder:text-transparent focus:outline-none"
          placeholder={placeholder}
        />
        
        <label className={`absolute left-10 transition-all duration-200 ease-in-out pointer-events-none ${
          isFocused || value 
            ? 'top-2 text-[10px] text-brand-purple font-bold uppercase tracking-wider' 
            : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
        }`}>
          {placeholder}
        </label>

        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-purple transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(150px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(106, 44, 112, 0.05) 0%, transparent 70%)`
            }}
          />
        )}
      </div>
    </div>
  );
};

export const SignInFlo: React.FC<SignInProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-purple/10 rounded-2xl mb-4 rotate-3 shadow-sm">
          <User className="w-7 h-7 text-brand-purple -rotate-3" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back!</h1>
        <p className="text-gray-500 text-sm font-medium">Please enter your details to sign in</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <AnimatedFormField
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} />}
        />

        <AnimatedFormField
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={18} />}
          showToggle
          onToggle={() => setShowPassword(!showPassword)}
          showPassword={showPassword}
        />

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 text-center font-bold animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full relative group bg-brand-purple text-white py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-xl hover:shadow-brand-purple/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 overflow-hidden"
        >
          <span className={loading ? 'opacity-0' : 'opacity-100'}>
            Sign In
          </span>
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 font-medium">
        Don't have an account?{' '}
        <button type="button" 
        onClick={() => {
                localStorage.clear();
                window.location.href = "/signup";
              }} 
        className="text-brand-purple hover:text-brand-pink font-bold underline decoration-2 underline-offset-4 transition-colors">
          Create account
        </button>
      </p>
    </div>
  );
};