import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { EMAIL_COLORS } from "../theme";

type Variant = "warning" | "error" | "info" | "success";

const VARIANTS: Record<Variant, { bg: string; border: string; color: string }> = {
  warning: { bg: EMAIL_COLORS.warningBg, border: EMAIL_COLORS.warningBorder, color: EMAIL_COLORS.warningText },
  error: { bg: EMAIL_COLORS.dangerBg, border: EMAIL_COLORS.dangerBorder, color: EMAIL_COLORS.dangerText },
  info: { bg: EMAIL_COLORS.infoBg, border: EMAIL_COLORS.infoBorder, color: EMAIL_COLORS.infoText },
  success: { bg: EMAIL_COLORS.successBg, border: EMAIL_COLORS.successBorder, color: EMAIL_COLORS.successText },
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
