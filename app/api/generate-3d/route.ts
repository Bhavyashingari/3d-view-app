import { NextResponse } from 'next/server';
import { AzureOpenAI } from "openai";
import { client as gradioClient } from "@gradio/client";

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
    apiVersion: "2024-05-01-preview",
  });
  
  const response = await client.images.generate({
    model: dalleDeploymentName,
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

  try {
    const imageBlob = await fetch(imageUrl).then(r => r.blob());

    const app = await gradioClient("stabilityai/stable-fast-3d", {
      token: huggingFaceToken as `hf_${string}`
    });

    const result = await app.predict("/run_button", {
      input_image: imageBlob,
      foreground_ratio: 0.85,
      remesh_option: "None",
      vertex_count: -1,
      texture_size: 1024,
    });

    // The result object has a complex structure, we need to find the model URL.
    if (result.data && Array.isArray(result.data) && result.data.length > 1) {
      const modelData = result.data[1];
      // The model URL is sometimes in `path`, sometimes in `url`. Check both.
      const modelUrl = modelData?.path || modelData?.url;
      if (modelUrl) {
        return modelUrl;
      }
    }

    // If we reach here, the model URL was not found. Log the full response for debugging.
    console.error("Gradio response did not contain model URL. Full response:", JSON.stringify(result, null, 2));
    throw new Error('Image-to-3D conversion failed: Could not find model URL in the API response.');

  } catch (error) {
    console.error("Gradio Client Error:", error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Image-to-3D conversion failed: ${errorMessage}`);
  }
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