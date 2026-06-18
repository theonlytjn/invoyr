import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">IV</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">invoyr</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Invoyr. All rights reserved.
      </p>
    </div>
  );
}
