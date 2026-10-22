/**
 * Seeds the fictional "Angkor Fashion" demo business — development/demo only.
 *
 *   npm run seed -- --yes
 *
 * Uses the service-role key (bypasses RLS), so it never runs inside the app.
 * Re-running is safe: the demo owner's business is deleted and recreated.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { demoBusiness, demoCustomers, demoKnowledge, demoOrders, demoOwner, demoProducts } from "./seed-data";

function exit(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_DEMO_PASSWORD || "angkor-demo-2026";

if (process.env.NODE_ENV === "production") exit("Refusing to seed demo data with NODE_ENV=production.");
if (!url || !serviceKey || url.includes("your-project-ref") || serviceKey.startsWith("your-")) {
  exit("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
}
if (!process.argv.includes("--yes")) {
  exit(
    `This will delete and recreate the demo business owned by ${demoOwner.email}\n  in ${url}\n  Re-run with: npm run seed -- --yes`,
  );
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Result<T> = { data: T | null; error: { message: string } | null };

/** Exits on error; for writes that return no rows. */
function checkOk(result: Result<unknown>, step: string): void {
  if (result.error) {
    exit(`${step} failed: ${result.error.message}\n  Have you applied the migrations in supabase/migrations?`);
  }
}

/** Exits on error or missing data; returns the rows. */
function check<R extends Result<unknown>>(result: R, step: string): NonNullable<R["data"]> {
  checkOk(result, step);
  if (result.data === null || result.data === undefined) exit(`${step} returned no data.`);
  return result.data as NonNullable<R["data"]>;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) exit(`Listing users failed: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10 + (days % 8), 15, 0, 0);
  return date.toISOString();
}

async function main() {
  console.log(`Seeding demo data into ${url}`);

  // 1. Demo owner (email pre-confirmed so you can log in immediately).
  let userId = await findUserIdByEmail(demoOwner.email);
  if (userId) {
    checkOk(await admin.auth.admin.updateUserById(userId, { password }), "Updating demo user");
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: demoOwner.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: demoOwner.fullName },
    });
    if (error || !created.user) exit(`Creating demo user failed: ${error?.message ?? "no user returned"}`);
    userId = created.user.id;
  }
  checkOk(await admin.from("profiles").upsert({ id: userId, full_name: demoOwner.fullName }), "Saving profile");

  // 2. Fresh business (cascade removes the previous demo data).
  checkOk(await admin.from("businesses").delete().eq("owner_id", userId), "Removing previous demo business");
  const business = check(
    await admin.from("businesses").insert({ ...demoBusiness, owner_id: userId }).select("id").single(),
    "Creating business",
  );
  const businessId = business.id;

  // 3. Products, customers, knowledge base.
  const products = check(
    await admin
      .from("products")
      .insert(demoProducts.map((p) => ({ ...p, business_id: businessId })))
      .select("id, name, price"),
    "Creating products",
  );
  const customers = check(
    await admin
      .from("customers")
      .insert(demoCustomers.map((c) => ({ ...c, business_id: businessId })))
      .select("id"),
    "Creating customers",
  );
  checkOk(
    await admin.from("knowledge_base").insert(demoKnowledge.map((k) => ({ ...k, business_id: businessId }))),
    "Creating knowledge base",
  );

  // 4. Orders, one at a time so order numbers follow the dates.
  for (const order of demoOrders) {
    const lines = order.items.map(({ product, quantity }) => {
      const p = products[product]!;
      return { product_id: p.id, product_name: p.name, unit_price: Number(p.price), quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
    const createdAt = daysAgo(order.daysAgo);

    const inserted = check(
      await admin
        .from("orders")
        .insert({
          business_id: businessId,
          customer_id: customers[order.customer]!.id,
          status: order.status,
          subtotal,
          total: subtotal,
          notes: order.notes ?? null,
          stock_deducted: order.status === "completed",
          created_at: createdAt,
          updated_at: createdAt,
        })
        .select("id")
        .single(),
      "Creating order",
    );
    checkOk(
      await admin
        .from("order_items")
        .insert(lines.map((line) => ({ ...line, order_id: inserted.id, business_id: businessId, created_at: createdAt }))),
      "Creating order items",
    );
  }

  console.log(`
✔ Seeded "${demoBusiness.name}": ${products.length} products, ${customers.length} customers, ${demoOrders.length} orders, ${demoKnowledge.length} knowledge entries.

  Log in at ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login
    email:    ${demoOwner.email}
    password: ${password}
`);
}

main().catch((error) => exit(error instanceof Error ? error.message : String(error)));
