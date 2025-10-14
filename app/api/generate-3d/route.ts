import { NextResponse } from 'next/server';
import axios from 'axios';
import { AzureOpenAI } from "openai";

// Ensure you have these environment variables set in your Vercel project
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const azureApiKey = process.env.AZURE_OPENAI_API_KEY!;
const dalleDeploymentName = process.env.AZURE_OPENAI_DALLE_DEPLOYMENT_NAME!;
const huggingFaceToken = process.env.HUGGINGFACE_TOKEN!;

/**
 * Generates an image using Azure DALL-E 3.
 * This function runs on the server and uses secret API keys.
 */
async function generateImageWithAzureDalle(prompt: string): Promise<string> {
  if (!azureEndpoint || !azureApiKey || !dalleDeploymentName) {
    throw new Error("Azure OpenAI environment variables are not configured.");
  }

  const client = new AzureOpenAI({
    apiKey: azureApiKey,
    endpoint: azureEndpoint,
    deployment: dalleDeploymentName,
    apiVersion: "2024-05-01-preview",
  });
  
  const response = await client.images.generate({
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "hd",
    style: "vivid",
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("Image generation failed: No URL returned from Azure DALL-E.");
  }
  return imageUrl;
}

/**
 * Converts an image to a 3D model using the Stable Fast 3D Hugging Face Space.
 */
async function convertImageTo3D(imageUrl: string): Promise<string> {
  if (!huggingFaceToken) {
    throw new Error("Hugging Face token is not configured.");
  }

  const imageBlob = await fetch(imageUrl).then(r => r.blob());
  const formData = new FormData();
  formData.append('image', imageBlob, 'input.png');

  const response = await axios.post(
    'https://hf.space/embed/stabilityai/stable-fast-3d/api/predict',
    formData,
    {
      headers: { 'Authorization': `Bearer ${huggingFaceToken}` },
      timeout: 180000, // 3 minutes
    }
  );

  const glbUrl = response.data?.data?.[0]?.url || response.data?.data?.[0];
  if (!glbUrl) {
    throw new Error('Image-to-3D conversion failed: No model URL in response.');
  }
  return glbUrl;
}

/**
 * API Route Handler: The main entry point for all 3D generation.
 */
export async function POST(request: Request) {
  try {
    const { prompt, imageUrl: initialImage } = await request.json();
    let imageUrl = initialImage; // Allow imageUrl to be reassigned

    if (!prompt && !imageUrl) {
      return NextResponse.json({ error: 'A text prompt or an image URL is required.' }, { status: 400 });
    }

    // --- Main Pipeline ---

    // 1. Generate image if not provided (using Azure DALL-E)
    if (!imageUrl) {
      console.log(`Generating image for prompt: "${prompt}"`);
      imageUrl = await generateImageWithAzureDalle(prompt);
    } else {
      console.log(`Using provided image URL: ${imageUrl}`);
    }

    // 2. Convert the image (either provided or newly generated) to a 3D model
    console.log('Converting image to 3D model...');
    const modelUrl = await convertImageTo3D(imageUrl);

    console.log(`Successfully generated 3D model: ${modelUrl}`);
    return NextResponse.json({ modelUrl });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('3D Generation Pipeline Error:', errorMessage);
    return NextResponse.json({ error: 'Failed to generate 3D model', details: errorMessage }, { status: 500 });
  }
}