"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RefundModal from "./RefundModal";
import type { PaymentWithInvoice } from "@/lib/supabase/types";

interface Props {
  payment: PaymentWithInvoice;
}

export default function PaymentRefundButton({ payment }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        Refund
      </button>
      <RefundModal
        payment={payment}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); router.refresh(); }}
      />
    </>
  );
}
