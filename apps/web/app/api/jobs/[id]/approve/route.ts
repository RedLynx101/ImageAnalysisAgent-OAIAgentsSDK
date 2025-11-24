import { NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { SendEmailPayload } from '@repo/shared';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { pdfPath } = body;

  if (!pdfPath) {
    return NextResponse.json({ error: 'PDF path required' }, { status: 400 });
  }

  try {
    // Trigger the email sending job
    const handle = await tasks.trigger("send-approved-email", {
      pdfPath,
      recipient: undefined 
    } as SendEmailPayload);

    return NextResponse.json({ id: handle.id, status: 'approved' });
  } catch (error) {
    console.error("Failed to trigger email job:", error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
