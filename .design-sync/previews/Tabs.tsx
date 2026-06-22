import { Tabs, TabsList, TabsTrigger, TabsContent } from 'invoyr';

export const InvoiceTabs = () => (
  <Tabs defaultValue="overview" className="w-80">
    <TabsList className="w-full">
      <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
      <TabsTrigger value="items" className="flex-1">Line Items</TabsTrigger>
      <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
    </TabsList>
    <TabsContent value="overview" className="text-sm p-3 text-muted-foreground">
      Invoice #INV-0042 · £2,450.00 · Due 15 Jan 2026
    </TabsContent>
    <TabsContent value="items" className="text-sm p-3 text-muted-foreground">
      Web Design (£1,200) · Development (£900) · Hosting (£350)
    </TabsContent>
    <TabsContent value="notes" className="text-sm p-3 text-muted-foreground">
      Payment due within 30 days via bank transfer.
    </TabsContent>
  </Tabs>
);
