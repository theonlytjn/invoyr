import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from 'invoyr';

export const DeleteConfirmation = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Invoice?</DialogTitle>
        <DialogDescription>
          This will permanently delete invoice #INV-0042. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete Invoice</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
