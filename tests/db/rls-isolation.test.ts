/**
 * The most important security property of the app:
 * a user from Business A must NEVER be able to read or change Business B's
 * products, customers, orders, knowledge base or AI conversations.
 *
 * Runs every migration in an in-memory Postgres (PGlite) and talks to it as the
 * `authenticated` role with JWT claims set — the same path as Supabase's API.
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite, Transaction } from "@electric-sql/pglite";
import { asAnon, asUser, createTestDatabase } from "./harness";

const USER_A = "aaaaaaaa-0000-4000-8000-000000000001";
const USER_B = "bbbbbbbb-0000-4000-8000-000000000002";

type Seed = {
  business: string;
  product: string;
  customer: string;
  order: string;
  orderItem: string;
  knowledge: string;
  conversation: string;
  message: string;
};

let db: PGlite;
let A: Seed;
let B: Seed;

const BUSINESS_TABLES = [
  "products",
  "customers",
  "orders",
  "order_items",
  "knowledge_base",
  "conversations",
  "messages",
] as const;

async function one<T = Record<string, unknown>>(tx: PGlite | Transaction, sql: string, params: unknown[] = []) {
  const { rows } = await tx.query<T>(sql, params);
  return rows[0] as T;
}

/** Seeds a full business as the service owner (bypasses RLS, like the seed script). */
async function seedBusiness(userId: string, name: string): Promise<Seed> {
  await db.query(
    "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)",
    [userId, `${name.toLowerCase()}@example.com`, JSON.stringify({ full_name: `${name} Owner` })],
  );
  const business = (await one<{ id: string }>(db, "insert into businesses (owner_id, name) values ($1, $2) returning id", [userId, name])).id;
  const product = (await one<{ id: string }>(db,
    "insert into products (business_id, name, price, stock_quantity) values ($1, $2, 15, 20) returning id",
    [business, `${name} T-Shirt`])).id;
  const customer = (await one<{ id: string }>(db,
    "insert into customers (business_id, name) values ($1, $2) returning id", [business, `${name} Customer`])).id;
  const order = (await one<{ id: string }>(db,
    "insert into orders (business_id, customer_id, subtotal, total) values ($1, $2, 15, 15) returning id",
    [business, customer])).id;
  const orderItem = (await one<{ id: string }>(db,
    "insert into order_items (order_id, business_id, product_id, product_name, unit_price, quantity) values ($1, $2, $3, 'Shirt', 15, 1) returning id",
    [order, business, product])).id;
  const knowledge = (await one<{ id: string }>(db,
    "insert into knowledge_base (business_id, title, content) values ($1, 'Delivery?', 'Yes') returning id",
    [business])).id;
  const conversation = (await one<{ id: string }>(db,
    "insert into conversations (business_id, created_by, title) values ($1, $2, 'Chat') returning id",
    [business, userId])).id;
  const message = (await one<{ id: string }>(db,
    "insert into messages (conversation_id, business_id, role, content) values ($1, $2, 'user', 'Hi') returning id",
    [conversation, business])).id;
  await db.query("insert into storage.objects (bucket_id, name) values ('product-images', $1)", [`${business}/photo.jpg`]);
  return { business, product, customer, order, orderItem, knowledge, conversation, message };
}

beforeAll(async () => {
  db = await createTestDatabase();
  A = await seedBusiness(USER_A, "Alpha");
  B = await seedBusiness(USER_B, "Bravo");
}, 30_000);

describe("reading", () => {
  it.each(BUSINESS_TABLES)("user A sees only Business A rows in %s", async (table) => {
    const rows = await asUser(db, USER_A, async (tx) =>
      (await tx.query<{ business_id: string }>(`select business_id from ${table}`)).rows,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.business_id === A.business)).toBe(true);
  });

  it("user A cannot fetch Business B rows even by exact id", async () => {
    const found = await asUser(db, USER_A, async (tx) => ({
      business: (await tx.query("select 1 from businesses where id = $1", [B.business])).rows.length,
      product: (await tx.query("select 1 from products where id = $1", [B.product])).rows.length,
      customer: (await tx.query("select 1 from customers where id = $1", [B.customer])).rows.length,
      order: (await tx.query("select 1 from orders where id = $1", [B.order])).rows.length,
      orderItem: (await tx.query("select 1 from order_items where id = $1", [B.orderItem])).rows.length,
      knowledge: (await tx.query("select 1 from knowledge_base where id = $1", [B.knowledge])).rows.length,
      conversation: (await tx.query("select 1 from conversations where id = $1", [B.conversation])).rows.length,
      message: (await tx.query("select 1 from messages where id = $1", [B.message])).rows.length,
    }));
    expect(Object.values(found).every((n) => n === 0)).toBe(true);
  });

  it("user A sees only their own business and profile", async () => {
    const { businesses, profiles } = await asUser(db, USER_A, async (tx) => ({
      businesses: (await tx.query<{ id: string }>("select id from businesses")).rows,
      profiles: (await tx.query<{ id: string }>("select id from profiles")).rows,
    }));
    expect(businesses).toEqual([{ id: A.business }]);
    expect(profiles).toEqual([{ id: USER_A }]);
  });

  it("is_business_owner() is false for another business", async () => {
    const result = await asUser(db, USER_A, (tx) =>
      one<{ own: boolean; other: boolean }>(tx, "select is_business_owner($1) as own, is_business_owner($2) as other", [A.business, B.business]),
    );
    expect(result).toEqual({ own: true, other: false });
  });

  it("signed-out (anon) requests cannot read any table", async () => {
    for (const table of ["businesses", "profiles", ...BUSINESS_TABLES]) {
      await expect(asAnon(db, (tx) => tx.query(`select 1 from ${table}`))).rejects.toThrow(/permission denied/);
    }
  });
});

