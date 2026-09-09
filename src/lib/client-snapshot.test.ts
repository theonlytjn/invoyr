import { describe, it, expect } from "vitest";
import { buildClientSnapshot, resolveDocumentClient } from "./client-snapshot";

const client = {
  id: "c1",
  name: "Globex",
  company_name: "Globex Ltd",
  email: "ap@globex.test",
  phone: "0123",
  address_line1: "1 High St",
  address_line2: null,
  city: "London",
  postcode: "E1 6AN",
  country: "GB",
  vat_number: "GB123",
};

describe("buildClientSnapshot", () => {
  it("captures the fields documents render", () => {
    expect(buildClientSnapshot(client)).toEqual({
      name: "Globex",
      company_name: "Globex Ltd",
      email: "ap@globex.test",
      phone: "0123",
      address_line1: "1 High St",
      address_line2: null,
      city: "London",
      postcode: "E1 6AN",
      country: "GB",
      vat_number: "GB123",
    });
  });

  it("does not capture the client id, which would be a dangling reference", () => {
    expect(buildClientSnapshot(client)).not.toHaveProperty("id");
  });
});

describe("resolveDocumentClient", () => {
  it("prefers the live client when the link still exists", () => {
    const resolved = resolveDocumentClient({
      clients: client,
      client_snapshot: { name: "Stale Name" },
    });
    expect(resolved?.name).toBe("Globex");
  });

  it("falls back to the snapshot when the client was deleted", () => {
    const resolved = resolveDocumentClient({
      clients: null,
      client_snapshot: buildClientSnapshot(client),
    });
    expect(resolved?.name).toBe("Globex");
    expect(resolved?.vat_number).toBe("GB123");
  });

  it("returns null when there is neither a client nor a snapshot", () => {
    expect(resolveDocumentClient({ clients: null, client_snapshot: null })).toBeNull();
  });

  it("unwraps a joined client returned as an array", () => {
    const resolved = resolveDocumentClient({ clients: [client], client_snapshot: null });
    expect(resolved?.name).toBe("Globex");
  });

  it("returns null for an empty clients array", () => {
    expect(resolveDocumentClient({ clients: [], client_snapshot: null })).toBeNull();
  });

  it("rejects an array-shaped snapshot, returning null instead of a fake client", () => {
    // Corrupt data: snapshot is an array instead of an object.
    // Must return null rather than building a fake client from the array.
    expect(resolveDocumentClient({ clients: null, client_snapshot: [] })).toBeNull();
    expect(resolveDocumentClient({ clients: null, client_snapshot: [{ name: "fake" }] })).toBeNull();
  });
});
