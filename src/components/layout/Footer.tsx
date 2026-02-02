import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Greasy. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/about" className="text-sm text-gray-500 hover:text-green-600">
              About
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-green-600">
              Contact
            </Link>
            <Link href="/donate" className="text-sm text-gray-500 hover:text-green-600">
              Donate
            </Link>
            <Link href="/request-charity" className="text-sm text-gray-500 hover:text-green-600">
              Request a Charity
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
