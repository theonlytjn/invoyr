import { Textarea } from 'invoyr';

export const Default = () => (
  <div className="w-72">
    <Textarea placeholder="Add invoice notes or payment instructions…" rows={3} />
  </div>
);

export const States = () => (
  <div className="flex flex-col gap-3 w-72">
    <Textarea placeholder="Normal" rows={2} />
    <Textarea
      defaultValue="Payment due within 30 days. Please reference invoice #INV-0042 on your bank transfer."
      rows={3}
    />
    <Textarea placeholder="Disabled" disabled rows={2} />
  </div>
);
