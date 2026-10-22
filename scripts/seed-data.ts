/**
 * Fictional demo business for development and demos only. Never seed this
 * into a production project.
 *
 * Stock values are the *current* stock: completed orders below are marked as
 * already deducted, so totals stay consistent with the inventory rules.
 */
import type { Enums } from "@/types/database";

export const demoOwner = {
  email: "demo@angkor-fashion.test",
  fullName: "Chan Sophea",
};

export const demoBusiness = {
  name: "Angkor Fashion",
  business_type: "clothing",
  description:
    "Affordable everyday fashion for men and women. Shop in Toul Kork or order online through Facebook and Telegram.",
  phone: "012 345 678",
  email: "hello@angkor-fashion.test",
  address: "Street 271, Toul Kork, Phnom Penh",
  currency: "USD",
  opening_hours: "Every day 8:00–20:00",
  delivery_info:
    "Delivery to all provinces in Cambodia. Phnom Penh: $1.50, same day for orders before 2pm. Provinces: $2.50 via J&T Express or Vireak Buntham, 1–3 days. Free delivery on orders over $50.\nដឹកជញ្ជូនទៅគ្រប់ខេត្តក្នុងប្រទេសកម្ពុជា។ ភ្នំពេញ $1.50 ខេត្ត $2.50។",
  payment_info:
    "Cash on delivery, ABA bank transfer, KHQR. Send a screenshot of your transfer on Telegram.\nបង់ប្រាក់ពេលទទួលទំនិញ ផ្ទេរតាម ABA ឬ KHQR។",
  preferred_language: "km_en" as Enums<"business_language">,
  low_stock_threshold: 5,
};

export const demoProducts = [
  {
    name: "Classic Black T-Shirt",
    name_km: "អាវយឺតពណ៌ខ្មៅ",
    description: "100% cotton crew-neck T-shirt. Sizes S, M, L.",
    description_km: "អាវយឺតកប្បាស ១០០%។ មានទំហំ S, M, L។",
    sku: "AF-TS-BLK",
    category: "T-Shirts",
    price: 15,
    stock_quantity: 20,
    is_active: true,
  },
  {
    name: "Classic White T-Shirt",
    name_km: "អាវយឺតពណ៌ស",
    description: "100% cotton crew-neck T-shirt. Sizes S, M, L.",
    description_km: "អាវយឺតកប្បាស ១០០%។ មានទំហំ S, M, L។",
    sku: "AF-TS-WHT",
    category: "T-Shirts",
    price: 15,
    stock_quantity: 4,
    is_active: true,
  },
  {
    name: "Slim Fit Jeans",
    name_km: "ខោខូវប៊យរាងស្លីម",
    description: "Stretch denim, dark blue. Waist sizes 28–36.",
    description_km: "ខោខូវប៊យពណ៌ខៀវចាស់ យឺតស្រួលពាក់។ ទំហំចង្កេះ ២៨–៣៦។",
    sku: "AF-JN-SLM",
    category: "Jeans",
    price: 28,
    stock_quantity: 12,
    is_active: true,
  },
  {
    name: "Linen Button Shirt",
    name_km: "អាវក្រណាត់លីនេន",
    description: "Breathable linen shirt for hot days. Beige.",
    description_km: "អាវក្រណាត់លីនេនស្រាល ស័ក្តិសមសម្រាប់ថ្ងៃក្តៅ។ ពណ៌ក្រែម។",
    sku: "AF-SH-LIN",
    category: "Shirts",
    price: 22,
    stock_quantity: 0,
    is_active: true,
  },
  {
    name: "Floral Summer Dress",
    name_km: "រ៉ូបផ្កាសម្រាប់រដូវក្តៅ",
    description: "Light chiffon dress with a floral print. Sizes S, M, L.",
    description_km: "រ៉ូបក្រណាត់ស្រាលមានផ្កា។ មានទំហំ S, M, L។",
    sku: "AF-DR-FLR",
    category: "Dresses",
    price: 32,
    stock_quantity: 8,
    is_active: true,
  },
  {
    name: "Silk Krama Scarf",
    name_km: "ក្រមាសូត្រ",
    description: "Handwoven Cambodian silk krama, 160 × 60 cm.",
    description_km: "ក្រមាសូត្រខ្មែរត្បាញដោយដៃ ទំហំ ១៦០ × ៦០ ស.ម.។",
    sku: "AF-AC-KRM",
    category: "Accessories",
    price: 9.5,
    stock_quantity: 35,
    is_active: true,
  },
  {
    name: "Canvas Tote Bag",
    name_km: "កាបូបក្រណាត់",
    description: "Sturdy canvas tote with an inside pocket.",
    description_km: "កាបូបក្រណាត់រឹងមាំ មានហោប៉ៅខាងក្នុង។",
    sku: "AF-AC-TOT",
    category: "Accessories",
    price: 12,
    stock_quantity: 3,
    is_active: true,
  },
  {
    name: "Grey Hooded Sweatshirt",
    name_km: "អាវរងាមានមួកពណ៌ប្រផេះ",
    description: "Seasonal item for the cool season (November–February).",
    description_km: "ទំនិញតាមរដូវ សម្រាប់រដូវរងា (វិច្ឆិកា–កុម្ភៈ)។",
    sku: "AF-HD-GRY",
    category: "Hoodies",
    price: 30,
    stock_quantity: 10,
    is_active: false,
  },
] as const;

