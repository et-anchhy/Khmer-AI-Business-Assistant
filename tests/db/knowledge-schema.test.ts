import { describe, expect, it } from "vitest";
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_CONTENT_MAX, KNOWLEDGE_TITLE_MAX } from "@/features/knowledge/constants";
import { createTestDatabase } from "./harness";

describe("knowledge_base schema matches the app", () => {
  it("has exactly the categories the app offers, in order", async () => {
    const db = await createTestDatabase();
    const { rows } = await db.query<{ v: string }>("select unnest(enum_range(null::knowledge_category))::text as v");
    expect(rows.map((r) => r.v)).toEqual([...KNOWLEDGE_CATEGORIES]);
  }, 30_000);

  it("accepts entries at the form's maximum lengths and rejects longer ones", async () => {
    const db = await createTestDatabase();
    await db.query("insert into auth.users (id) values ('dddddddd-0000-4000-8000-000000000004')");
    const { rows: [b] } = await db.query<{ id: string }>(
      "insert into businesses (owner_id, name) values ('dddddddd-0000-4000-8000-000000000004', 'Shop') returning id",
    );
    const insert = (title: string, content: string) =>
      db.query("insert into knowledge_base (business_id, title, content) values ($1, $2, $3)", [b!.id, title, content]);

    await expect(insert("ក".repeat(KNOWLEDGE_TITLE_MAX), "ខ".repeat(KNOWLEDGE_CONTENT_MAX))).resolves.toBeDefined();
    await expect(insert("x".repeat(KNOWLEDGE_TITLE_MAX + 1), "y")).rejects.toThrow(/check constraint/);
    await expect(insert("x", "y".repeat(KNOWLEDGE_CONTENT_MAX + 1))).rejects.toThrow(/check constraint/);
    await expect(insert("   ", "y")).rejects.toThrow(/check constraint/);
  }, 30_000);
});
