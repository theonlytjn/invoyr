import { ThemeToggle } from "./ThemeToggle";

interface Props {
  title: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, actions }: Props) {
  return (
    <header className="flex h-16 lg:h-20 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 lg:px-8">
      <h1 className="text-xs font-medium text-neutral-950 dark:text-neutral-50 uppercase tracking-wider">{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
