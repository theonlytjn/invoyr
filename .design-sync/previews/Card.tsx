import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from 'invoyr';

export const InvoiceSummary = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>Invoice #INV-0042</CardTitle>
      <CardDescription>Due 15 Jan 2026 · Acme Corp</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">£2,450.00</p>
      <p className="text-sm text-muted-foreground mt-1">3 line items · Web design, Development, Hosting</p>
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">Send Invoice</Button>
      <Button size="sm" variant="outline">Preview</Button>
    </CardFooter>
  </Card>
);

export const StatCard = () => (
  <Card className="w-56 p-6">
    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
    <p className="text-2xl font-bold mt-1">£12,840.00</p>
    <p className="text-xs text-muted-foreground mt-1">+8.2% from last month</p>
  </Card>
);
