import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const imageEditingModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-2.5-flash';

const extractImageFromResponse = (response: GenerateContentResponse): string | null => {
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        return imagePart.inlineData.data;
    }
    return null;
};


export const enhanceAndCleanImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const prompt = 'Enhance the quality of this image, remove all imperfections and blemishes, and make the background transparent. Keep only the main product, perfectly isolated. The output must be a PNG with a transparent background. Do not change the product itself.';
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    
    const response = await ai.models.generateContent({
        model: imageEditingModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const imageData = extractImageFromResponse(response);
    if (!imageData) {
        throw new Error("Failed to enhance image. The model did not return an image.");
    }
    return imageData;
};

export const createCgiAd = async (cleanedProductB64: string, mimeType: string, sceneDescription: string, aspectRatio: string): Promise<string> => {
    const prompt = `Using the provided product image (which has a transparent background), create a stunning, photorealistic CGI advertisement. Place the product in the following scene: "${sceneDescription}". The final image should be high-impact with professional, dramatic lighting and shadows that match the scene. The final image must have an aspect ratio of ${aspectRatio}.`;
    const imagePart = { inlineData: { data: cleanedProductB64, mimeType } };
    
    const response = await ai.models.generateContent({
        model: imageEditingModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const imageData = extractImageFromResponse(response);
    if (!imageData) {
        throw new Error("Failed to create CGI ad. The model did not return an image.");
    }
    return imageData;
};

export const generateVideoPrompt = async (adImageB64: string, mimeType: string, sceneDescription: string): Promise<string> => {
    const prompt = `You are a professional film director and sound designer. Based on the provided CGI ad image and the original concept ("${sceneDescription}"), create a comprehensive text-to-video prompt for a 3-5 second, high-impact animation. The prompt must be a single, detailed paragraph that includes three key elements: **Visuals:** Describe a dynamic camera movement (e.g., a slow, dramatic dolly zoom; a sweeping drone shot). Detail any visual effects (VFX) like atmospheric particles, lens flares, or light interactions. **Action:** Briefly describe what happens in the scene. **Sound Design:** Describe the complete audio experience. Include ambient environmental sounds (e.g., 'the faint hum of city traffic,' 'gentle waves crashing on a shore'), specific sound effects (SFX) that sync with the product's action (e.g., 'a deep, resonant metallic clang,' 'a satisfying, crisp liquid splash'), and a suggestion for the musical score (e.g., 'an epic, swelling orchestral track,' 'a modern, minimalist and cool synth beat').`;
    const imagePart = { inlineData: { data: adImageB64, mimeType } };
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text;
};

export const generateRandomScene = async (productImageB64: string, mimeType: string): Promise<string> => {
    const prompt = `You are an award-winning creative director, famous for creating viral "Faux Out of Home" CGI ads. Your goal is to generate a single, breathtaking, and hyper-realistic scene for the provided product. First, analyze the provided product image to understand its category (e.g., cosmetics, beverage, apparel, technology) and target audience. Then, generate a concept that is thematically relevant and visually stunning. The concept must be cinematic and dynamic, placing a gigantic version of the product into a real-world location in a surreal and awe-inspiring way. For example, if it's a makeup product, think of scenes involving beautiful natural elements like flowers, waterfalls colored by the product, or elegant architecture. If it's a beverage, think of refreshing scenes like pouring into a landmark or creating a splash in a cityscape. The output must be a single, compelling paragraph ready for a CGI artist.`;
    const imagePart = { inlineData: { data: productImageB64, mimeType } };

    const response = await ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text;
};