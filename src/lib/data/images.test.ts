import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resolveImage, resolveImages } from "@/lib/data/images";
import { PLACEHOLDER_IMAGE } from "@/lib/site";

const dir = path.join(process.cwd(), "public", "__image-test__");

beforeAll(() => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "photo.webp"), "");
  writeFileSync(path.join(dir, "legacy.jpg"), "");
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("resolveImage", () => {
  it("serves the WebP sibling of a .jpg reference", () => {
    expect(resolveImage("/__image-test__/photo.jpg")).toBe("/__image-test__/photo.webp");
  });

  it("keeps an existing file that has no WebP sibling", () => {
    expect(resolveImage("/__image-test__/legacy.jpg")).toBe("/__image-test__/legacy.jpg");
  });

  it("falls back to the placeholder for missing files and traversal", () => {
    expect(resolveImage("/__image-test__/missing.jpg")).toBe(PLACEHOLDER_IMAGE);
    expect(resolveImage("/../package.json")).toBe(PLACEHOLDER_IMAGE);
  });

  it("keeps remote URLs and drops unusable gallery entries", () => {
    expect(resolveImages(["https://cdn.example.com/a.jpg", "/nope.jpg"])).toEqual(["https://cdn.example.com/a.jpg"]);
    expect(resolveImages(["/nope.jpg"])).toEqual([PLACEHOLDER_IMAGE]);
  });
});
