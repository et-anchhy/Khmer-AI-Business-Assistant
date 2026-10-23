import type { Product } from "@/types/database";

/** Product as sent to client components, with its public photo URL resolved on the server. */
export type ProductView = Product & { imageUrl: string | null };
