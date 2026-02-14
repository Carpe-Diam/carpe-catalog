import type { Core } from '@strapi/strapi';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // ── 1. Auto-set public permissions ─────────────────────────────────
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (publicRole) {
      const permissions = await strapi.db
        .query('plugin::users-permissions.permission')
        .findMany({ where: { role: publicRole.id } });

      const existingActions = permissions.map((p: any) => p.action);

      const requiredPermissions = [
        'api::product.product.find',
        'api::product.product.findOne',
        'api::variant.variant.find',
        'api::variant.variant.findOne',
      ];

      for (const action of requiredPermissions) {
        if (!existingActions.includes(action)) {
          await strapi.db
            .query('plugin::users-permissions.permission')
            .create({ data: { action, role: publicRole.id } });
        }
      }
    }

    // ── 2. Seed from sku-data.json (runs only once) ────────────────────
    const dataPath = resolve(process.cwd(), '..', 'univdiam-catalog', 'sku-data.json');

    if (!existsSync(dataPath)) {
      console.log('[seed] sku-data.json not found — skipping seed');
      return;
    }

    // Check if products already exist (idempotent)
    const existingProducts = await strapi.documents('api::product.product').findMany({
      limit: 1,
    });

    if (existingProducts.length > 0) {
      console.log('[seed] Products already exist — skipping seed');
      return;
    }

    console.log('[seed] 🌱 Seeding from sku-data.json …');

    const raw = readFileSync(dataPath, 'utf-8');
    let parsed = JSON.parse(raw);
    const products = Array.isArray(parsed) ? parsed : [parsed];

    let productCount = 0;
    let variantCount = 0;

    for (const p of products) {
      try {
        const created = await strapi.documents('api::product.product').create({
          data: {
            parent_sku: p.parent_sku,
            title: p.title || '',
            category: p.category || '',
            subcategory: p.subcategory || '',
            description: p.description || '',
            base_price: p.base_price || 0,
            type_of_jewelry: p.type_of_jewelry || '',
            setting_style: p.setting_style || '',
            diamond_count: p.diamond_count || null,
            dimensions: p.dimensions || '',
            item_weight: p.item_weight || null,
            others: p.others || '',
          },
          status: 'published',
        });

        const productDocId = created.documentId;
        console.log(`[seed] ✅ Product "${p.parent_sku}" → ${p.title}`);
        productCount++;

        // Create variants
        for (const v of (p.variants || [])) {
          try {
            await strapi.documents('api::variant.variant').create({
              data: {
                variant_sku: v.variant_sku,
                product: productDocId,
                model: v.model || '',
                diameter: v.diameter || '',
                stock_status: v.stock_status || '',
                dia_quality: v.dia_quality || '',
                metal_type: v.metal_type || '',
                metal_color: v.metal_color || '',
                carat_weight: v.carat_weight || '',
                weight_grams: v.weight_grams || null,
                dia_size: v.dia_size || '',
                setting: v.setting || '',
                diamond_count: v.diamond_count || null,
                ct_per_stone: v.ct_per_stone || null,
                actual_ct: v.actual_ct || '',
                mtg_cost: v.mtg_cost || null,
                set_cost: v.set_cost || null,
                finish_cost: v.finish_cost || null,
                dia_cost: v.dia_cost || null,
                total_cost: v.total_cost || null,
                purchase_price_markup: v.purchase_price_markup || '',
                memo_price: v.memo_price || null,
                raw_purchase_price: v.raw_purchase_price || null,
                rounded_purchase_price: v.rounded_purchase_price || null,
                wholesale_price: v.wholesale_price || null,
                cod_wholesale_price: v.cod_wholesale_price || null,
                shopify_msrp: v.shopify_msrp || null,
                dimensions: v.dimensions || '',
              },
              status: 'published',
            });
            variantCount++;
          } catch (err: any) {
            console.error(`[seed] ❌ Variant "${v.variant_sku}":`, err.message);
          }
        }
      } catch (err: any) {
        console.error(`[seed] ❌ Product "${p.parent_sku}":`, err.message);
      }
    }

    console.log(`[seed] 🎉 Done! ${productCount} product(s), ${variantCount} variant(s) seeded.`);
  },
};
