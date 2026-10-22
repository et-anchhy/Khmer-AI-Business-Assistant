import { describe, expect, it } from "vitest";
import { createBusinessSchema } from "@/features/business/schemas";
import { en } from "@/lib/i18n/dictionaries/en";

const schema = createBusinessSchema(en.validation);

const valid = {
  name: "Angkor Fashion",
  businessType: "clothing",
  description: "",
  phone: "",
  email: "",
  address: "",
  openingHours: "",
  deliveryInfo: "",
  paymentInfo: "",
  currency: "USD",
  preferredLanguage: "km_en",
  lowStockThreshold: "5",
};

function errorFor(input: Record<string, unknown>, path: string) {
  const result = schema.safeParse(input);
  return result.success ? undefined : result.error.issues.find((i) => i.path.join(".") === path)?.message;
}

describe("business schema", () => {
  it("stores blank optional fields as null and coerces the threshold", () => {
    const result = schema.parse(valid);
    expect(result.description).toBeNull();
    expect(result.email).toBeNull();
    expect(result.lowStockThreshold).toBe(5);
  });

  it("accepts Khmer text and Khmer numerals in the phone number", () => {
    const result = schema.parse({
      ...valid,
      name: "  ហាងអង្គរម៉ូដ  ",
      deliveryInfo: "មាន។ យើងដឹកជញ្ជូនទៅគ្រប់ខេត្តក្នុងប្រទេសកម្ពុជា។",
      phone: "០១២ ៣៤៥ ៦៧៨",
    });
    expect(result.name).toBe("ហាងអង្គរម៉ូដ");
    expect(result.phone).toBe("០១២ ៣៤៥ ៦៧៨");
  });

  it("accepts international phone formats", () => {
    expect(schema.parse({ ...valid, phone: "+855 (0)12-345-678" }).phone).toBe("+855 (0)12-345-678");
  });

  it("requires a business name and type", () => {
    expect(errorFor({ ...valid, name: "   " }, "name")).toBe(en.validation.businessNameRequired);
    expect(errorFor({ ...valid, businessType: undefined }, "businessType")).toBe(en.validation.chooseOption);
    expect(errorFor({ ...valid, businessType: "casino" }, "businessType")).toBe(en.validation.chooseOption);
  });

  it("validates optional email and phone only when provided", () => {
    expect(errorFor({ ...valid, email: "nope" }, "email")).toBe(en.validation.emailInvalid);
    expect(errorFor({ ...valid, phone: "call me" }, "phone")).toBe(en.validation.phoneInvalid);
  });

  it("enforces length limits that match the database", () => {
    expect(errorFor({ ...valid, name: "x".repeat(121) }, "name")).toBe("Must be 120 characters or fewer.");
    expect(errorFor({ ...valid, deliveryInfo: "x".repeat(4001) }, "deliveryInfo")).toBe(
      "Must be 4000 characters or fewer.",
    );
  });

  it("only allows supported currencies and languages", () => {
    expect(errorFor({ ...valid, currency: "EUR" }, "currency")).toBe(en.validation.chooseOption);
    expect(errorFor({ ...valid, preferredLanguage: "fr" }, "preferredLanguage")).toBe(en.validation.chooseOption);
  });

  it.each(["", "-1", "2.5", "abc", "100001"])("rejects low-stock threshold %j", (value) => {
    expect(errorFor({ ...valid, lowStockThreshold: value }, "lowStockThreshold")).toBe(en.validation.wholeNumber);
  });

  it("re-validates its own output unchanged (client output is sent to the server)", () => {
    const once = schema.parse({ ...valid, phone: "012 345 678" });
    expect(schema.parse(once)).toEqual(once);
  });
});
