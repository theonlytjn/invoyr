# Invoyr — Tier & Feature Review Sheet

Go through each row and confirm you're happy with which plans include it. Use the
**Keep?** column (✅ / change / ?) and **Notes** to flag anything before final build.

Legend: ✓ = included · — = not included

## Plans

| Plan | Price | Billing | Users | Trial |
| --- | --- | --- | --- | --- |
| Starter | £79 | per year | 1 | 7-day free trial, no card |
| Business ⭐ *most popular* | £149 | per year | Up to 5 | 7-day free trial, no card |
| Pro | £249 | per year | Unlimited | 7-day free trial, no card |

## Feature matrix

### Invoicing
| Feature | Starter | Business | Pro | Keep? | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Unlimited invoices & estimates | ✓ | ✓ | ✓ |  |  |
| Credit notes & late fees | ✓ | ✓ | ✓ |  |  |
| 4 invoice templates | ✓ | ✓ | ✓ |  |  |
| Recurring invoices | — | ✓ | ✓ |  |  |
| Bulk invoice actions | — | ✓ | ✓ |  |  |

### Getting paid
| Feature | Starter | Business | Pro | Keep? | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Online invoice portal | ✓ | ✓ | ✓ |  |  |
| Stripe card payments | ✓ | ✓ | ✓ |  |  |
| Pay by bank transfer | ✓ | ✓ | ✓ |  |  |
| PayPal payments | — | ✓ | ✓ |  |  |

### Clients & expenses
| Feature | Starter | Business | Pro | Keep? | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Client management | ✓ | ✓ | ✓ |  |  |
| Expenses (manual entry) | ✓ | ✓ | ✓ |  |  |
| Client statements | — | ✓ | ✓ |  |  |
| Open Banking — bank sync & import | — | — | ✓ |  |  |

### Reporting
| Feature | Starter | Business | Pro | Keep? | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Dashboard metrics | ✓ | ✓ | ✓ |  |  |
| Advanced reports & ageing | — | ✓ | ✓ |  |  |
| Accounting exports — QuickBooks & Xero | — | ✓ | ✓ |  |  |
| CSV export | — | — | ✓ |  |  |

### Team
| Feature | Starter | Business | Pro | Keep? | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Users | 1 | Up to 5 | Unlimited |  |  |
| Roles & permissions | — | ✓ | ✓ |  |  |

### Automation & developer
| Feature | Starter | Business | Pro | Keep? | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Automated payment reminders | — | — | ✓ |  |  |
| Custom email domain | — | — | ✓ |  |  |
| API access & webhooks | — | — | ✓ |  |  |
| Audit log | — | — | ✓ |  |  |

### Branding
| Feature | Starter | Business | Pro | Keep? | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Custom logo & branding | ✓ | ✓ | ✓ |  |  |
| Remove "Powered by Invoyr" branding | — | ✓ | ✓ |  |  |

---

## Also worth deciding (currently all plans — flag if you want them moved up)

| Feature | Current | Move to? | Notes |
| --- | :---: | --- | --- |
| Custom SMTP (send via your own mail server) | All plans |  |  |
| GDPR data export / account deletion | All plans |  | Likely stays all-plan (compliance) |

> After you mark this up, hand it back and I'll apply any changes to
> `src/config/plans.ts`, the enforcement gates, and the pricing page in one pass.
