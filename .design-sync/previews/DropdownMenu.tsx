import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, Button } from 'invoyr';

export const InvoiceActions = () => (
  <DropdownMenu open>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">Actions</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-48">
      <DropdownMenuLabel>Invoice #INV-0042</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem>Send to Client</DropdownMenuItem>
      <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
