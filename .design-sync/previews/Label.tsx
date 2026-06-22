import { Label, Input } from 'invoyr';

export const WithInput = () => (
  <div className="flex flex-col gap-1.5 w-64">
    <Label htmlFor="email">Email address</Label>
    <Input id="email" type="email" placeholder="you@example.com" />
  </div>
);

export const Required = () => (
  <div className="flex flex-col gap-3 w-64">
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="amount">
        Amount <span className="text-destructive">*</span>
      </Label>
      <Input id="amount" type="number" placeholder="0.00" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="client">Client name</Label>
      <Input id="client" placeholder="Acme Corp" />
    </div>
  </div>
);
