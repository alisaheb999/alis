import { describe, expect, test } from "bun:test";
import { findProduct } from "./products-catalog";

describe("Text trial availability", () => {
  test("Text has no selectable free plan while free is in maintenance", () => {
    const text = findProduct("text");
    expect(text).toBeDefined();
    expect(text?.planTable?.map((row) => row.id)).toEqual(["text_lifetime"]);
  });
  test("Text has no public free download", () => {
    expect(findProduct("text")?.downloadHref).toBeUndefined();
  });
  test("Text lifetime purchase stays available", () => {
    expect(findProduct("text")?.plans).toEqual(["text_lifetime"]);
    expect(findProduct("text")?.status).toBe("available");
  });
});