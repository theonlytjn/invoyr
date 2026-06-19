import { Button } from "@react-email/components";

interface Props {
  href: string;
  children: string;
  accentColor?: string;
}

export function EmailButton({ href, children, accentColor = "#111827" }: Props) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: accentColor,
        color: "#ffffff",
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
