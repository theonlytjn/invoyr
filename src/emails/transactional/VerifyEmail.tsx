import { Heading, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EMAIL_COLORS } from "../theme";

export interface VerifyEmailProps {
  firstName: string;
  verifyUrl: string;
}

export function VerifyEmail({ firstName, verifyUrl }: VerifyEmailProps) {
  return (
    <TransactionalLayout preview="Confirm your email to finish setting up Invoyr.">
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 8px" }}
      >
        Verify your email address
      </Heading>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: 0 }}>
        Please verify your email address so we can secure your Invoyr account and complete
        your setup.
      </Text>
      <EmailButton href={verifyUrl}>Verify email</EmailButton>
    </TransactionalLayout>
  );
}

export default VerifyEmail;
