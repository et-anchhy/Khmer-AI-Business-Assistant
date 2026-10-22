import "server-only";
import type { BusinessFormValues } from "@/features/business/schemas";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { Business, TablesInsert, TablesUpdate } from "@/types/database";

/**
 * Data access for businesses. Every function takes the request-scoped
 * Supabase client, so all queries run as the signed-in user under RLS.
 */

export async function getBusinessByOwner(supabase: ServerSupabaseClient, ownerId: string): Promise<Business | null> {
  const { data, error } = await supabase.from("businesses").select("*").eq("owner_id", ownerId).maybeSingle();
  if (error) throw error;
  return data;
}

export function toBusinessRow(values: BusinessFormValues): TablesUpdate<"businesses"> {
  return {
    name: values.name,
    business_type: values.businessType,
    description: values.description,
    phone: values.phone,
    email: values.email,
    address: values.address,
    currency: values.currency,
    opening_hours: values.openingHours,
    delivery_info: values.deliveryInfo,
    payment_info: values.paymentInfo,
    preferred_language: values.preferredLanguage,
    low_stock_threshold: values.lowStockThreshold,
  };
}

export function toBusinessFormValues(business: Business): BusinessFormValues {
  return {
    name: business.name,
    businessType: business.business_type as BusinessFormValues["businessType"],
    description: business.description,
    phone: business.phone,
    email: business.email,
    address: business.address,
    currency: business.currency as BusinessFormValues["currency"],
    openingHours: business.opening_hours,
    deliveryInfo: business.delivery_info,
    paymentInfo: business.payment_info,
    preferredLanguage: business.preferred_language,
    lowStockThreshold: business.low_stock_threshold,
  };
}

export async function createBusiness(
  supabase: ServerSupabaseClient,
  ownerId: string,
  values: BusinessFormValues,
): Promise<{ id: string }> {
  const row: TablesInsert<"businesses"> = { ...toBusinessRow(values), name: values.name, owner_id: ownerId };
  const { data, error } = await supabase.from("businesses").insert(row).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateBusiness(
  supabase: ServerSupabaseClient,
  businessId: string,
  values: BusinessFormValues,
): Promise<void> {
  const { error } = await supabase.from("businesses").update(toBusinessRow(values)).eq("id", businessId);
  if (error) throw error;
}
