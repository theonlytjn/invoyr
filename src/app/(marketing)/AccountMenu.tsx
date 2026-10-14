"use client";

import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { clearMarketingSessionHint } from "@/hooks/useMarketingSession";

// The app's main destinations, in sidebar order.
export const ACCOUNT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/estimates", label: "Estimates" },
  { href: "/clients", label: "Clients" },
  { href: "/settings", label: "Settings" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950";

export function AccountAvatar({ name, email, size = "h-9 w-9" }: { name: string | null; email: string | null; size?: string }) {
  const initial = (name || email || "U")[0].toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white dark:bg-neutral-50 dark:text-neutral-950`}
    >
      {initial}
    </span>
  );
}

/** Sign-out has to happen on the app domain, which owns the session cookie. */
export function SignOutForm({
  appOrigin,
  formRef,
  className,
  children,
}: {
  appOrigin: string;
  formRef?: React.Ref<HTMLFormElement>;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form ref={formRef} action={`${appOrigin}/api/auth/sign-out`} method="post" onSubmit={clearMarketingSessionHint}>
      {children && <button type="submit" className={className}>{children}</button>}
    </form>
  );
}

export default function AccountMenu({ name, email, appOrigin }: { name: string | null; email: string | null; appOrigin: string }) {
  const signOutRef = useRef<HTMLFormElement>(null);
  const itemClass =
    "cursor-pointer rounded-md px-3 py-2 text-base text-neutral-700 dark:text-neutral-200 focus:bg-neutral-100 focus:text-neutral-950 dark:focus:bg-neutral-800 dark:focus:text-neutral-50";

  return (
    <>
    <SignOutForm appOrigin={appOrigin} formRef={signOutRef} />
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={`group inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-[1.15rem] text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors ${FOCUS_RING}`}
      >
        <AccountAvatar name={name} email={email} />
        My account
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-data-[state=open]:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-60 rounded-xl border-neutral-200 bg-white p-1.5 text-neutral-900 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <DropdownMenuLabel className="px-3 py-2 font-normal">
          {name && <p className="truncate font-medium text-neutral-950 dark:text-neutral-50">{name}</p>}
          {email && <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">{email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
        {ACCOUNT_LINKS.map((link) => (
          <DropdownMenuItem key={link.href} asChild className={itemClass}>
            <a href={`${appOrigin}${link.href}`}>{link.label}</a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
        <DropdownMenuItem className={itemClass} onSelect={() => signOutRef.current?.requestSubmit()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
