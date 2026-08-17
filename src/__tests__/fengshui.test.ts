import { describe, it, expect } from "vitest";
import { propertyTypes, pricePlans, methods, sourceColumns } from "../data";

describe("Domain Data & Pricing Architecture", () => {
  it("should have all 4 core property types defined", () => {
    expect(propertyTypes.length).toBe(4);
    const keys = propertyTypes.map((p) => p.key);
    expect(keys).toContain("flat");
    expect(keys).toContain("multi");
    expect(keys).toContain("house");
    expect(keys).toContain("business");
  });

  it("should have balanced pricing tiers with a featured tier", () => {
    expect(pricePlans.length).toBe(4);
    const featuredPlan = pricePlans.find((p) => p.featured);
    expect(featuredPlan).toBeDefined();
    expect(featuredPlan?.id).toBe("full");
  });

  it("should have 8 classical & contemporary Feng Shui methods defined", () => {
    expect(methods.length).toBe(8);
    methods.forEach((m) => {
      expect(m.name).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.score).toBeGreaterThan(0);
    });
  });

  it("should contain comprehensive source methodology columns", () => {
    expect(sourceColumns.length).toBe(6);
    sourceColumns.forEach((col) => {
      expect(col.title).toBeTruthy();
      expect(col.bullets.length).toBeGreaterThan(0);
    });
  });
});
