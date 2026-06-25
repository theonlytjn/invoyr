import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="mb-8">
        <Link href="/">
          <Image src="/main-logo.svg" alt="Invoyr" width={120} height={36} priority />
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Invoyr. All rights reserved.
      </p>
    </div>
  );
}
