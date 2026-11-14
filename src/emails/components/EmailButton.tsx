import { Button } from "@react-email/components";
import { EMAIL_COLORS } from "../theme";
import { readableTextColor } from "@/lib/contrast";

interface Props {
  href: string;
  children: string;
  accentColor?: string;
}

export function EmailButton({ href, children, accentColor = EMAIL_COLORS.ink }: Props) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: accentColor,
        // An org can pick a light brand colour, so pick the readable label colour.
        color: readableTextColor(accentColor) === "#ffffff" ? EMAIL_COLORS.surface : EMAIL_COLORS.ink,
        fontSize: 14,
        fontWeight: 600,
        padding: "12px 24px",
        borderRadius: 8,
        textDecoration: "none",
        marginTop: 24,
        marginBottom: 8,
      }}
    >
      {children}
    </Button>
  );
}