export const demoCustomers = [
  { name: "Sok Dara", phone: "012 111 222", email: "dara@example.com", address: "Toul Kork, Phnom Penh", notes: null },
  { name: "ចាន់ ស្រីមុំ", phone: "017 333 444", email: null, address: "Siem Reap", notes: "Prefers delivery after 5pm." },
  { name: "Lim Vannak", phone: "098 555 666", email: "vannak@example.com", address: "Battambang", notes: null },
  { name: "Keo Sophea", phone: "011 777 888", email: null, address: "BKK1, Phnom Penh", notes: "Repeat customer." },
  { name: "Heng Pisey", phone: "015 999 000", email: "pisey@example.com", address: "Kampot", notes: null },
] as const;

type DemoOrder = {
  customer: number;
  status: Enums<"order_status">;
  daysAgo: number;
  items: { product: number; quantity: number }[];
  notes?: string;
};

/** Indexes refer to demoCustomers / demoProducts. Listed oldest first so order numbers follow dates. */
export const demoOrders: DemoOrder[] = [
  { customer: 0, status: "completed", daysAgo: 6, items: [{ product: 0, quantity: 2 }, { product: 2, quantity: 1 }] },
  { customer: 1, status: "completed", daysAgo: 5, items: [{ product: 4, quantity: 1 }, { product: 5, quantity: 2 }] },
  { customer: 4, status: "cancelled", daysAgo: 3, items: [{ product: 3, quantity: 1 }], notes: "Customer changed their mind." },
  { customer: 2, status: "confirmed", daysAgo: 2, items: [{ product: 0, quantity: 1 }, { product: 6, quantity: 1 }] },
  { customer: 3, status: "pending", daysAgo: 1, items: [{ product: 2, quantity: 1 }], notes: "Deliver after 5pm." },
  { customer: 0, status: "pending", daysAgo: 0, items: [{ product: 1, quantity: 2 }, { product: 5, quantity: 1 }] },
];

export const demoKnowledge: { title: string; content: string; category: Enums<"knowledge_category"> }[] = [
  {
    title: "តើមានដឹកជញ្ជូនទៅខេត្តទេ?",
    content: "មាន។ យើងដឹកជញ្ជូនទៅគ្រប់ខេត្តក្នុងប្រទេសកម្ពុជា។",
    category: "faq",
  },
  {
    title: "Do you deliver to Siem Reap?",
    content: "Yes. We deliver to Siem Reap with J&T Express in 1–2 days. The delivery fee is $2.50.",
    category: "faq",
  },
  {
    title: "តើអាចបង់ប្រាក់ពេលទទួលទំនិញបានទេ?",
    content: "បាន។ អ្នកអាចបង់ប្រាក់ពេលទទួលទំនិញ (COD) ទាំងនៅភ្នំពេញ និងតាមខេត្ត។",
    category: "faq",
  },
  {
    title: "Delivery policy",
    content:
      "Phnom Penh: $1.50, same day for orders before 2pm, otherwise next day. Provinces: $2.50 via J&T Express or Vireak Buntham, 1–3 days. Free delivery on orders over $50.",
    category: "delivery_policy",
  },
  {
    title: "Return and exchange policy",
    content:
      "You can exchange an item for a different size within 7 days if it is unworn and still has its tags. We refund only damaged or wrong items.\nអាចប្តូរទំហំបានក្នុងរយៈពេល ៧ ថ្ងៃ ប្រសិនបើមិនទាន់ពាក់ និងនៅមានស្លាក។",
    category: "return_policy",
  },
  {
    title: "Payment methods",
    content: "Cash on delivery, ABA bank transfer and KHQR. Please send a screenshot of your transfer on Telegram.",
    category: "payment_info",
  },
  {
    title: "T-shirt size guide",
    content: "S: chest 88–92 cm. M: chest 96–100 cm. L: chest 104–108 cm. Our T-shirts fit true to size.",
    category: "product_info",
  },
  {
    title: "Shop location",
    content: "Our shop is on Street 271, Toul Kork, Phnom Penh. Open every day 8:00–20:00. Motorbike parking available.",
    category: "business_info",
  },
];
