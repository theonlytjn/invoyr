import { Container, Section } from "@react-email/components";
import type { ReactNode } from "react";
import { EmailShell } from "../components/EmailShell";
import { EmailHeader } from "../components/EmailHeader";
import { EmailFooter } from "../components/EmailFooter";
import { EMAIL_COLORS } from "../theme";

interface Props {
  preview: string;
  unsubscribeUrl?: string;
  children: ReactNode;
}

export function MarketingLayout({ preview, unsubscribeUrl, children }: Props) {
  return (
    <EmailShell preview={preview}>
      <Container
        style={{
          maxWidth: 560,
          margin: "32px auto",
          backgroundColor: EMAIL_COLORS.surface,
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${EMAIL_COLORS.border}`,
        }}
      >
        <EmailHeader />
        <Section style={{ padding: "28px 32px 32px" }}>{children}</Section>
        <EmailFooter unsubscribeUrl={unsubscribeUrl} />
      </Container>
    </EmailShell>
  );
}
