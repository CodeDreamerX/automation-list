import { supabase } from "./supabaseClient";
import type { Industry, IndustryDB } from "../types/industry";

interface GetIndustriesOptions {
  lang?: "en" | "de";
  activeOnly?: boolean;
}

/**
 * Fetches industries from the database
 * 
 * @param options - Configuration options
 * @param options.lang - Language for name/description resolution (default: "en")
 * @param options.activeOnly - If true, only return active industries (default: false)
 * @returns Array of industries sorted by order_index (NULLS LAST), then name
 */
export async function getIndustries({
  lang = "en",
  activeOnly = false,
}: GetIndustriesOptions = {}): Promise<Industry[]> {
  // Build query
  let query = supabase
    .from("industries")
    .select("id, slug, name_en, name_de, description_en, description_de, order_index, is_active");

  // Filter by active status if requested
  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  // Order by order_index (NULLS LAST), then by name based on language
  const nameField = lang === "de" ? "name_de" : "name_en";
  query = query
    .order("order_index", { ascending: true, nullsLast: true })
    .order(nameField, { ascending: true, nullsLast: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching industries:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Transform database records to Industry objects with resolved names
  const industriesWithOrder: Array<Industry & { order_index: number | null }> = (data as IndustryDB[])
    .map((industry) => {
      // Resolve name based on language with fallback to name_en
      const name =
        lang === "de"
          ? industry.name_de || industry.name_en || ""
          : industry.name_en || industry.name_de || "";

      // Resolve description based on language (optional)
      const description =
        lang === "de"
          ? industry.description_de || industry.description_en || undefined
          : industry.description_en || industry.description_de || undefined;

      return {
        id: industry.id,
        slug: industry.slug,
        name,
        order_index: industry.order_index ?? null,
        ...(description && { description }),
      };
    })
    // Filter out industries without a valid name
    .filter((industry) => industry.name && industry.slug);

  // Sort by order_index (NULLS LAST), then by resolved name
  industriesWithOrder.sort((a, b) => {
    // First, sort by order_index (nulls last)
    if (a.order_index === null && b.order_index === null) {
      // Both null - sort by name
      return a.name.localeCompare(b.name);
    }
    if (a.order_index === null) {
      return 1; // a goes after b
    }
    if (b.order_index === null) {
      return -1; // b goes after a
    }
    if (a.order_index !== b.order_index) {
      return a.order_index - b.order_index;
    }
    // Same order_index - sort by name
    return a.name.localeCompare(b.name);
  });

  // Remove order_index from final result
  const industries: Industry[] = industriesWithOrder.map(({ order_index, ...industry }) => industry);

  return industries;
}

