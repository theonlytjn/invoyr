import { Heading, Text, Section } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";

export interface AdminWelcomeEmailProps {
  firstName: string;
  orgName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export function AdminWelcomeEmail({ firstName, orgName, email, tempPassword, loginUrl }: AdminWelcomeEmailProps) {
  return (
    <MarketingLayout preview={`Your Invoyr account is ready — ${orgName}`}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        Your Invoyr account is ready
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 20px" }}>
        An Invoyr account has been created for <strong>{orgName}</strong>. Use the credentials
        below to log in for the first time.
      </Text>

      <Section style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px", margin: "0 0 20px" }}>
        <Text style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Your login details
        </Text>
        <Text style={{ fontSize: 14, color: "#111827", margin: "0 0 4px" }}>
          <strong>Email:</strong> {email}
        </Text>
        <Text style={{ fontSize: 14, color: "#111827", margin: 0, fontFamily: "monospace" }}>
          <strong>Password:</strong> {tempPassword}
        </Text>
      </Section>

      <EmailButton href={loginUrl}>Log in to Invoyr</EmailButton>

      <Text style={{ fontSize: 13, color: "#9ca3af", lineHeight: "1.5", margin: "20px 0 0" }}>
        For your security, please change your password after logging in for the first time.
        You can do this from Settings → Account.
      </Text>
    </MarketingLayout>
  );
}

export default AdminWelcomeEmail;
