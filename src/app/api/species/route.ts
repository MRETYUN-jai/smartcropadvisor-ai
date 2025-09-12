import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { species } from '@/db/schema';
import { eq, like, and, or, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const search = searchParams.get('q');
    const category = searchParams.get('category');

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json({ 
        error: 'Invalid page or pageSize parameters',
        code: 'INVALID_PARAMETERS'
      }, { status: 400 });
    }

    const offset = (page - 1) * pageSize;

    let whereClause;
    const conditions = [];

    if (category) {
      conditions.push(eq(species.category, category));
    }

    if (search) {
      const searchCondition = or(
        like(species.commonName, `%${search}%`),
        like(species.scientificName, `%${search}%`),
        sql`${species.tags} LIKE ${`%${search}%`}`
      );
      conditions.push(searchCondition);
    }

    if (conditions.length === 0) {
      whereClause = undefined;
    } else if (conditions.length === 1) {
      whereClause = conditions[0];
    } else {
      whereClause = and(...conditions);
    }

    const totalResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(species)
      .where(whereClause);

    const total = Number(totalResult[0].count);

    const data = await db
      .select()
      .from(species)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data,
      page,
      pageSize,
      total
    });

  } catch (error) {
    console.error('GET /api/species error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();

    const { id, createdAt, updatedAt, ...speciesData } = requestBody;

    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const requiredFields = ['category', 'commonName', 'scientificName', 'family'];
    for (const field of requiredFields) {
      if (!speciesData[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}`,
          code: 'MISSING_REQUIRED_FIELD'
        }, { status: 400 });
      }
    }

    if (!['crop', 'plant', 'tree'].includes(speciesData.category)) {
      return NextResponse.json({ 
        error: 'Category must be one of: crop, plant, tree',
        code: 'INVALID_CATEGORY'
      }, { status: 400 });
    }

    const timestamp = Date.now();

    const newSpecies = await db
      .insert(species)
      .values({
        ...speciesData,
        createdAt: timestamp,
        updatedAt: timestamp,
        language: speciesData.language || 'en'
      })
      .returning();

    return NextResponse.json(newSpecies[0], { status: 201 });

  } catch (error) {
    console.error('POST /api/species error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { id: bodyId, createdAt, updatedAt, ...updates } = requestBody;

    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    if (updates.category && !['crop', 'plant', 'tree'].includes(updates.category)) {
      return NextResponse.json({ 
        error: 'Category must be one of: crop, plant, tree',
        code: 'INVALID_CATEGORY'
      }, { status: 400 });
    }

    const existingSpecies = await db
      .select()
      .from(species)
      .where(eq(species.id, parseInt(id)))
      .limit(1);

    if (existingSpecies.length === 0) {
      return NextResponse.json({ 
        error: 'Species not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const updatedSpecies = await db
      .update(species)
      .set({
        ...updates,
        updatedAt: Date.now()
      })
      .where(eq(species.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedSpecies[0]);

  } catch (error) {
    console.error('PUT /api/species error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const deletedSpecies = await db
      .delete(species)
      .where(eq(species.id, parseInt(id)))
      .returning();

    if (deletedSpecies.length === 0) {
      return NextResponse.json({ 
        error: 'Species not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Species deleted successfully',
      deleted: deletedSpecies[0]
    });

  } catch (error) {
    console.error('DELETE /api/species error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}