import { Html, Head, Body, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import { EMAIL_COLORS, EMAIL_FONT_STACK } from "../theme";

interface Props {
  preview: string;
  children: ReactNode;
}

export function EmailShell({ preview, children }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: EMAIL_COLORS.page,
          fontFamily: EMAIL_FONT_STACK,
          color: EMAIL_COLORS.body,
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </Body>
    </Html>
  );
}
