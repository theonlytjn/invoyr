import { Separator } from 'invoyr';

export const Horizontal = () => (
  <div className="w-64 flex flex-col gap-4">
    <p className="text-sm font-medium">Subtotal: £2,000.00</p>
    <Separator />
    <p className="text-sm font-medium">VAT (20%): £400.00</p>
    <Separator />
    <p className="text-sm font-bold">Total: £2,400.00</p>
  </div>
);

export const Vertical = () => (
  <div className="flex h-8 items-center gap-3">
    <span className="text-sm text-muted-foreground">Edit</span>
    <Separator orientation="vertical" />
    <span className="text-sm text-muted-foreground">Send</span>
    <Separator orientation="vertical" />
    <span className="text-sm text-muted-foreground">Archive</span>
  </div>
);
