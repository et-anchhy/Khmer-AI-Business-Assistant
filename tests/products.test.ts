import { describe, expect, it } from "vitest";
import { createProductSchema, createStockUpdateSchema, productFiltersSchema } from "@/features/products/schemas";
import { stockStatus } from "@/features/products/stock";
import { formatMoney } from "@/lib/format/money";
import { en } from "@/lib/i18n/dictionaries/en";
import { km } from "@/lib/i18n/dictionaries/km";
import { ilikeAnyFilter, isUuid } from "@/lib/supabase/filters";
import { checkProductImage, sniffImageType } from "@/lib/uploads/image";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/uploads/limits";

const schema = createProductSchema(en.validation);
const valid = {
  name: "Classic Black T-Shirt",
  nameKm: "អាវយឺតពណ៌ខ្មៅ",
  description: "",
  descriptionKm: "",
  sku: "",
  category: "",
  price: "15",
  stockQuantity: "20",
  isActive: true,
};

function errorFor(input: Record<string, unknown>, path: string, s = schema) {
  const result = s.safeParse(input);
  return result.success ? undefined : result.error.issues.find((i) => i.path.join(".") === path)?.message;
}

describe("product validation", () => {
  it("parses a valid product with Khmer text", () => {
    const result = schema.parse({ ...valid, descriptionKm: "អាវយឺតកប្បាស ១០០%។" });
    expect(result).toMatchObject({ name: "Classic Black T-Shirt", nameKm: "អាវយឺតពណ៌ខ្មៅ", price: 15, stockQuantity: 20, sku: null });
  });

  it("uses the exact messages from the spec", () => {
    expect(errorFor({ ...valid, name: "  " }, "name")).toBe("Product name is required.");
    expect(errorFor({ ...valid, price: "-1" }, "price")).toBe("Price must be greater than or equal to 0.");
    expect(errorFor({ ...valid, stockQuantity: "-3" }, "stockQuantity")).toBe("Stock cannot be negative.");
  });

  it("returns Khmer messages with the Khmer dictionary", () => {
    expect(errorFor({ ...valid, name: "" }, "name", createProductSchema(km.validation))).toBe(km.validation.productNameRequired);
  });

  it("accepts a zero price but not an empty one", () => {
    expect(schema.parse({ ...valid, price: "0" }).price).toBe(0);
    expect(errorFor({ ...valid, price: "" }, "price")).toBe(en.validation.priceInvalid);
  });

  it("limits prices to cents and stock to whole numbers", () => {
    expect(schema.parse({ ...valid, price: "9.99" }).price).toBe(9.99);
    expect(schema.parse({ ...valid, price: "0.1" }).price).toBe(0.1);
    expect(errorFor({ ...valid, price: "1.005" }, "price")).toBe(en.validation.priceDecimals);
    expect(errorFor({ ...valid, stockQuantity: "2.5" }, "stockQuantity")).toBe(en.validation.stockWholeNumber);
    expect(errorFor({ ...valid, price: "abc" }, "price")).toBe(en.validation.priceInvalid);
  });

  it("re-validates its own output (the client sends parsed values)", () => {
    const once = schema.parse(valid);
    expect(schema.parse(once)).toEqual(once);
  });
});

describe("stock updates", () => {
  const stock = createStockUpdateSchema(en.validation);

  it("allows adding or removing but not zero", () => {
    expect(stock.parse({ mode: "add", amount: "10" })).toEqual({ mode: "add", amount: 10 });
    expect(stock.parse({ mode: "add", amount: "-2" })).toEqual({ mode: "add", amount: -2 });
    expect(stock.safeParse({ mode: "add", amount: "0" }).success).toBe(false);
  });

  it("does not allow setting a negative count", () => {
    const result = stock.safeParse({ mode: "set", amount: "-1" });
    expect(result.error?.issues[0]?.message).toBe("Stock cannot be negative.");
    expect(stock.parse({ mode: "set", amount: "0" })).toEqual({ mode: "set", amount: 0 });
  });

  it("classifies stock against the business threshold", () => {
    expect(stockStatus(0, 5)).toBe("out");
    expect(stockStatus(5, 5)).toBe("low");
    expect(stockStatus(1, 5)).toBe("low");
    expect(stockStatus(6, 5)).toBe("in");
    expect(stockStatus(1, 0)).toBe("in");
  });
});

describe("list filters from the URL", () => {
  it("ignores invalid values instead of failing", () => {
    expect(productFiltersSchema.parse({ stock: "weird", status: "x", page: "-4", q: "  shirt " })).toEqual({
      q: "shirt",
      stock: undefined,
      status: undefined,
      category: undefined,
      page: 1,
    });
    expect(productFiltersSchema.parse({ page: "3", stock: "low" })).toMatchObject({ page: 3, stock: "low" });
  });
});

describe("search filter escaping", () => {
  it("builds an OR filter across columns", () => {
    expect(ilikeAnyFilter(["name", "sku"], "shirt")).toBe('name.ilike."%shirt%",sku.ilike."%shirt%"');
  });

  it("neutralises PostgREST syntax and LIKE wildcards in user input", () => {
    // Without quoting, a comma or parenthesis would inject a new condition.
    expect(ilikeAnyFilter(["name"], 'a,id.eq.1)')).toBe('name.ilike."%a,id.eq.1)%"');
    expect(ilikeAnyFilter(["name"], 'say "hi"')).toBe('name.ilike."%say \\"hi\\"%"');
    expect(ilikeAnyFilter(["name"], "100%_off\\")).toBe('name.ilike."%100\\\\%\\\\_off\\\\\\\\%"');
  });

  it("keeps Khmer search terms intact", () => {
    expect(ilikeAnyFilter(["name_km"], "អាវ")).toBe('name_km.ilike."%អាវ%"');
  });

  it("validates ids before they reach the database", () => {
    expect(isUuid("aaaaaaaa-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid("1 or 1=1")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});

describe("image upload checks", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

  it("detects real image types from their bytes", () => {
    expect(sniffImageType(jpeg)).toBe("image/jpeg");
    expect(sniffImageType(png)).toBe("image/png");
    expect(sniffImageType(webp)).toBe("image/webp");
    expect(checkProductImage(png)).toEqual({ ok: true, type: "image/png", extension: "png" });
  });

  it("rejects disguised files, empty files and oversized files", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script>");
    expect(checkProductImage(html)).toEqual({ ok: false, reason: "unsupportedType" });
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(checkProductImage(svg)).toEqual({ ok: false, reason: "unsupportedType" });
    expect(checkProductImage(new Uint8Array())).toEqual({ ok: false, reason: "empty" });
    const big = new Uint8Array(PRODUCT_IMAGE_MAX_BYTES + 1);
    big.set(jpeg);
    expect(checkProductImage(big)).toEqual({ ok: false, reason: "tooLarge" });
  });
});

describe("money formatting", () => {
  it("formats USD with cents and riel without decimals", () => {
    expect(formatMoney(15, "USD")).toBe("$15.00");
    expect(formatMoney(9.5, "USD")).toBe("$9.50");
    expect(formatMoney(60000, "KHR")).toBe("60,000៛");
  });
});
