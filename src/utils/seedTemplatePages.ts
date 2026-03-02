import { supabase } from '@/integrations/supabase/client';
import { allTemplates, getCategoryIdFromName } from '@/data/allTemplates';
import { inferSubcategory } from '@/data/subcategoryMappings';

/**
 * Syncs all individual template detail pages into the `pages` table.
 * Uses upsert with ON CONFLICT (slug) DO NOTHING to avoid duplicates.
 * Returns the number of pages inserted.
 */
export async function seedTemplatePages(): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;
  let skipped = 0;

  // Build rows for all templates
  const rows = allTemplates.map(template => {
    const categoryId = getCategoryIdFromName(template.category);
    const subcategoryInfo = inferSubcategory(template.id, template.category);
    const subcategorySlug = subcategoryInfo?.slug || 'general';
    const fullSlug = `templates/${categoryId}/${subcategorySlug}/${template.slug}`;

    return {
      slug: fullSlug,
      title: template.title,
      page_type: 'system' as const,
      page_group: 'template' as const,
      no_index: false,
      status: 'published' as const,
      sort_order: 100,
      meta_title: template.seoTitle || null,
      meta_description: template.seoDescription || null,
    };
  });

  // Batch insert in chunks of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    // Use upsert with ignoreDuplicates to skip existing rows
    const { data, error } = await supabase
      .from('pages')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: true })
      .select('id');

    if (error) {
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
    } else {
      inserted += data?.length || 0;
    }
  }

  skipped = rows.length - inserted;

  return { inserted, skipped, errors };
}
