import { Html, Head, Body, Preview } from "@react-email/components";
import type { ReactNode } from "react";

interface Props {
  preview: string;
  children: ReactNode;
}

export function EmailShell({ preview, children }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f9fafb",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </Body>
    </Html>
  );
}
