import { Section } from "@react-email/components";
import type { ReactNode } from "react";
import { EMAIL_COLORS } from "../theme";

interface Props {
  children: ReactNode;
}

export function EmailCard({ children }: Props) {
  return (
    <Section
      style={{
        backgroundColor: EMAIL_COLORS.panel,
        border: `1px solid ${EMAIL_COLORS.border}`,
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
