
import axios from 'axios';

export interface GenerateOptions {
  prompt: string;
  imageUrl?: string;
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Generate 3D model using FREE APIs
 * Tries in order: Stable Fast 3D → Hunyuan3D → Replicate → Procedural
 */
export async function generate3DModel(options: GenerateOptions): Promise<string> {
  const { prompt, imageUrl, onProgress } = options;
  
  // Try Stable Fast 3D first (FREE, best quality)
  try {
    onProgress?.(10, 'Trying Stable Fast 3D (Stability AI)...');
    const url = await generateWithStableFast3D(prompt, imageUrl, onProgress);
    if (url) {
      onProgress?.(100, 'Model generated successfully!');
      return url;
    }
  } catch (e) {
    console.warn('Stable Fast 3D failed:', e);
  }
  
  // Try Hunyuan3D (FREE, Tencent)
  try {
    onProgress?.(10, 'Trying Hunyuan3D (Tencent)...');
    const url = await generateWithHunyuan3D(prompt, imageUrl, onProgress);
    if (url) {
      onProgress?.(100, 'Model generated successfully!');
      return url;
    }
  } catch (e) {
    console.warn('Hunyuan3D failed:', e);
  }
  
  // Try Replicate Shap-E (50 free/month)
  if (process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN) {
    try {
      onProgress?.(10, 'Trying Replicate Shap-E...');
      const url = await generateWithReplicate(prompt, onProgress);
      if (url) {
        onProgress?.(100, 'Model generated successfully!');
        return url;
      }
    } catch (e) {
      console.warn('Replicate failed:', e);
    }
  }
  
  // Fallback: Procedural generation
  onProgress?.(100, 'Using procedural generation...');
  return generateProceduralModel(prompt);
}

/**
 * Stable Fast 3D (Stability AI) - FREE via Hugging Face
 * https://huggingface.co/spaces/stabilityai/stable-fast-3d
 */
async function generateWithStableFast3D(
  prompt: string,
  imageUrl?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<string> {
  const token = process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN;
  if (!token) throw new Error('Hugging Face token not configured');
  
  // If no image, generate one first
  if (!imageUrl) {
    onProgress?.(20, 'Generating image with Stable Diffusion...');
    
    const imageResponse = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        inputs: `${prompt}, 3D render, white background, product photography, high quality`,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );
    
    // Convert to blob URL
    const blob = new Blob([imageResponse.data], { type: 'image/png' });
    imageUrl = URL.createObjectURL(blob);
  }
  
  onProgress?.(50, 'Converting image to 3D model...');
  
  // Convert image to 3D
  const formData = new FormData();
  const imageBlob = await fetch(imageUrl).then(r => r.blob());
  formData.append('image', imageBlob, 'input.png');
  formData.append('foreground_ratio', '0.85');
  formData.append('texture_resolution', '1024');
  
  const response = await axios.post(
    'https://hf.space/embed/stabilityai/stable-fast-3d/api/predict',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: 120000, // 2 minutes
    }
  );
  
  onProgress?.(90, 'Processing 3D model...');
  
  // Extract GLB URL from response
  const glbUrl = response.data.data?.[0]?.url || response.data.data?.[0];
  if (!glbUrl) throw new Error('No model URL in response');
  
  return glbUrl;
}

/**
 * Hunyuan3D (Tencent) - FREE via Hugging Face
 * https://huggingface.co/spaces/Tencent/Hunyuan3D-1
 */
async function generateWithHunyuan3D(
  prompt: string,
  imageUrl?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<string> {
  const token = process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN;
  if (!token) throw new Error('Hugging Face token not configured');
  
  // Hunyuan3D works best with images
  if (!imageUrl) {
    onProgress?.(20, 'Generating image for 3D conversion...');
    
    const imageResponse = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        inputs: `${prompt}, 3D render, centered, white background`,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'arraybuffer',
      }
    );
    
    const blob = new Blob([imageResponse.data], { type: 'image/png' });
    imageUrl = URL.createObjectURL(blob);
  }
  
  onProgress?.(50, 'Converting to 3D with Hunyuan3D...');
  
  // Convert to 3D
  const formData = new FormData();
  const imageBlob = await fetch(imageUrl).then(r => r.blob());
  formData.append('input_image', imageBlob);
  
  const response = await axios.post(
    'https://hf.space/embed/Tencent/Hunyuan3D-1/api/predict',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: 150000, // 2.5 minutes
    }
  );
  
  onProgress?.(90, 'Finalizing model...');
  
  const glbUrl = response.data.data?.[0];
  if (!glbUrl) throw new Error('No model URL in response');
  
  return glbUrl;
}

/**
 * Replicate Shap-E - 50 FREE/month
 * https://replicate.com/openai/shap-e
 */
async function generateWithReplicate(
  prompt: string,
  onProgress?: (progress: number, message: string) => void
): Promise<string> {
  const token = process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN;
  if (!token) throw new Error('Replicate token not configured');
  
  onProgress?.(20, 'Creating prediction...');
  
  const response = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'cccb3f7308c0a2b6e8c6f4e3e3e3e3e3e3e3e3e3',
      input: {
        prompt: prompt,
        guidance_scale: 15.0,
        num_inference_steps: 64,
      },
    },
    {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const predictionId = response.data.id;
  onProgress?.(30, 'Generating 3D model...');
  
  // Poll for completion
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusResponse = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Token ${token}`,
        },
      }
    );
    
    const result = statusResponse.data;
    const progress = 30 + (i / 60) * 60;
    onProgress?.(progress, 'Generating...');
    
    if (result.status === 'succeeded') {
      return result.output;
    } else if (result.status === 'failed') {
      throw new Error('Generation failed');
    }
  }
  
  throw new Error('Generation timeout');
}

/**
 * Procedural fallback - Always works
 * Generates basic shapes based on keywords
 */
function generateProceduralModel(prompt: string): string {
  const lower = prompt.toLowerCase();
  
  // Map keywords to basic shapes
  if (lower.includes('cube') || lower.includes('box')) {
    return '/models/fallback/cube.glb';
  } else if (lower.includes('sphere') || lower.includes('ball') || lower.includes('globe')) {
    return '/models/fallback/sphere.glb';
  } else if (lower.includes('cylinder') || lower.includes('tube') || lower.includes('can')) {
    return '/models/fallback/cylinder.glb';
  } else if (lower.includes('cone') || lower.includes('pyramid')) {
    return '/models/fallback/cone.glb';
  } else if (lower.includes('torus') || lower.includes('donut') || lower.includes('ring')) {
    return '/models/fallback/torus.glb';
  }
  
  // Default: cube
  return '/models/fallback/cube.glb';
}