describe("writing to another business", () => {
  it.each([
    ["products", "name = 'hacked'", "product"],
    ["customers", "name = 'hacked'", "customer"],
    ["orders", "notes = 'hacked'", "order"],
    ["knowledge_base", "content = 'hacked'", "knowledge"],
    ["conversations", "title = 'hacked'", "conversation"],
    ["messages", "content = 'hacked'", "message"],
  ] as const)("user A cannot update Business B %s", async (table, assignment, key) => {
    const affected = await asUser(db, USER_A, async (tx) =>
      (await tx.query(`update ${table} set ${assignment} where id = $1`, [B[key]])).affectedRows,
    );
    expect(affected).toBe(0);
  });

  it.each([
    ["products", "product"],
    ["customers", "customer"],
    ["orders", "order"],
    ["order_items", "orderItem"],
    ["knowledge_base", "knowledge"],
    ["conversations", "conversation"],
    ["messages", "message"],
  ] as const)("user A cannot delete Business B %s", async (table, key) => {
    const affected = await asUser(db, USER_A, async (tx) =>
      (await tx.query(`delete from ${table} where id = $1`, [B[key]])).affectedRows,
    );
    expect(affected).toBe(0);
    const stillThere = await db.query(`select 1 from ${table} where id = $1`, [B[key]]);
    expect(stillThere.rows.length).toBe(1);
  });

  it("user A cannot update or delete Business B itself", async () => {
    const result = await asUser(db, USER_A, async (tx) => ({
      updated: (await tx.query("update businesses set name = 'hacked' where id = $1", [B.business])).affectedRows,
      deleted: (await tx.query("delete from businesses where id = $1", [B.business])).affectedRows,
    }));
    expect(result).toEqual({ updated: 0, deleted: 0 });
  });

  it.each([
    ["products", "insert into products (business_id, name) values ($1, 'x')"],
    ["customers", "insert into customers (business_id, name) values ($1, 'x')"],
    ["orders", "insert into orders (business_id) values ($1)"],
    ["knowledge_base", "insert into knowledge_base (business_id, title, content) values ($1, 'x', 'y')"],
    ["conversations", "insert into conversations (business_id) values ($1)"],
  ])("user A cannot insert %s into Business B", async (_table, sql) => {
    await expect(asUser(db, USER_A, (tx) => tx.query(sql, [B.business]))).rejects.toThrow(/row-level security/);
  });

  it("user A cannot move their own product into Business B", async () => {
    await expect(
      asUser(db, USER_A, (tx) => tx.query("update products set business_id = $1 where id = $2", [B.business, A.product])),
    ).rejects.toThrow(/row-level security/);
  });

  it("user A cannot attach an item to Business B's order, even labelled as Business A", async () => {
    // Passes RLS (business_id is A's) but the composite foreign key rejects it.
    await expect(
      asUser(db, USER_A, (tx) =>
        tx.query(
          "insert into order_items (order_id, business_id, product_name, unit_price, quantity) values ($1, $2, 'x', 1, 1)",
          [B.order, A.business],
        ),
      ),
    ).rejects.toThrow(/foreign key/);
  });

  it("user A cannot order Business B's product or customer", async () => {
    await expect(
      asUser(db, USER_A, (tx) =>
        tx.query(
          "insert into order_items (order_id, business_id, product_id, product_name, unit_price, quantity) values ($1, $2, $3, 'x', 1, 1)",
          [A.order, A.business, B.product],
        ),
      ),
    ).rejects.toThrow(/foreign key/);
    await expect(
      asUser(db, USER_A, (tx) =>
        tx.query("insert into orders (business_id, customer_id) values ($1, $2)", [A.business, B.customer]),
      ),
    ).rejects.toThrow(/foreign key/);
  });

  it("user A cannot post a message into Business B's conversation", async () => {
    await expect(
      asUser(db, USER_A, (tx) =>
        tx.query("insert into messages (conversation_id, business_id, role, content) values ($1, $2, 'user', 'x')", [
          B.conversation,
          A.business,
        ]),
      ),
    ).rejects.toThrow(/foreign key/);
  });

  it("user A cannot create a business owned by someone else, or a second business", async () => {
    await expect(
      asUser(db, USER_A, (tx) => tx.query("insert into businesses (owner_id, name) values ($1, 'x')", [USER_B])),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asUser(db, USER_A, (tx) => tx.query("insert into businesses (owner_id, name) values ($1, 'x')", [USER_A])),
    ).rejects.toThrow(/duplicate key/);
  });

  it("owners cannot reassign ownership or tamper with the order counter", async () => {
    await expect(
      asUser(db, USER_A, (tx) => tx.query("update businesses set owner_id = $1 where id = $2", [USER_B, A.business])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, USER_A, (tx) => tx.query("update businesses set last_order_number = 0 where id = $1", [A.business])),
    ).rejects.toThrow(/permission denied/);
  });

  it("user A cannot edit Business B owner's profile", async () => {
    const affected = await asUser(db, USER_A, async (tx) =>
      (await tx.query("update profiles set full_name = 'hacked' where id = $1", [USER_B])).affectedRows,
    );
    expect(affected).toBe(0);
  });
});

