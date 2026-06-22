import { Input } from 'invoyr';

export const Default = () => (
  <div className="w-72">
    <Input placeholder="Enter email address" />
  </div>
);

export const States = () => (
  <div className="flex flex-col gap-3 w-72">
    <Input placeholder="Normal" />
    <Input placeholder="Disabled" disabled />
    <Input type="password" placeholder="Password" />
    <Input type="number" placeholder="Amount (e.g. 1500.00)" />
  </div>
);
