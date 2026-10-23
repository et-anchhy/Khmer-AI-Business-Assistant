import { describe, expect, it } from "vitest";
import { asUser, createTestDatabase } from "./harness";

const OWNER = "eeeeeeee-0000-4000-8000-000000000005";
const OTHER = "ffffffff-0000-4000-8000-000000000006";

describe("conversation activity trigger", () => {
  it("moves a conversation to the top when a message is added, only for its own business", async () => {
    const db = await createTestDatabase();
    for (const id of [OWNER, OTHER]) await db.query("insert into auth.users (id) values ($1)", [id]);
    const { rows: [mine] } = await db.query<{ id: string }>("insert into businesses (owner_id, name) values ($1, 'Mine') returning id", [OWNER]);
    const { rows: [theirs] } = await db.query<{ id: string }>("insert into businesses (owner_id, name) values ($1, 'Theirs') returning id", [OTHER]);
    const { rows: [old] } = await db.query<{ id: string }>(
      "insert into conversations (business_id, title, updated_at) values ($1, 'old', now() - interval '2 days') returning id", [mine!.id]);
    const { rows: [foreign] } = await db.query<{ id: string }>(
      "insert into conversations (business_id, title, updated_at) values ($1, 'foreign', now() - interval '2 days') returning id", [theirs!.id]);

    await db.query("insert into messages (conversation_id, business_id, role, content) values ($1, $2, 'user', 'hi')", [old!.id, mine!.id]);

    const { rows } = await db.query<{ title: string; fresh: boolean }>(
      "select title, updated_at > now() - interval '1 minute' as fresh from conversations order by title",
    );
    expect(rows).toEqual([
      { title: "foreign", fresh: false },
      { title: "old", fresh: true },
    ]);

    // An owner cannot bump (or post into) another business's conversation.
    await expect(
      asUser(db, OWNER, (tx) =>
        tx.query("insert into messages (conversation_id, business_id, role, content) values ($1, $2, 'user', 'x')", [foreign!.id, mine!.id]),
      ),
    ).rejects.toThrow(/foreign key/);
  }, 30_000);

  it("works for the signed-in owner under RLS", async () => {
    const db = await createTestDatabase();
    await db.query("insert into auth.users (id) values ($1)", [OWNER]);
    const { rows: [b] } = await db.query<{ id: string }>("insert into businesses (owner_id, name) values ($1, 'Mine') returning id", [OWNER]);
    const { rows: [c] } = await db.query<{ id: string }>(
      "insert into conversations (business_id, updated_at) values ($1, now() - interval '1 day') returning id", [b!.id]);
    const fresh = await asUser(db, OWNER, async (tx) => {
      await tx.query("insert into messages (conversation_id, business_id, role, content) values ($1, $2, 'user', 'សួស្តី')", [c!.id, b!.id]);
      return (await tx.query<{ fresh: boolean }>("select updated_at > now() - interval '1 minute' as fresh from conversations")).rows[0]!.fresh;
    });
    expect(fresh).toBe(true);
  }, 30_000);
});
