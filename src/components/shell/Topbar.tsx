interface Props {
  title: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, actions }: Props) {
  return (
    <header className="flex h-16 lg:h-20 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-8">
      <h1 className="text-xs font-medium text-neutral-950 uppercase tracking-wider">{title}</h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
