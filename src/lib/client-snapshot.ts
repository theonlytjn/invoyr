/**
 * Invoices and estimates render the client's billing details from a live join.
 * Deleting a client would therefore strip those details from every historical
 * document, including paid invoices. Before a client is deleted we copy the
 * fields documents render onto each of their documents, and rendering falls back
 * to that copy when the link is gone.
 *
 * Pure — no imports, no I/O — so the fallback logic is testable without a database.
 */

export type ClientSnapshot = {
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  vat_number: string | null;
};

type ClientLike = Partial<ClientSnapshot>;

export function buildClientSnapshot(client: ClientLike): ClientSnapshot {
  // Deliberately excludes `id`: the row it points at is about to stop existing.
  return {
    name: client.name ?? "",
    company_name: client.company_name ?? null,
    email: client.email ?? null,
    phone: client.phone ?? null,
    address_line1: client.address_line1 ?? null,
    address_line2: client.address_line2 ?? null,
    city: client.city ?? null,
    postcode: client.postcode ?? null,
    country: client.country ?? null,
    vat_number: client.vat_number ?? null,
  };
}

export function resolveDocumentClient(record: {
  clients?: ClientLike | ClientLike[] | null;
  client_snapshot?: unknown;
}): ClientSnapshot | null {
  const joined = Array.isArray(record.clients) ? (record.clients[0] ?? null) : (record.clients ?? null);
  if (joined) return buildClientSnapshot(joined);

  const snapshot = record.client_snapshot;
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    return buildClientSnapshot(snapshot as ClientLike);
  }

  return null;
}
