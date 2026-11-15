-- Starter content for the public roadmap (applied once, 14 Nov 2026).
-- Launched items are features that have actually shipped, dated from git
-- history, so they are published. Forward-looking items are drafts
-- (is_published = false) for the founder to review in /admin/roadmap before
-- anything is promised publicly. Safe to re-run: existing slugs are skipped.
insert into public.roadmap_items (slug, title, summary, body, category, status, is_published, launched_at, sort_order) values
('monthly-billing', 'Monthly billing', 'Pay for Invoyr monthly as well as yearly.',
 'Every plan can now be paid monthly or yearly, so you can choose what suits your cash flow. Yearly billing works out cheaper.', 'General', 'launched', true, '2026-11-03', 0),
('help-guides', 'Help guides', 'Short, practical guides to sending invoices, taking payments and chasing late payers.',
 'A public library of step-by-step guides at invoyr.io/help, covering the essentials:

- Setting up your business
- Sending your first invoice
- Taking payments
- Chasing late payments
- Your trial, plan and billing', 'General', 'launched', true, '2026-10-06', 0),
('open-banking-expenses', 'Open Banking expense import', 'Connect your bank and pull transactions straight in as categorised expenses.',
 'Connect your business bank account through TrueLayer and Invoyr imports your transactions as expenses, categorised and ready to review.

Choose which transactions to bring in, adjust categories, and mark anything billable so it can go on a client invoice. Available on Pro.', 'Expenses', 'launched', true, '2026-07-03', 0),
('public-api-webhooks', 'Public API and webhooks', 'Connect Invoyr to your own tools with a REST API and signed webhooks.',
 'Create API keys to read your invoices, clients and payments from your own systems, and subscribe to signed webhooks for events like invoice paid, invoice overdue and estimate approved.', 'Integrations', 'launched', true, '2026-07-02', 0),
('paypal-payments', 'PayPal payments', 'Let clients pay invoices with PayPal alongside card and bank transfer.',
 'Clients can now pay from the invoice pay page with PayPal, as well as by card through Stripe or by bank transfer. Payments are confirmed by PayPal before an invoice is marked paid. Available on Business and Pro.', 'Payments', 'launched', true, '2026-06-30', 0),
('credit-notes', 'Credit notes', 'Issue a credit note against an invoice and the balance updates everywhere.',
 'Raise a credit note against any sent invoice. The client is emailed a copy, and the amount comes off the balance on the pay page and at checkout automatically.', 'Invoicing', 'launched', true, '2026-06-30', 0),
('client-statements', 'Client statements', 'Download or email a statement of everything a client owes.',
 'Generate a statement for any client showing their invoices, payments and outstanding balance. Download it as a PDF or email it straight to them with the PDF attached. Available on Business and Pro.', 'Clients', 'launched', true, '2026-06-29', 0),
('late-fees', 'Automatic late fees', 'Add a fixed or percentage fee to invoices once they go overdue.',
 'Set a late fee as a fixed amount or a percentage, and Invoyr applies it automatically when an invoice becomes overdue. The fee shows on the invoice PDF and the pay page.', 'Invoicing', 'launched', true, '2026-06-29', 0),
('inline-add-client-estimates', 'Add a client while creating an estimate', 'Create a new client without leaving the estimate form.',
 'Right now you need to add a client before you can quote them. This would let you add one inline while writing the estimate, the same way you can on invoices.', 'Clients', 'considering', false, null, 0)
on conflict (slug) do nothing;
