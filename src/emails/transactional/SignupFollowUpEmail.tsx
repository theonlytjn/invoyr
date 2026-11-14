import { Heading, Img, Text } from "@react-email/components";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { EmailButton } from "../components/EmailButton";
import { EMAIL_COLORS } from "../theme";
import { BRAND } from "@/config/brand";
import { SIGNUP_FOLLOW_UP_COPY as COPY } from "@/config/email-copy";

export interface SignupFollowUpEmailProps {
  /** Omitted when we don't know it; the heading then drops the name. */
  firstName?: string | null;
  roadmapUrl: string;
}

const body = { fontSize: 15, color: EMAIL_COLORS.body, lineHeight: "1.6", margin: "0 0 16px" };
const SIGNATURE_HEIGHT = 48;

/** The founder's thank-you and feedback request, three days after signup. */
export function SignupFollowUpEmail({ firstName, roadmapUrl }: SignupFollowUpEmailProps) {
  return (
    <TransactionalLayout preview={COPY.preview}>
      <Heading style={{ fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.ink, margin: "0 0 16px" }}>
        {COPY.heading(firstName)}
      </Heading>
      {COPY.paragraphs.map((p) => (
        <Text key={p} style={body}>
          {p}
        </Text>
      ))}
      <EmailButton href={roadmapUrl}>{COPY.cta}</EmailButton>
      <Text style={{ ...body, fontSize: 14, color: EMAIL_COLORS.muted, margin: "8px 0 24px" }}>
        {COPY.replyPrompt}
      </Text>
      <Text style={{ ...body, margin: "0 0 4px" }}>{COPY.signOff}</Text>
      <Img
        src={BRAND.founderSignatureUrl}
        alt={COPY.signerName}
        width={Math.round(SIGNATURE_HEIGHT * BRAND.founderSignatureAspectRatio)}
        height={SIGNATURE_HEIGHT}
        style={{ display: "block", border: 0, margin: "0 0 4px" }}
      />
      <Text style={{ ...body, fontWeight: 600, color: EMAIL_COLORS.ink, margin: 0 }}>{COPY.signerName}</Text>
      <Text style={{ ...body, fontSize: 13, color: EMAIL_COLORS.muted, margin: 0 }}>{COPY.signerTitle}</Text>
    </TransactionalLayout>
  );
}

export default SignupFollowUpEmail;
