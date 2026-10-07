/**
 * AI Room Image Generator Service
 * Uses Gemini gemini-3.1-flash-image model to generate unique, photorealistic
 * bedroom images with washroom, TV, and side-view for each new room.
 *
 * Each call generates 4 different views:
 *  1. Main bedroom hero shot
 *  2. Bathroom / washroom view
 *  3. TV entertainment corner
 *  4. Side / desk / wardrobe view
 *
 * Images are returned as base64 data-URIs and cached in localStorage
 * so they persist across page reloads.
 */

import { GoogleGenAI } from '@google/genai';

// ── Read API key from Vite env or browser localStorage ─────────────────────
export function getGeminiApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (envKey && envKey.trim() !== '') return envKey.trim();
  try {
    const localKey = localStorage.getItem('slp_gemini_api_key') || '';
    if (localKey && localKey.trim() !== '') return localKey.trim();
  } catch {
    // ignore
  }
  return '';
}

/** Returns true if an API key is configured */
export function isGeminiConfigured() {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 0);
}


// ── Cache helpers ──────────────────────────────────────────────────────────
const CACHE_PREFIX = 'slp_room_imgs_';

function loadFromCache(roomKey) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + roomKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToCache(roomKey, images) {
  try {
    localStorage.setItem(CACHE_PREFIX + roomKey, JSON.stringify(images));
  } catch {
    // Ignore storage errors (quota)
  }
}

// ── Prompt builder ─────────────────────────────────────────────────────────
/**
 * Builds a detailed, varied prompt per view so images differ meaningfully.
 *
 * @param {object} room - Room data (roomType, baseRent, description, roomNumber)
 * @param {string} viewType - 'hero' | 'bathroom' | 'tv' | 'side'
 * @param {number} seed - Random seed phrase index to ensure uniqueness
 */
function buildPrompt(room, viewType, seed = 0) {
  const roomTypeName = {
    SINGLE: 'single-occupancy premium bedroom',
    DOUBLE: 'double-sharing bedroom with two beds',
    TRIPLE: 'triple-sharing bedroom with three beds',
    FOUR_SHARING: 'four-bed shared hostel room',
    DORMITORY: 'dormitory room with six bunk beds',
  }[room.roomType] || 'modern hostel bedroom';

  const priceClass = room.baseRent >= 12000 ? 'luxury' : room.baseRent >= 8000 ? 'premium' : 'comfortable';

  const styleVariants = [
    'warm Scandinavian minimalist style with wooden tones',
    'contemporary urban hotel aesthetic with dark charcoal walls',
    'bright airy coastal style with white walls and natural light',
    'sophisticated boutique hotel look with rich navy and gold accents',
    'modern Japanese wabi-sabi style with neutral beiges and bamboo',
    'vibrant Gen-Z dorm style with pastel accent walls and fairy lights',
    'industrial-chic loft style with exposed brick and metal fixtures',
    'plush resort-style with marble flooring and velvet soft furnishings',
  ];

  const style = styleVariants[seed % styleVariants.length];

  const promptsByView = {
    hero: `Professional interior photography of a ${priceClass} ${roomTypeName} in an Indian PG/hostel property called "Greenwood Living". Room #${room.roomNumber}. ${style}. Show the full room: beds neatly made with fresh linen and plump pillows, study desk with laptop and lamp, wardrobe with mirror, air conditioner on wall, large window with diffused daylight, polished floor. Ultra-realistic DSLR photo quality, 4K detail. No people. Photorealistic.`,
    bathroom: `Professional interior photo of the attached private bathroom belonging to Room #${room.roomNumber} in a ${priceClass} Indian student residence. ${style}. Show: wall-mounted geyser, modern rainfall shower with glass partition, pedestal washbasin with mirror cabinet and LED vanity lights above, western toilet with toilet roll holder, clean white tiles, neatly folded towels, liquid soap dispenser. Bright, clean, hygienic. 4K ultra-realistic hotel-style photography.`,
    tv: `Interior photograph of the TV entertainment corner inside Room #${room.roomNumber} of a ${priceClass} ${roomTypeName} at an Indian PG hostel. ${style}. A large 43-inch smart flat-screen LED TV wall-mounted, showing a streaming service home screen. Below: a neat wooden media console with a remote control and a small decorative plant. Comfortable reading chair or bean bag nearby. Warm LED strip backlighting behind the TV. Evening ambient mood. Photorealistic 4K quality.`,
    side: `Side-angle interior architectural photo of Room #${room.roomNumber}, a ${priceClass} ${roomTypeName}. ${style}. Show: full-height sliding wardrobe with mirror panels, a neat study desk setup with an ergonomic chair, bookshelf with textbooks and a succulent plant, power outlet strip, ceiling fan with LED light, and the door with a digital keypad lock. 4K, sharp detail, no people, professional real estate photography.`,
  };

  return promptsByView[viewType] || promptsByView.hero;
}

// ── Main generator ─────────────────────────────────────────────────────────
/**
 * Generates 4 AI room photos for a newly created room.
 * Returns array of { viewType, dataUri, label } objects.
 *
 * @param {object} room - Room object from API (roomNumber, roomType, baseRent, description)
 * @param {function} onProgress - callback(step: 1..4) called as each image completes
 */
export async function generateRoomImages(room, onProgress) {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY not configured. Add VITE_GEMINI_API_KEY to frontend/.env');
  }

  // Cache key — unique per room number + type + rent
  const cacheKey = `${room.roomNumber}_${room.roomType}_${room.baseRent}`;
  const cached = loadFromCache(cacheKey);
  if (cached) return cached;

  const apiKey = getGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const views = [
    { viewType: 'hero', label: '🛏️ Bedroom View' },
    { viewType: 'bathroom', label: '🚿 Bathroom / Washroom' },
    { viewType: 'tv', label: '📺 TV & Entertainment Corner' },
    { viewType: 'side', label: '🪟 Wardrobe & Study Corner' },
  ];

  // Random seed to ensure different style each time
  const seed = Math.floor(Math.random() * 8);
  const results = [];

  for (let i = 0; i < views.length; i++) {
    const { viewType, label } = views[i];
    const prompt = buildPrompt(room, viewType, seed);

    try {
      const interaction = await ai.interactions.create({
        model: 'gemini-3.1-flash-image',
        input: prompt,
      });

      const generatedImage = interaction.output_image;
      if (generatedImage && generatedImage.data) {
        results.push({
          viewType,
          label,
          dataUri: `data:image/png;base64,${generatedImage.data}`,
          prompt, // store for debugging
        });
      } else {
        // If AI returns no image, push a placeholder
        results.push({ viewType, label, dataUri: null });
      }
    } catch (err) {
      console.warn(`Failed to generate ${viewType} image:`, err);
      results.push({ viewType, label, dataUri: null, error: err.message });
    }

    if (onProgress) onProgress(i + 1);
  }

  saveToCache(cacheKey, results);
  return results;
}

/**
 * Clears cached images for a specific room (useful if you want to regenerate)
 */
export function clearRoomImageCache(room) {
  const cacheKey = `${room.roomNumber}_${room.roomType}_${room.baseRent}`;
  localStorage.removeItem(CACHE_PREFIX + cacheKey);
}
