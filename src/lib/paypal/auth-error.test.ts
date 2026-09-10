import { describe, it, expect } from "vitest";
import { describeAuthFailure } from "./client";

const LIVE = "https://api-m.paypal.com";
const SANDBOX = "https://api-m.sandbox.paypal.com";

describe("describeAuthFailure", () => {
  it("carries PayPal's own reason through instead of discarding it", () => {
    // The production failure: the route logged only "PayPal auth failed", so there
    // was no way to tell rejected credentials from a mismatched environment.
    const message = describeAuthFailure(
      401,
      { error: "invalid_client", error_description: "Client Authentication failed" },
      { baseUrl: LIVE, clientId: "AXvnJh5QsuydUDzt", hasSecret: true }
    );

    expect(message).toContain("invalid_client");
    expect(message).toContain("Client Authentication failed");
    expect(message).toContain("HTTP 401");
  });

  it("names both causes of invalid_client, since they look identical from outside", () => {
    const message = describeAuthFailure(
      401,
      { error: "invalid_client" },
      { baseUrl: LIVE, clientId: "AXvnJh5Q", hasSecret: true }
    );

    expect(message).toContain("SAME app");
    expect(message).toContain("same environment");
  });

  it("records which endpoint was called, so a wrong PAYPAL_ENV is visible", () => {
    expect(
      describeAuthFailure(401, {}, { baseUrl: SANDBOX, clientId: "AXvnJh5Q", hasSecret: true })
    ).toContain("endpoint=https://api-m.sandbox.paypal.com");
  });

  it("never puts the secret in the message — only whether it is set", () => {
    const message = describeAuthFailure(
      401,
      { error: "invalid_client" },
      { baseUrl: LIVE, clientId: "AXvnJh5QsuydUDzt", hasSecret: true }
    );

    expect(message).toContain("secret=set");
    expect(message).not.toContain("EMkT9nSuperSecretValue");
  });

  it("calls out a missing secret rather than reporting a generic rejection", () => {
    expect(
      describeAuthFailure(401, {}, { baseUrl: LIVE, clientId: "AXvnJh5Q", hasSecret: false })
    ).toContain("secret=MISSING");
  });

  it("calls out a missing client id", () => {
    expect(
      describeAuthFailure(401, {}, { baseUrl: LIVE, clientId: undefined, hasSecret: true })
    ).toContain("clientId=MISSING");
  });

  it("truncates the client id so two credential pairs can be told apart safely", () => {
    const message = describeAuthFailure(
      401,
      {},
      { baseUrl: LIVE, clientId: "AXvnJh5QsuydUDztOUOjwZzXljroiYu0", hasSecret: true }
    );

    expect(message).toContain("AXvnJh5Q…(32 chars)");
    expect(message).not.toContain("AXvnJh5QsuydUDztOUOjwZzXljroiYu0");
  });

  it("still produces a usable message when the body is not JSON", () => {
    const message = describeAuthFailure(503, null, {
      baseUrl: LIVE,
      clientId: "AXvnJh5Q",
      hasSecret: true,
    });

    expect(message).toContain("HTTP 503");
    expect(message).toContain("endpoint=");
  });

  it("does not invent a reason when PayPal gave none", () => {
    expect(describeAuthFailure(500, {}, { baseUrl: LIVE, clientId: "A", hasSecret: true })).toContain(
      "PayPal auth failed (HTTP 500) [endpoint="
    );
  });
});
