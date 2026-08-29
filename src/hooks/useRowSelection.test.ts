import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRowSelection } from "./useRowSelection";

describe("useRowSelection", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useRowSelection());
    expect(result.current.count).toBe(0);
  });

  it("toggles a single id on and off", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleOne("a"));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggleOne("a"));
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("selects every visible id when none are selected", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b", "c"]));
    expect(result.current.count).toBe(3);
    expect(result.current.allSelected(["a", "b", "c"])).toBe(true);
  });

  it("deselects the visible ids when all of them are already selected", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b"]));
    act(() => result.current.toggleAll(["a", "b"]));
    expect(result.current.count).toBe(0);
  });

  it("preserves selections made outside the visible set", () => {
    const { result } = renderHook(() => useRowSelection());

    // Selected before searching.
    act(() => result.current.toggleOne("hidden"));
    // Select-all while a search narrows the list to a and b.
    act(() => result.current.toggleAll(["a", "b"]));

    expect(result.current.count).toBe(3);
    expect(result.current.isSelected("hidden")).toBe(true);

    // Deselecting the visible ids must not clear the hidden one.
    act(() => result.current.toggleAll(["a", "b"]));
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected("hidden")).toBe(true);
  });

  it("reports allSelected as false for an empty visible set", () => {
    const { result } = renderHook(() => useRowSelection());
    expect(result.current.allSelected([])).toBe(false);
  });

  it("clears everything", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b"]));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});
