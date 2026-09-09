"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BulkDeleteDialog } from "@/components/ui";
import { describeClientDelete } from "@/lib/client-delete-copy";

interface Props {
  clientId: string;
  clientName: string;
}

/**
 * Delete for a single client, from the client's own page.
 *
 * It posts to the same bulk endpoint with one id rather than introducing a
 * single-client route. That endpoint already snapshots billing details onto the
 * client's documents before deleting, ends their active recurring schedules, and
 * fails closed if either step errors — behaviour a second route would have to
 * duplicate exactly or quietly diverge from.
 *
 * The confirmation copy comes from the same shared builder the clients list uses,
 * so both screens state the same consequences.
 */
export default function ClientDeleteButton({ clientId, clientName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
      >
        Delete
      </Button>

      <BulkDeleteDialog
        open={open}
        endpoint="/api/clients/bulk/delete"
        ids={[clientId]}
        noun="client"
        nounPlural="clients"
        titleFor={() => `Delete ${clientName}?`}
        describeFor={describeClientDelete}
        onCancel={() => setOpen(false)}
        onDeleted={(result) => {
          setOpen(false);
          // The client no longer exists, so this page has nothing to render.
          if ((result.succeeded ?? result.deleted) > 0) {
            router.push("/clients");
          }
          router.refresh();
        }}
      />
    </>
  );
}
