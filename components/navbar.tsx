"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Database, ListOrdered, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation links with their routes and icons
const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/blocks", label: "Blocks", icon: Database },
  { href: "/richlist", label: "Rich List", icon: ListOrdered },
  { href: "/api", label: "API", icon: Code },
];

export function NavbarWrapper() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-3">
      <nav 
        className={cn(
          "w-full max-w-5xl transition-all duration-300 ease-in-out",
          "px-4 md:px-6 py-2 rounded-full", 
          "border border-primary/10",
          "flex items-center justify-between",
          "backdrop-blur-xl", 
          isScrolled 
            ? "bg-background/70 shadow-lg" 
            : "mt-4 bg-background/40"
        )}
        style={{
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)"
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className={cn(
            "relative overflow-hidden",
            isScrolled ? "h-8 w-8" : "h-10 w-10",
            "transition-all duration-300"
          )}>
            <img 
              src={process.env.NEXT_PUBLIC_LOGO_PATH} 
              alt={process.env.NEXT_PUBLIC_COIN_NAME}
              className="h-full w-full object-contain" 
            />
          </div>
          <span className={cn(
            "font-bold",
            isScrolled ? "text-lg" : "text-xl",
            "transition-all duration-300"
          )}>
            {process.env.NEXT_PUBLIC_COIN_NAME} Explorer
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <Icon className="h-4 w-4 mr-1" />
                {link.label}
              </Link>
            );
          })}
        </div>
        
        {/* Mobile Navigation Toggle */}
        <div className="flex md:hidden items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-full hover:bg-primary/10"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed top-[70px] left-0 right-0 mx-4 p-4 rounded-2xl bg-background/70 backdrop-blur-xl border border-primary/10 shadow-lg"
          style={{ backdropFilter: "blur(25px)" }}
        >
          <div className="flex flex-col space-y-3 px-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="flex items-center text-sm font-medium hover:text-primary transition-colors py-1.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}