import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

type Variant = "warning" | "error" | "info";

const VARIANTS: Record<Variant, { bg: string; border: string; color: string }> = {
  warning: { bg: "#fffbeb", border: "#fbbf24", color: "#92400e" },
  error: { bg: "#fef2f2", border: "#f87171", color: "#991b1b" },
  info: { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af" },
};

interface Props {
  variant?: Variant;
  children: ReactNode;
}

export function EmailCallout({ variant = "info", children }: Props) {
  const style = VARIANTS[variant];
  return (
    <Section
      style={{
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: 4,
        padding: "12px 16px",
        marginTop: 16,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontSize: 14, color: style.color, margin: 0 }}>{children}</Text>
    </Section>
  );
}
