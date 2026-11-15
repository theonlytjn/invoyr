# "How to use Invoyr" video script

About 2 minutes, 7 scenes. The voiceover runs at roughly 150 words a minute. On-screen
labels below are the real ones in the app (checked against the code, 15 Nov 2026).

## Before you record

- Record at **1440px wide or more**: the live invoice preview is hidden on smaller screens.
- Use a fresh demo account signed up with **Continue with Google** (skips the email-confirm
  step), and **Stripe test mode** for the payment.
- Have a logo PNG ready and a second browser (or incognito window) with a test inbox for "the client".
- Give the demo client an **Email**. Sending fails without one.
- Cut from onboarding's "Add payment details →" straight to the dashboard. Don't show Stripe Checkout.
- "Send to client" is inside the **…** menu on the invoice. Zoom in or highlight it.
- After paying, refresh the invoice before cutting to it: the "Paid" badge can lag a few seconds.

## Scenes

### 1. Hook (0:00–0:10)
**Screen:** The Invoyr dashboard, then a quick zoom on a green "Paid" badge.
**Voiceover:** "From a blank account to getting paid in about two minutes. Here's how Invoyr works."
**On-screen text:** Get paid faster.

### 2. Sign up and set up your business (0:10–0:30)
**Screen:** `/signup` → "Continue with Google" → onboarding step "Your business": type a
Business name → "Continue".
**Voiceover:** "Sign up with Google or your email, then tell Invoyr your business name. That's
the only thing it needs to get started. Your address and VAT number can go in too."

### 3. Add your logo and brand colour (0:30–0:45)
**Screen:** Onboarding step "Branding": upload the logo, pick an "Accent colour"; the
"Preview" card updates live → "Continue". (Later changes: Settings → Company → "Upload logo"
and "Brand colour".)
**Voiceover:** "Add your logo and pick your brand colour. You'll see the preview change as you
go. Every invoice, email and payment page will look like yours, not ours."

### 4. Add a client (0:45–1:00)
**Screen:** Sidebar "Clients" → "+ Add client" → fill "Contact name", "Company name",
"Email" → "Add client".
**Voiceover:** "Next, add a client. A name and an email address is all you need. You can also
add people to copy in, like their accounts team."

### 5. Create an invoice (1:00–1:25)
**Screen:** Sidebar "Invoices" → "+ New" → "Client": pick the client → "Payment terms":
"Net 14 days" → line item "Description", "Qty", "Unit price" (VAT % stays at 20) →
"Add line" for a second item → watch the "Preview" panel on the right → "Save & issue".
**Voiceover:** "Now create the invoice. Choose the client and the payment terms, then add what
you're billing for. VAT and totals are worked out for you, and the preview on the right shows
exactly what your client will see."

### 6. Send it (1:25–1:40)
**Screen:** On the invoice page open the "…" menu → "Send to client" → the "Invoice INV-0001
sent" dialog → "Done". Cut to the client's inbox: the branded email with "View and pay invoice".
**Voiceover:** "Hit send. Your client gets a branded email with a secure link to view, download
and pay. And you'll see in the invoice's history when they open it."

### 7. Get paid (1:40–2:00)
**Screen:** (Pre-recorded: Settings → "Payments" → "Connect with Stripe" → "Stripe
connected".) Client clicks "View and pay invoice" → the pay page → "Pay now" → test card →
"Payment received". Cut back to the app: the invoice shows "Paid", then the owner's
"Payment received" email.
**Voiceover:** "Connect Stripe once and your clients can pay by card in a couple of clicks, or
by bank transfer or PayPal. When they pay, Invoyr marks the invoice as paid and lets you know.
No chasing, no spreadsheets."

### 8. Close (2:00–2:10)
**Screen:** The dashboard ("Revenue this month", "Outstanding", "Overdue"), then the end card.
**Voiceover:** "Track what's coming in from your dashboard, and let automatic reminders do the
chasing. Start your free 14-day trial at invoyr.io, or book a demo and we'll walk you through it."
**End card:** invoyr.io · Start your free trial · Book a demo at invoyr.io/demo

## Notes on claims

- Reminder automations are Pro; PayPal is Business and up. The script mentions them without
  promising them on every plan. If the video will sit on the pricing page, add "on Business and Pro".
- Recurring invoices aren't linked from any menu yet (`/invoices/recurring`), so the script leaves them out.
