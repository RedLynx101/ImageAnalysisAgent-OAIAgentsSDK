import { NextResponse } from 'next/server';
import { runs } from '@trigger.dev/sdk/v3';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const run = await runs.retrieve(params.id);
    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
}

