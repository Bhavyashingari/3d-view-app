import { NextResponse } from 'next/server';
import { generate3DModel } from '@/lib/3d-generation';

export async function POST(request: Request) {
  try {
    const { prompt, imageUrl } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Note: The onProgress callback cannot be used in a stateless API route.
    // The client will just wait for the final response.
    const modelUrl = await generate3DModel({
      prompt,
      imageUrl,
    });

    return NextResponse.json({ modelUrl });
  } catch (error) {
    console.error('3D generation API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate 3D model', details: errorMessage }, { status: 500 });
  }
}
