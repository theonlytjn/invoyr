import { Button } from 'invoyr';

export const Variants = () => (
  <div className="flex flex-wrap gap-2">
    <Button variant="default">Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
    <Button variant="destructive">Destructive</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-2">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const States = () => (
  <div className="flex gap-2">
    <Button>Active</Button>
    <Button disabled>Disabled</Button>
  </div>
);
