import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asAnon, asUser, createTestDatabase } from "./harness";

const USER_A = "aaaaaaaa-0000-4000-8000-0000000000a1";
const USER_B = "bbbbbbbb-0000-4000-8000-0000000000b2";
let db: PGlite;
let productA: string;
let productB: string;

async function seed(userId: string, name: string) {
  await db.query("insert into auth.users (id) values ($1)", [userId]);
  const { rows: [business] } = await db.query<{ id: string }>(
    "insert into businesses (owner_id, name) values ($1, $2) returning id", [userId, name]);
  const { rows: [product] } = await db.query<{ id: string }>(
    "insert into products (business_id, name, stock_quantity) values ($1, 'Shirt', 10) returning id", [business!.id]);
  return product!.id;
}

const stockOf = async (id: string) =>
  (await db.query<{ stock_quantity: number }>("select stock_quantity from products where id = $1", [id])).rows[0]!.stock_quantity;

beforeAll(async () => {
  db = await createTestDatabase();
  productA = await seed(USER_A, "Alpha");
  productB = await seed(USER_B, "Bravo");
}, 30_000);

describe("adjust_product_stock()", () => {
  it("adds and removes stock atomically for the owner", async () => {
    const result = await asUser(db, USER_A, async (tx) => {
      const added = (await tx.query<{ n: number }>("select adjust_product_stock($1, 5) as n", [productA])).rows[0]!.n;
      const removed = (await tx.query<{ n: number }>("select adjust_product_stock($1, -15) as n", [productA])).rows[0]!.n;
      return { added, removed };
    });
    expect(result).toEqual({ added: 15, removed: 0 });
  });

  it("never lets stock go below zero", async () => {
    await expect(asUser(db, USER_A, (tx) => tx.query("select adjust_product_stock($1, -11)", [productA]))).rejects.toThrow(
      /check constraint/,
    );
    expect(await stockOf(productA)).toBe(10);
  });

  it("cannot touch another business's product", async () => {
    await expect(asUser(db, USER_A, (tx) => tx.query("select adjust_product_stock($1, 100)", [productB]))).rejects.toThrow(
      /Product not found/,
    );
    await expect(asUser(db, USER_A, (tx) => tx.query("select adjust_product_stock($1, -10)", [productB]))).rejects.toThrow(
      /Product not found/,
    );
    expect(await stockOf(productB)).toBe(10);
  });

  it("is not callable by signed-out users", async () => {
    await expect(asAnon(db, (tx) => tx.query("select adjust_product_stock($1, 1)", [productA]))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("rejects absurd changes", async () => {
    await expect(asUser(db, USER_A, (tx) => tx.query("select adjust_product_stock($1, 2000000)", [productA]))).rejects.toThrow(
      /Invalid stock change/,
    );
  });
});
