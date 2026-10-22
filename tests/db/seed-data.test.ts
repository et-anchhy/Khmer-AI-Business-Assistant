import { describe, expect, it } from "vitest";
import { demoBusiness, demoCustomers, demoKnowledge, demoOrders, demoProducts } from "@/scripts/seed-data";
import { createBusinessSchema } from "@/features/business/schemas";
import { en } from "@/lib/i18n/dictionaries/en";
import { createTestDatabase } from "./harness";

const OWNER = "cccccccc-0000-4000-8000-000000000003";

describe("demo seed data", () => {
  it("passes the business form validation", () => {
    const result = createBusinessSchema(en.validation).safeParse({
      name: demoBusiness.name,
      businessType: demoBusiness.business_type,
      description: demoBusiness.description,
      phone: demoBusiness.phone,
      email: demoBusiness.email,
      address: demoBusiness.address,
      openingHours: demoBusiness.opening_hours,
      deliveryInfo: demoBusiness.delivery_info,
      paymentInfo: demoBusiness.payment_info,
      currency: demoBusiness.currency,
      preferredLanguage: demoBusiness.preferred_language,
      lowStockThreshold: demoBusiness.low_stock_threshold,
    });
    expect(result.success).toBe(true);
  });

  it("includes the spec's example product and a Khmer FAQ", () => {
    expect(demoProducts[0]).toMatchObject({ name: "Classic Black T-Shirt", name_km: "អាវយឺតពណ៌ខ្មៅ", price: 15, stock_quantity: 20 });
    expect(demoKnowledge.some((k) => k.title === "តើមានដឹកជញ្ជូនទៅខេត្តទេ?")).toBe(true);
  });

  it("has orders that reference existing products and customers", () => {
    for (const order of demoOrders) {
      expect(demoCustomers[order.customer]).toBeDefined();
      for (const item of order.items) expect(demoProducts[item.product]).toBeDefined();
    }
  });

  it("satisfies every database constraint", async () => {
    const db = await createTestDatabase();
    await db.query("insert into auth.users (id) values ($1)", [OWNER]);

    const b = demoBusiness;
    const { rows: [business] } = await db.query<{ id: string }>(
      `insert into businesses (owner_id, name, business_type, description, phone, email, address, currency,
         opening_hours, delivery_info, payment_info, preferred_language, low_stock_threshold)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
      [OWNER, b.name, b.business_type, b.description, b.phone, b.email, b.address, b.currency,
        b.opening_hours, b.delivery_info, b.payment_info, b.preferred_language, b.low_stock_threshold],
    );

    const productIds: string[] = [];
    for (const p of demoProducts) {
      const { rows } = await db.query<{ id: string }>(
        `insert into products (business_id, name, name_km, description, description_km, sku, category, price, stock_quantity, is_active)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [business!.id, p.name, p.name_km, p.description, p.description_km, p.sku, p.category, p.price, p.stock_quantity, p.is_active],
      );
      productIds.push(rows[0]!.id);
    }
    const customerIds: string[] = [];
    for (const c of demoCustomers) {
      const { rows } = await db.query<{ id: string }>(
        "insert into customers (business_id, name, phone, email, address, notes) values ($1,$2,$3,$4,$5,$6) returning id",
        [business!.id, c.name, c.phone, c.email, c.address, c.notes],
      );
      customerIds.push(rows[0]!.id);
    }
    for (const k of demoKnowledge) {
      await db.query("insert into knowledge_base (business_id, title, content, category) values ($1,$2,$3,$4)", [
        business!.id, k.title, k.content, k.category,
      ]);
    }
    for (const order of demoOrders) {
      const subtotal = order.items.reduce((sum, i) => sum + demoProducts[i.product]!.price * i.quantity, 0);
      const { rows } = await db.query<{ id: string }>(
        "insert into orders (business_id, customer_id, status, subtotal, total, stock_deducted) values ($1,$2,$3,$4,$4,$5) returning id",
        [business!.id, customerIds[order.customer], order.status, subtotal, order.status === "completed"],
      );
      for (const item of order.items) {
        const p = demoProducts[item.product]!;
        await db.query(
          "insert into order_items (order_id, business_id, product_id, product_name, unit_price, quantity) values ($1,$2,$3,$4,$5,$6)",
          [rows[0]!.id, business!.id, productIds[item.product], p.name, p.price, item.quantity],
        );
      }
    }

    // Order totals match the sum of their line items.
    const { rows: mismatched } = await db.query(
      `select o.order_number from orders o join order_items i on i.order_id = o.id
        group by o.id having o.total <> sum(i.line_total)`,
    );
    expect(mismatched).toEqual([]);
    const { rows: numbers } = await db.query<{ order_number: string }>("select order_number from orders order by order_number");
    expect(numbers.map((r) => r.order_number)).toEqual(["ORD-00001", "ORD-00002", "ORD-00003", "ORD-00004", "ORD-00005", "ORD-00006"]);
  }, 30_000);
});