describe("own business still works", () => {
  it("user A can create, update and delete their own rows", async () => {
    const result = await asUser(db, USER_A, async (tx) => {
      const product = await one<{ id: string }>(tx,
        "insert into products (business_id, name, price, stock_quantity) values ($1, 'អាវយឺតពណ៌ខ្មៅ', 15, 3) returning id",
        [A.business]);
      const updated = (await tx.query("update products set stock_quantity = 4 where id = $1", [product.id])).affectedRows;
      const deleted = (await tx.query("delete from products where id = $1", [product.id])).affectedRows;
      const business = (await tx.query("update businesses set name = 'Alpha Shop' where id = $1", [A.business])).affectedRows;
      return { updated, deleted, business };
    });
    expect(result).toEqual({ updated: 1, deleted: 1, business: 1 });
  });

  it("order numbers are sequential per business and cannot be forged", async () => {
    const numbers = await asUser(db, USER_A, async (tx) => {
      const first = await one<{ order_number: string }>(tx,
        "insert into orders (business_id, order_number) values ($1, 'FORGED') returning order_number", [A.business]);
      const second = await one<{ order_number: string }>(tx,
        "insert into orders (business_id) values ($1) returning order_number", [A.business]);
      return [first.order_number, second.order_number];
    });
    // Each business already has ORD-00001 from the seed.
    expect(numbers).toEqual(["ORD-00002", "ORD-00003"]);
  });
});

describe("storage: product images", () => {
  it("user A can upload only into their own business folder", async () => {
    await expect(
      asUser(db, USER_A, (tx) =>
        tx.query("insert into storage.objects (bucket_id, name) values ('product-images', $1)", [`${A.business}/new.jpg`]),
      ),
    ).resolves.toBeDefined();
    for (const name of [`${B.business}/evil.jpg`, "not-a-uuid/evil.jpg", "evil.jpg"]) {
      await expect(
        asUser(db, USER_A, (tx) =>
          tx.query("insert into storage.objects (bucket_id, name) values ('product-images', $1)", [name]),
        ),
      ).rejects.toThrow(/row-level security/);
    }
  });

  it("user A cannot list or delete Business B images", async () => {
    const result = await asUser(db, USER_A, async (tx) => ({
      visible: (await tx.query<{ name: string }>("select name from storage.objects")).rows.map((r) => r.name),
      deleted: (await tx.query("delete from storage.objects where name = $1", [`${B.business}/photo.jpg`])).affectedRows,
    }));
    expect(result.visible).toEqual([`${A.business}/photo.jpg`]);
    expect(result.deleted).toBe(0);
  });
});

describe("schema constraints", () => {
  it("creates a profile from sign-up metadata", async () => {
    const profile = await one<{ full_name: string }>(db, "select full_name from profiles where id = $1", [USER_A]);
    expect(profile.full_name).toBe("Alpha Owner");
  });

  it("rejects negative stock and negative prices", async () => {
    await expect(asUser(db, USER_A, (tx) => tx.query("update products set stock_quantity = -1 where id = $1", [A.product])))
      .rejects.toThrow(/check constraint/);
    await expect(asUser(db, USER_A, (tx) => tx.query("update products set price = -0.01 where id = $1", [A.product])))
      .rejects.toThrow(/check constraint/);
  });
});
