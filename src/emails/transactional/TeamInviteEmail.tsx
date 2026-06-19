import { Heading, Text } from "@react-email/components";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { EmailButton } from "../components/EmailButton";

export interface TeamInviteEmailProps {
  inviterName: string;
  orgName: string;
  inviteUrl: string;
}

export function TeamInviteEmail({ inviterName, orgName, inviteUrl }: TeamInviteEmailProps) {
  return (
    <MarketingLayout preview="Join your team workspace on Invoyr.">
      <Heading
        style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}
      >
        You've been invited to {orgName}
      </Heading>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px" }}>
        Hi,
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: 0 }}>
        {inviterName} has invited you to join {orgName} on Invoyr.
        Use the link below to accept the invite and access the workspace.
      </Text>
      <EmailButton href={inviteUrl}>Accept invite</EmailButton>
    </MarketingLayout>
  );
}

export default TeamInviteEmail;
