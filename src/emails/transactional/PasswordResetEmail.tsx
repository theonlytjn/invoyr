import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EMAIL_COLORS } from "../theme";

export interface PasswordResetEmailProps {
  firstName: string;
  resetUrl: string;
}

export function PasswordResetEmail({ firstName, resetUrl }: PasswordResetEmailProps) {
  return (
    <TransactionalLayout preview="Use this secure link to reset your password.">
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 8px" }}
      >
        Reset your Invoyr password
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 16px" }}>
        We received a request to reset your Invoyr password. Use the button below to choose
        a new password.
      </Text>
      <Text style={{ fontSize: 14, color: EMAIL_COLORS.muted, lineHeight: "1.6", margin: 0 }}>
        If this was not you, you can ignore this email.
      </Text>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
    </TransactionalLayout>
  );
}

export default PasswordResetEmail;
