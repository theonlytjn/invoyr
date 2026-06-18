import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 bg-gray-100 rounded-xl animate-pulse" />}>
      <LoginForm />
    </Suspense>
  );
}
