import { Badge } from 'invoyr';

export const Variants = () => (
  <div className="flex gap-2 flex-wrap">
    <Badge variant="default">Paid</Badge>
    <Badge variant="secondary">Draft</Badge>
    <Badge variant="destructive">Overdue</Badge>
    <Badge variant="outline">Void</Badge>
  </div>
);

export const InvoiceStatuses = () => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="secondary">Draft</Badge>
      <span className="text-muted-foreground">Not yet sent</span>
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="outline">Issued</Badge>
      <span className="text-muted-foreground">Sent, awaiting payment</span>
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="default">Paid</Badge>
      <span className="text-muted-foreground">Payment received</span>
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="destructive">Overdue</Badge>
      <span className="text-muted-foreground">Past due date</span>
    </div>
  </div>
);
