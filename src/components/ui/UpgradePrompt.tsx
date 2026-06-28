import Link from "next/link";
import { LockIcon } from "@/components/icons";
import { FEATURE_LABELS, FEATURE_UPGRADE_TARGET, PLAN_MAP, type Feature } from "@/config/plans";

interface Props {
  feature: Feature;
  description?: string;
}

export default function UpgradePrompt({ feature, description }: Props) {
  const requiredPlan = FEATURE_UPGRADE_TARGET[feature];
  const plan = PLAN_MAP[requiredPlan];
  const label = FEATURE_LABELS[feature];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <LockIcon size={24} className="text-neutral-400" />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="text-xl font-serif text-neutral-950 dark:text-neutral-50">{label}</h2>
        <p className="text-sm text-neutral-500">
          {description ?? `${label} is available on the ${plan.name} plan and above. Upgrade to unlock this feature.`}
        </p>
      </div>
      <Link
        href="/settings/billing"
        className="px-5 py-2.5 bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
      >
        Upgrade to {plan.name}
      </Link>
    </div>
  );
}
