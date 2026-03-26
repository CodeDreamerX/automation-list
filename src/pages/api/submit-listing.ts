import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';
import { successResponse, errorResponse } from '../../lib/api/responses';

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body', 400);
  }

  const {
    name, website, country, email,
    category_slugs, description_en, description_de,
    city, region, phone, linkedin_url,
    technology_slugs, industry_slugs, certification_slugs,
    languages, countries_served,
    year_founded, employee_count, taking_new_projects,
    is_suspect,
  } = body;

  // --- Required field validation ---
  if (!name?.trim()) return errorResponse('Company name is required', 400);
  if (!website?.trim()) return errorResponse('Website is required', 400);
  if (!country?.trim()) return errorResponse('Country is required', 400);
  if (!email?.trim()) return errorResponse('Email is required', 400);
  if (!description_en?.trim()) return errorResponse('English description is required', 400);
  if (!Array.isArray(category_slugs) || category_slugs.length === 0) {
    return errorResponse('At least one category is required', 400);
  }

  // --- Insert into pending_listings ---
  const insertData = {
    name: name.trim(),
    website: website.trim(),
    country: country.trim(),
    email: email.trim(),
    category_slugs: Array.isArray(category_slugs) ? category_slugs : [],
    description_en: description_en?.trim() || null,
    description_de: description_de?.trim() || null,
    city: city?.trim() || null,
    region: region?.trim() || null,
    phone: phone?.trim() || null,
    linkedin_url: linkedin_url?.trim() || null,
    technology_slugs: Array.isArray(technology_slugs) ? technology_slugs : [],
    industry_slugs: Array.isArray(industry_slugs) ? industry_slugs : [],
    certification_slugs: Array.isArray(certification_slugs) ? certification_slugs : [],
    languages: Array.isArray(languages) ? languages : [],
    countries_served: typeof countries_served === 'string' ? countries_served.trim() || null : null,
    year_founded: year_founded ? (Number(year_founded) || null) : null,
    employee_count: employee_count || null,
    taking_new_projects:
      taking_new_projects === true ? true
      : taking_new_projects === false ? false
      : null,
    is_suspect: is_suspect === true,
  };

  const { error } = await supabase.from('pending_listings').insert([insertData]);
  if (error) {
    console.error('pending_listings insert error:', error);
    return errorResponse('Failed to submit listing. Please try again later.', 500);
  }

  return successResponse();
};
