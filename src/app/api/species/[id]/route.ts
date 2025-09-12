import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { species } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSpeciesSchema = z.object({
  category: z.enum(['crop', 'plant', 'tree']).optional(),
  commonName: z.string().min(1).optional(),
  scientificName: z.string().min(1).optional(),
  family: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  growthHabit: z.string().optional(),
  lifecycle: z.string().optional(),
  climate: z.string().optional(),
  region: z.string().optional(),
  soil: z.string().optional(),
  water: z.string().optional(),
  sunlight: z.string().optional(),
  spacing: z.string().optional(),
  sowingPlanting: z.string().optional(),
  fertilization: z.string().optional(),
  pests: z.string().optional(),
  diseases: z.string().optional(),
  management: z.string().optional(),
  harvest: z.string().optional(),
  yield: z.string().optional(),
  seasonality: z.string().optional(),
  uses: z.string().optional(),
  imageUrl: z.string().url().optional(),
  language: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(species)
      .where(eq(species.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('GET species error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validationResult = updateSpeciesSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = {
      ...validationResult.data,
      updatedAt: Date.now().toString()
    };

    const result = await db
      .update(species)
      .set(updateData)
      .where(eq(species.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('PUT species error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const result = await db
      .delete(species)
      .where(eq(species.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Species deleted successfully',
      deleted: result[0]
    });
  } catch (error) {
    console.error('DELETE species error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}