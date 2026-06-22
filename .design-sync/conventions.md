# Invoyr UI — Component Conventions

## Import

All components import from the `invoyr` package:

```tsx
import { Button, Badge, Card, Input, Dialog } from 'invoyr';
```

## Styling

Components are styled with Tailwind CSS v4 using design tokens defined in `src/app/globals.css`. Pass utility classes via `className` — all components forward it. Token colours use CSS custom properties (`--primary`, `--muted-foreground`, etc.).

## Variant props

`Button` and `Badge` expose a `variant` prop backed by `class-variance-authority` (CVA). Always use the named variant rather than overriding colours with one-off classes.

**Button variants:** `default`, `secondary`, `outline`, `ghost`, `link`, `destructive`  
**Button sizes:** `sm`, `default`, `lg`  
**Badge variants:** `default` (Paid/dark), `secondary` (Draft/neutral), `destructive` (Overdue/red), `outline`

## Compound components

`Card`, `Dialog`, `DropdownMenu`, `Select`, `Separator`, `Table`, `Tabs`, and `Tooltip` are compound — compose their named sub-parts:

```tsx
<Card>
  <CardHeader><CardTitle>…</CardTitle></CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
```

## Provider requirement

`Tooltip` requires `TooltipProvider` as an ancestor:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button>…</Button></TooltipTrigger>
    <TooltipContent>…</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Overlay components

`Dialog`, `DropdownMenu`, and `Tooltip` render portal/fixed content that escapes normal layout. In design previews, pass `open` directly rather than relying on user interaction:

```tsx
<Dialog open><DialogContent>…</DialogContent></Dialog>
<DropdownMenu open><DropdownMenuContent>…</DropdownMenuContent></DropdownMenu>
<Tooltip open>…</Tooltip>
```

These components carry `cardMode: "single"` in the sync config so their open state renders inside the card.

## Form field pattern

Pair `Label` with an input using `htmlFor`/`id`:

```tsx
<div className="flex flex-col gap-1.5">
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

## Invoice-domain content

This is an invoicing app — prefer realistic invoice content in previews: `#INV-0042`, `Acme Corp`, `£2,450.00`, status badges (`Paid`/`Draft`/`Overdue`), payment terms (`Net 30`), currency (`GBP`).
