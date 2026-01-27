"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-bold text-green-600">
          Greasy
        </Link>

        <button
          className="sm:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className={`${menuOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row absolute sm:relative top-14 sm:top-auto left-0 sm:left-auto w-full sm:w-auto bg-white sm:bg-transparent border-b sm:border-0 border-gray-200 items-center gap-4 p-4 sm:p-0 z-50`}>
          <Link href="/about" className="text-gray-600 hover:text-green-600 transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-green-600 transition-colors">
            Contact
          </Link>
          <Link href="/donate" className="text-gray-600 hover:text-green-600 transition-colors font-semibold">
            Donate
          </Link>
          {session ? (
            <>
              <Link href="/account" className="text-gray-600 hover:text-green-600 transition-colors">
                Account
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-green-600 transition-colors">
                Log In
              </Link>
              <Link
                href="/join"
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
