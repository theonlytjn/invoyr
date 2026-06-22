import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter, Badge } from 'invoyr';

export const InvoiceList = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Invoice</TableHead>
        <TableHead>Client</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="font-medium">#INV-0042</TableCell>
        <TableCell>Acme Corp</TableCell>
        <TableCell>£2,450.00</TableCell>
        <TableCell><Badge variant="default">Paid</Badge></TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="font-medium">#INV-0041</TableCell>
        <TableCell>TechStart Ltd</TableCell>
        <TableCell>£1,200.00</TableCell>
        <TableCell><Badge variant="secondary">Draft</Badge></TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="font-medium">#INV-0040</TableCell>
        <TableCell>Global Media</TableCell>
        <TableCell>£4,800.00</TableCell>
        <TableCell><Badge variant="destructive">Overdue</Badge></TableCell>
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={2} className="font-medium">Total</TableCell>
        <TableCell>£8,450.00</TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableFooter>
  </Table>
);
