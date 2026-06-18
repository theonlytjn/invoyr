import type { InvoiceTemplate } from "@/lib/supabase/types";
import type { InvoiceTemplateProps } from "./types";
import TJNClassic from "./TJNClassic";
import CleanMinimal from "./CleanMinimal";
import BoldSplit from "./BoldSplit";
import ModernStudio from "./ModernStudio";

export type { InvoiceTemplateProps } from "./types";

export const TEMPLATE_MAP: Record<InvoiceTemplate, React.ComponentType<InvoiceTemplateProps>> = {
  tjn_classic: TJNClassic,
  clean_minimal: CleanMinimal,
  bold_split: BoldSplit,
  modern_studio: ModernStudio,
};

export const TEMPLATE_LABELS: Record<InvoiceTemplate, string> = {
  tjn_classic: "TJN Classic",
  clean_minimal: "Clean Minimal",
  bold_split: "Bold Split",
  modern_studio: "Modern Studio",
};
