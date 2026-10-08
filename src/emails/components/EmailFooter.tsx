import { Section, Text, Link } from "@react-email/components";
import { LEGAL_ENTITY } from "@/config/legal";

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
      {/* CAN-SPAM requires a valid physical postal address in commercial email,
          and identifying the sender is good practice in transactional mail too. */}
      <Text
        style={{
          fontSize: 11,
          color: "#9ca3af",
          margin: "0 0 4px",
          textAlign: "center",
        }}
      >
        {LEGAL_ENTITY.name}, {LEGAL_ENTITY.address}
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
