interface Props {
  title: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, actions }: Props) {
  return (
    <div className="flex items-center justify-between py-5 px-6 border-b border-[#e5e5e5] bg-white">
      <h1 className="text-lg font-semibold text-[#0a0a0a]">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
