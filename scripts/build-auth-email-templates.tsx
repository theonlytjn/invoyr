/**
 * Renders the Supabase Auth email templates (signup confirmation, password
 * reset) from the same React Email components the app uses, so the first email
 * a new user gets is on brand.
 *
 * Supabase sends these itself, so the output has to be pasted into
 * Supabase Dashboard -> Authentication -> Emails -> Templates.
 *
 *   NEXT_PUBLIC_APP_URL=https://app.invoyr.io npx tsx scripts/build-auth-email-templates.tsx
 */
import { createElement } from "react";
import { writeFileSync } from "fs";
import { render } from "@react-email/components";
import { VerifyEmail } from "../src/emails/transactional/VerifyEmail";
import { PasswordResetEmail } from "../src/emails/transactional/PasswordResetEmail";

const NAME = "__FIRST_NAME__";
const URL = "https://__CONFIRMATION_URL__";
// Supabase Go-template placeholders. full_name is set at signup.
const GO_NAME = "{{ if .Data.full_name }}{{ .Data.full_name }}{{ else }}there{{ end }}";
const GO_URL = "{{ .ConfirmationURL }}";

const templates = [
  { file: "confirm-signup.html", el: createElement(VerifyEmail, { firstName: NAME, verifyUrl: URL }) },
  { file: "reset-password.html", el: createElement(PasswordResetEmail, { firstName: NAME, resetUrl: URL }) },
];

(async () => {
  for (const t of templates) {
    const html = (await render(t.el)).replaceAll(NAME, GO_NAME).replaceAll(URL, GO_URL);
    writeFileSync(`supabase/templates/${t.file}`, html);
    console.log(`supabase/templates/${t.file}`);
  }
})();
