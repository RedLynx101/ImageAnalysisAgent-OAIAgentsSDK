import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { tasks } from '@trigger.dev/sdk/v3';
import { GenerateReportPayload } from '@repo/shared';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = Date.now() + '-' + file.name.replace(/\s/g, '_');
  
  // Save to root uploads/ folder
  // We use process.cwd() which in Next.js is usually apps/web, so we go up two levels.
  // However, locally it might be the repo root depending on how it's run. 
  // Assuming 'npm run dev' from root using workspaces, CWD is root? 
  // No, 'npm run dev --workspace=apps/web' usually sets CWD to apps/web.
  const uploadDir = path.resolve(process.cwd(), '../../uploads'); 
  const filepath = path.join(uploadDir, filename);

  // Ensure directory exists (it should from gitkeep)
  try {
      await writeFile(filepath, buffer);
  } catch (e) {
      // Fallback for path resolution issues
      console.error("Error writing file to", filepath, e);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }

  // Trigger the job
  try {
    // We use the string ID "generate-report" and cast payload for type safety without importing the worker
    const handle = await tasks.trigger("generate-report", {
      imagePath: filepath,
      originalName: file.name
    } as GenerateReportPayload);

    return NextResponse.json({ id: handle.id });
  } catch (error) {
    console.error("Failed to trigger job:", error);
    return NextResponse.json({ error: 'Failed to start job' }, { status: 500 });
  }
}
