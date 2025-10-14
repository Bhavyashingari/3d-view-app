import { NextResponse } from 'next/server';
import { AzureOpenAI } from "openai";

// Ensure you have these environment variables set in your Vercel project
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const azureApiKey = process.env.AZURE_OPENAI_API_KEY!;
const dalleDeploymentName = process.env.AZURE_OPENAI_DALLE_DEPLOYMENT_NAME!;
const tripoApiKey = process.env.TRIPO_API_KEY!;

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
 * Converts an image to a 3D model using the Tripo3D API.
 */
async function convertImageTo3D(imageUrl: string): Promise<string> {
  if (!tripoApiKey) {
    throw new Error("Tripo3D API key is not configured.");
  }

  try {
    // 1. Fetch the image and prepare it for upload
    const imageBlob = await fetch(imageUrl).then(r => r.blob());
    const formData = new FormData();
    formData.append('file', imageBlob, 'input.png');

    // 2. Upload the image to Tripo3D to get an image ID
    const uploadResponse = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tripoApiKey}` },
      body: formData,
    });
    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(`Tripo3D image upload failed: ${JSON.stringify(uploadData)}`);
    }
    const imageId = uploadData.data.id;

    // 3. Start the image-to-model conversion task
    const taskResponse = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tripoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_id: imageId, type: 'image_to_model' }),
    });
    const taskData = await taskResponse.json();
    if (!taskResponse.ok) {
      throw new Error(`Tripo3D task creation failed: ${JSON.stringify(taskData)}`);
    }
    const taskId = taskData.data.task_id;

    // 4. Poll for the result
    let finalResult;
    for (let i = 0; i < 60; i++) { // Poll for 5 minutes max (60 * 5s)
      await new Promise(resolve => setTimeout(resolve, 5000));
      const pollResponse = await fetch(`https://api.tripo3d.ai/v2/openapi/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${tripoApiKey}` },
      });
      const pollData = await pollResponse.json();

      if (pollData.data.status === 'success') {
        finalResult = pollData.data;
        break;
      } else if (pollData.data.status === 'failed') {
        throw new Error(`Tripo3D task failed: ${JSON.stringify(pollData.data.error)}`);
      }
      // Otherwise, status is 'processing', so we continue polling
    }

    if (!finalResult) {
      throw new Error('Tripo3D task timed out after 5 minutes.');
    }

    // 5. Return the model URL
    const modelUrl = finalResult.output?.model;
    if (!modelUrl) {
      throw new Error('Tripo3D response did not contain a model URL.');
    }

    return modelUrl;

  } catch (error) {
    console.error("Tripo3D API Error:", error);
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