import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { species } from '@/db/schema';
import { desc } from 'drizzle-orm';

type SpeciesInput = {
  category: string;
  commonName: string;
  scientificName: string;
  family: string;
  tags?: string[];
  growthHabit?: string;
  lifecycle?: string;
  climate?: string;
  region?: string;
  soil?: string;
  water?: string;
  sunlight?: string;
  spacing?: string;
  sowingPlanting?: string;
  fertilization?: string;
  pests?: string;
  diseases?: string;
  management?: string;
  harvest?: string;
  yield?: string;
  seasonality?: string;
  uses?: string;
  imageUrl?: string;
  language?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ 
        error: "Request body must include 'items' array",
        code: "MISSING_ITEMS_ARRAY"
      }, { status: 400 });
    }

    const items: SpeciesInput[] = body.items;
    
    if (items.length === 0) {
      return NextResponse.json({ 
        error: "Items array cannot be empty",
        code: "EMPTY_ITEMS_ARRAY"
      }, { status: 400 });
    }

    if (items.length > 500) {
      return NextResponse.json({ 
        error: "Maximum 500 items allowed per request",
        code: "TOO_MANY_ITEMS"
      }, { status: 400 });
    }

    const validCategories = ['crop', 'plant', 'tree'];
    const now = Date.now();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.category) {
        return NextResponse.json({ 
          error: `Item ${i + 1}: category is required`,
          code: "MISSING_CATEGORY"
        }, { status: 400 });
      }

      if (!validCategories.includes(item.category)) {
        return NextResponse.json({ 
          error: `Item ${i + 1}: category must be one of: ${validCategories.join(', ')}`,
          code: "INVALID_CATEGORY"
        }, { status: 400 });
      }

      if (!item.commonName) {
        return NextResponse.json({ 
          error: `Item ${i + 1}: commonName is required`,
          code: "MISSING_COMMON_NAME"
        }, { status: 400 });
      }

      if (!item.scientificName) {
        return NextResponse.json({ 
          error: `Item ${i + 1}: scientificName is required`,
          code: "MISSING_SCIENTIFIC_NAME"
        }, { status: 400 });
      }

      if (!item.family) {
        return NextResponse.json({ 
          error: `Item ${i + 1}: family is required`,
          code: "MISSING_FAMILY"
        }, { status: 400 });
      }
    }

    const insertData = items.map((item) => ({
      category: item.category,
      commonName: item.commonName,
      scientificName: item.scientificName,
      family: item.family,
      tags: item.tags ? JSON.stringify(item.tags) : undefined,
      growthHabit: item.growthHabit,
      lifecycle: item.lifecycle,
      climate: item.climate,
      region: item.region,
      soil: item.soil,
      water: item.water,
      sunlight: item.sunlight,
      spacing: item.spacing,
      sowingPlanting: item.sowingPlanting,
      fertilization: item.fertilization,
      pests: item.pests,
      diseases: item.diseases,
      management: item.management,
      harvest: item.harvest,
      yield: item.yield,
      seasonality: item.seasonality,
      uses: item.uses,
      imageUrl: item.imageUrl,
      language: item.language || 'en',
      createdAt: now,
      updatedAt: now,
    }));

    await db.transaction(async (tx) => {
      for (const data of insertData) {
        await tx.insert(species).values(data);
      }
    });

    return NextResponse.json({ 
      inserted: items.length 
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/species/bulk error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}