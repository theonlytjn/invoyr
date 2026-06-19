import { Section } from "@react-email/components";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function EmailCard({ children }: Props) {
  return (
    <Section
      style={{
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "16px 20px",
        marginTop: 16,
        marginBottom: 16,
      }}
    >
      {children}
    </Section>
  );
}
