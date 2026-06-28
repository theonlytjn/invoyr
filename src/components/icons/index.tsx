interface IconProps {
  size?: number;
  className?: string;
}

function Hi({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  return (
    <i
      className={`hgi hgi-stroke hgi-rounded hgi-${name}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      aria-hidden="true"
    />
  );
}

export function DashboardIcon({ size = 20, className }: IconProps) {
  return <Hi name="home-01" size={size} className={className} />;
}

export function InvoiceIcon({ size = 20, className }: IconProps) {
  return <Hi name="invoice-01" size={size} className={className} />;
}

export function UsersIcon({ size = 20, className }: IconProps) {
  return <Hi name="user-multiple-02" size={size} className={className} />;
}

export function CreditCardIcon({ size = 20, className }: IconProps) {
  return <Hi name="credit-card" size={size} className={className} />;
}

export function AnalyticsIcon({ size = 20, className }: IconProps) {
  return <Hi name="chart-column" size={size} className={className} />;
}

export function SettingsIcon({ size = 20, className }: IconProps) {
  return <Hi name="settings-01" size={size} className={className} />;
}

export function LogOutIcon({ size = 20, className }: IconProps) {
  return <Hi name="logout-01" size={size} className={className} />;
}

export function PlusIcon({ size = 20, className }: IconProps) {
  return <Hi name="add-01" size={size} className={className} />;
}

export function MoreHorizontalIcon({ size = 20, className }: IconProps) {
  return <Hi name="more-horizontal" size={size} className={className} />;
}

export function DownloadIcon({ size = 20, className }: IconProps) {
  return <Hi name="download-01" size={size} className={className} />;
}

export function SendIcon({ size = 20, className }: IconProps) {
  return <Hi name="mail-send-01" size={size} className={className} />;
}

export function XCircleIcon({ size = 20, className }: IconProps) {
  return <Hi name="cancel-circle" size={size} className={className} />;
}

export function PencilIcon({ size = 20, className }: IconProps) {
  return <Hi name="pencil-edit-02" size={size} className={className} />;
}

export function TrashIcon({ size = 20, className }: IconProps) {
  return <Hi name="delete-02" size={size} className={className} />;
}

export function XIcon({ size = 20, className }: IconProps) {
  return <Hi name="cancel-01" size={size} className={className} />;
}

export function CheckIcon({ size = 20, className }: IconProps) {
  return <Hi name="checkmark-circle-01" size={size} className={className} />;
}

export function ChevronDownIcon({ size = 20, className }: IconProps) {
  return <Hi name="arrow-down-01" size={size} className={className} />;
}

export function ChevronUpIcon({ size = 20, className }: IconProps) {
  return <Hi name="arrow-up-01" size={size} className={className} />;
}

export function ChevronRightIcon({ size = 20, className }: IconProps) {
  return <Hi name="arrow-right-01" size={size} className={className} />;
}

export function CircleIcon({ size = 8, className }: IconProps) {
  return <Hi name="circle" size={size} className={className} />;
}

export function CopyIcon({ size = 20, className }: IconProps) {
  return <Hi name="copy-01" size={size} className={className} />;
}

export function LockIcon({ size = 20, className }: IconProps) {
  return <Hi name="lock" size={size} className={className} />;
}

export function EstimateIcon({ size = 20, className }: IconProps) {
  return <Hi name="estimate-01" size={size} className={className} />;
}
