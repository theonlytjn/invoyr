import { Section, Text, Link } from "@react-email/components";

interface Props {
  unsubscribeUrl?: string;
}

export function EmailFooter({ unsubscribeUrl }: Props) {
  return (
    <Section style={{ padding: "24px 32px", backgroundColor: "#f9fafb" }}>
      <Text
        style={{
          fontSize: 12,
          color: "#9ca3af",
          margin: "0 0 4px",
          textAlign: "center",
        }}
      >
        Powered by{" "}
        <Link
          href="https://invoyr.io"
          style={{ color: "#9ca3af", textDecoration: "underline" }}
        >
          invoyr
        </Link>
      </Text>
      {unsubscribeUrl && (
        <Text
          style={{
            fontSize: 12,
            color: "#9ca3af",
            margin: 0,
            textAlign: "center",
          }}
        >
          <Link
            href={unsubscribeUrl}
            style={{ color: "#9ca3af", textDecoration: "underline" }}
          >
            Unsubscribe
          </Link>
        </Text>
      )}
    </Section>
  );
}
