import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
