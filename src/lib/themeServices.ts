import type { SalonData } from '../types';

/** Theme = the salon website template chosen in Step 2 (Hair / Barber / Wellness). */
export type ThemeId = NonNullable<SalonData['templateId']>;

export const THEME_LABELS: Record<ThemeId, string> = {
  hair: 'Hair & Unisex Salon',
  barber: "Men's Barber & Grooming",
  wellness: 'Beauty & Wellness Spa',
};

export interface PredefinedService {
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number; // minutes
}

/**
 * Categories surfaced in the Add-Service dropdown, per theme.
 * Switching theme swaps the whole category set so the data stays relevant
 * to the type of salon the owner actually runs.
 */
export const THEME_CATEGORIES: Record<ThemeId, string[]> = {
  hair: ['Haircut', 'Styling', 'Color', 'Treatment', 'Makeup & Beauty'],
  barber: ['Haircut', 'Beard & Shave', 'Grooming', 'Treatment'],
  wellness: ['Massage', 'Facials', 'Nails', 'Hair Removal', 'Spa Packages'],
};

/**
 * The full, professionally-curated service catalogue for each theme.
 * Every entry is genuinely different per theme — there is no shared/generic
 * list repeated across themes. Categories map cleanly so the Add-Service
 * dropdown can show only the services that belong to the chosen category.
 */
export const SERVICES_BY_THEME: Record<ThemeId, PredefinedService[]> = {
  hair: [
    // Haircut
    { name: "Women's Haircut & Blow-Dry", category: 'Haircut', description: 'Precision cut tailored to your face shape, finished with a professional wash and blow-dry.', price: 450, duration: 45 },
    { name: "Men's Haircut", category: 'Haircut', description: 'Classic or contemporary men’s cut with expert scissor and clipper work.', price: 350, duration: 30 },
    { name: 'Kids Haircut (12 & under)', category: 'Haircut', description: 'Gentle, friendly haircut for children in a comfortable setting.', price: 250, duration: 30 },
    { name: 'Layer Cut & Texturising', category: 'Haircut', description: 'Customised layers and texturising for movement, volume and shape.', price: 550, duration: 50 },
    { name: 'Haircut with Wash & Style', category: 'Haircut', description: 'Relaxing shampoo, precision cut and styled blow-dry finish.', price: 500, duration: 50 },

    // Styling
    { name: 'Blow-Dry & Styling', category: 'Styling', description: 'Salon-perfect blow-dry with volume, smooth or curly finish.', price: 350, duration: 30 },
    { name: 'Hair Straightening (Rebonding)', category: 'Styling', description: 'Long-lasting permanent straightening for sleek, frizz-free hair.', price: 2500, duration: 120 },
    { name: 'Party & Event Hairstyling', category: 'Styling', description: 'Updos, curls and glam styles for parties, functions and shoots.', price: 1200, duration: 60 },
    { name: 'Curling & Waves', category: 'Styling', description: 'Soft beach waves or defined curls styled to suit the occasion.', price: 600, duration: 45 },
    { name: 'Hair Crimping & Styling', category: 'Styling', description: 'Trendy crimped texture and finishing for a bold statement look.', price: 500, duration: 40 },

    // Color
    { name: 'Root Touch-Up', category: 'Color', description: 'Seamless grey coverage and root refresh with ammonia-free colour.', price: 900, duration: 60 },
    { name: 'Global Hair Colour', category: 'Color', description: 'Full-head colour transformation in rich, even, long-lasting tones.', price: 2200, duration: 120 },
    { name: 'Balayage Highlights', category: 'Color', description: 'Hand-painted freeform highlights for natural, sun-kissed dimension.', price: 3500, duration: 150 },
    { name: 'Ombre Colour', category: 'Color', description: 'Soft shadow-root to tip gradient for a modern, low-maintenance look.', price: 3000, duration: 150 },
    { name: 'Hair Gloss & Toner', category: 'Color', description: 'Demi-permanent gloss to boost shine, tone and colour vibrancy.', price: 800, duration: 45 },

    // Treatment
    { name: 'Hair Spa (Deep Conditioning)', category: 'Treatment', description: 'Deep-nourishing spa with scalp massage to restore moisture and shine.', price: 1000, duration: 60 },
    { name: 'Keratin Smoothing Treatment', category: 'Treatment', description: 'Frizz-eliminating keratin therapy for silky, manageable hair.', price: 4500, duration: 150 },
    { name: 'Botox Hair Treatment', category: 'Treatment', description: 'Reconstructive filler treatment that revives damaged, brittle hair.', price: 3800, duration: 120 },
    { name: 'Scalp Detox Treatment', category: 'Treatment', description: 'Exfoliating botanical scalp detox for a healthy, balanced root.', price: 1200, duration: 45 },
    { name: 'Protein Hair Treatment', category: 'Treatment', description: 'Strengthening protein boost to reduce breakage and add body.', price: 1500, duration: 60 },

    // Makeup & Beauty
    { name: 'Party Makeup', category: 'Makeup & Beauty', description: 'Camera-ready makeup for parties, dinners and celebrations.', price: 2500, duration: 90 },
    { name: 'Bridal Makeup (HD)', category: 'Makeup & Beauty', description: 'Flawless HD bridal look with skin prep, lashes and draping.', price: 8000, duration: 180 },
    { name: 'Engagement Makeup', category: 'Makeup & Beauty', description: 'Elegant makeup for pre-wedding functions and engagements.', price: 4500, duration: 120 },
    { name: 'Eyebrow Threading & Shaping', category: 'Makeup & Beauty', description: 'Precise threading to define and shape your brows.', price: 150, duration: 15 },
    { name: 'Arms & Underarms Waxing', category: 'Makeup & Beauty', description: 'Smooth, hygienic waxing for arms and underarms with soothing aftercare.', price: 500, duration: 40 },
  ],

  barber: [
    // Haircut
    { name: "Classic Men's Haircut", category: 'Haircut', description: 'Timeless scissor-and-clipper cut finished with a neat neck shave.', price: 300, duration: 30 },
    { name: 'Skin Fade', category: 'Haircut', description: 'Sharp, seamless skin fade blended to your preferred length on top.', price: 450, duration: 45 },
    { name: 'Buzz Cut', category: 'Haircut', description: 'Clean, uniform buzz cut for a low-maintenance sharp look.', price: 250, duration: 20 },
    { name: 'Textured Crop', category: 'Haircut', description: 'Modern textured crop with fringe and effortless matte finish.', price: 400, duration: 40 },
    { name: 'Kids Haircut', category: 'Haircut', description: 'Friendly boys’ haircut with clippers, scissors and a hot towel.', price: 200, duration: 25 },

    // Beard & Shave
    { name: 'Beard Trim & Shape', category: 'Beard & Shave', description: 'Precision beard trimming and shaping to define your jawline.', price: 200, duration: 20 },
    { name: 'Hot Towel Shave', category: 'Beard & Shave', description: 'Classic straight-razor hot-towel shave for a baby-smooth finish.', price: 350, duration: 30 },
    { name: 'Beard Sculpting', category: 'Beard & Shave', description: 'Detailed beard sculpting, lining and styling with beard oil.', price: 300, duration: 30 },
    { name: 'Head Shave', category: 'Beard & Shave', description: 'Smooth, polished head shave with hot towel and moisturiser.', price: 250, duration: 25 },
    { name: 'Beard Colour', category: 'Beard & Shave', description: 'Natural-looking beard colour to cover greys and add depth.', price: 400, duration: 30 },

    // Grooming
    { name: 'Haircut + Beard Combo', category: 'Grooming', description: 'Complete grooming: haircut plus beard trim in one sitting.', price: 550, duration: 55 },
    { name: "Men's Facial", category: 'Grooming', description: 'Deep-cleansing facial to refresh, exfoliate and hydrate skin.', price: 700, duration: 45 },
    { name: 'Eyebrow Trimming', category: 'Grooming', description: 'Neat eyebrow grooming and shaping for a sharp look.', price: 100, duration: 10 },
    { name: 'Ear & Nose Waxing', category: 'Grooming', description: 'Quick, hygienic waxing of ears and nose for a clean finish.', price: 150, duration: 15 },
    { name: 'Haircut + Facial Combo', category: 'Grooming', description: 'Haircut paired with a reviving men’s facial.', price: 950, duration: 80 },

    // Treatment
    { name: 'Scalp Massage', category: 'Treatment', description: 'Relaxing therapeutic scalp massage to relieve tension and boost circulation.', price: 500, duration: 30 },
    { name: 'Anti-Dandruff Treatment', category: 'Treatment', description: 'Targeted scalp treatment to control flakes and soothe irritation.', price: 800, duration: 45 },
    { name: "Men's Hair Spa", category: 'Treatment', description: 'Deep-conditioning hair spa to strengthen and refresh men’s hair.', price: 900, duration: 50 },
  ],

  wellness: [
    // Massage
    { name: 'Swedish Relaxation Massage', category: 'Massage', description: 'Gentle, flowing massage to ease tension and promote calm.', price: 1800, duration: 60 },
    { name: 'Deep Tissue Massage', category: 'Massage', description: 'Firm pressure massage targeting knots and chronic muscle tightness.', price: 2400, duration: 60 },
    { name: 'Aroma Oil Massage', category: 'Massage', description: 'Soothing essential-oil massage for balance, mood and skin.', price: 2000, duration: 60 },
    { name: 'Head & Shoulder Massage', category: 'Massage', description: 'Focused massage to release neck, shoulder and scalp tension.', price: 900, duration: 30 },
    { name: 'Foot Reflexology', category: 'Massage', description: 'Pressure-point therapy on the feet to restore overall wellbeing.', price: 1000, duration: 45 },
    { name: 'Prenatal Massage', category: 'Massage', description: 'Gentle, side-lying massage tailored for expecting mothers.', price: 2200, duration: 60 },

    // Facials
    { name: 'Hydra Facial', category: 'Facials', description: 'Hydrating, deep-cleansing facial for instant glow and plump skin.', price: 2500, duration: 60 },
    { name: 'Anti-Ageing Gold Facial', category: 'Facials', description: 'Luxurious gold facial to firm, brighten and reduce fine lines.', price: 1800, duration: 60 },
    { name: 'Acne Clear Facial', category: 'Facials', description: 'Clarifying facial to calm breakouts and decongest pores.', price: 1500, duration: 45 },
    { name: 'Brightening Facial', category: 'Facials', description: 'Vitamin-rich facial to even tone and revive dull skin.', price: 1400, duration: 45 },
    { name: 'Oxygen Facial', category: 'Facials', description: 'Oxygen-infusion facial for a refreshed, radiant complexion.', price: 2200, duration: 60 },

    // Nails
    { name: 'Classic Manicure', category: 'Nails', description: 'Nail shaping, cuticle care and polished finish for hands.', price: 600, duration: 45 },
    { name: 'Gel Manicure', category: 'Nails', description: 'Long-lasting gel polish with glossy, chip-free shine.', price: 1200, duration: 60 },
    { name: 'Classic Pedicure', category: 'Nails', description: 'Relaxing foot soak, exfoliation and polished toenails.', price: 800, duration: 60 },
    { name: 'Gel Pedicure', category: 'Nails', description: 'Durable gel pedicure with soothing foot massage.', price: 1500, duration: 75 },
    { name: 'Nail Art (per hand)', category: 'Nails', description: 'Custom hand-painted nail art to express your style.', price: 500, duration: 30 },
    { name: 'French Manicure', category: 'Nails', description: 'Timeless French tip manicure for an elegant finish.', price: 900, duration: 50 },

    // Hair Removal
    { name: 'Full Arms Waxing', category: 'Hair Removal', description: 'Hygienic full-arm waxing with calming aftercare.', price: 500, duration: 30 },
    { name: 'Full Legs Waxing', category: 'Hair Removal', description: 'Smooth full-leg waxing for long-lasting softness.', price: 800, duration: 45 },
    { name: 'Underarm Waxing', category: 'Hair Removal', description: 'Quick, clean underarm waxing for up to 4 weeks of smoothness.', price: 300, duration: 15 },
    { name: 'Brazilian Waxing', category: 'Hair Removal', description: 'Gentle, professional intimate waxing in a private setting.', price: 1200, duration: 45 },
    { name: 'Face Threading', category: 'Hair Removal', description: 'Precise facial threading for brows, upper lip and chin.', price: 250, duration: 20 },

    // Spa Packages
    { name: 'Detox Day Spa Package', category: 'Spa Packages', description: 'Massage, facial and foot reflexology for a full reset.', price: 4500, duration: 150 },
    { name: 'Bridal Glow Package', category: 'Spa Packages', description: 'Pre-bridal facials, body polish and makeup for radiant skin.', price: 9000, duration: 240 },
    { name: 'Couple Spa Retreat', category: 'Spa Packages', description: 'Side-by-side massage and spa rituals for two.', price: 6000, duration: 150 },
    { name: 'Quick Refresh Package', category: 'Spa Packages', description: 'Express facial and head massage for a midday pick-me-up.', price: 2500, duration: 90 },
  ],
};

/**
 * Curated "Suggested Services" shown at the top of the step, per theme.
 * A hand-picked, theme-appropriate starter set so owners can one-click add
 * the most relevant services for their salon type.
 */
export const SUGGESTED_SERVICE_NAMES: Record<ThemeId, string[]> = {
  hair: [
    "Women's Haircut & Blow-Dry",
    'Global Hair Colour',
    'Balayage Highlights',
    'Keratin Smoothing Treatment',
    'Hair Spa (Deep Conditioning)',
    'Bridal Makeup (HD)',
    'Party & Event Hairstyling',
  ],
  barber: [
    "Classic Men's Haircut",
    'Skin Fade',
    'Beard Trim & Shape',
    'Hot Towel Shave',
    'Haircut + Beard Combo',
    "Men's Hair Spa",
    'Scalp Massage',
  ],
  wellness: [
    'Swedish Relaxation Massage',
    'Hydra Facial',
    'Classic Manicure',
    'Full Legs Waxing',
    'Detox Day Spa Package',
    'Head & Shoulder Massage',
    'Aroma Oil Massage',
  ],
};

/** Returns the curated suggested services for a theme (resolved from the catalogue). */
export function getSuggestedServices(theme: ThemeId): PredefinedService[] {
  const all = SERVICES_BY_THEME[theme] || [];
  return (SUGGESTED_SERVICE_NAMES[theme] || [])
    .map((name) => all.find((s) => s.name === name))
    .filter((s): s is PredefinedService => Boolean(s));
}

/** All predefined services that belong to a given theme + category. */
export function getServicesForThemeCategory(theme: ThemeId, category: string): PredefinedService[] {
  return (SERVICES_BY_THEME[theme] || []).filter((s) => s.category === category);
}

/** Case-insensitive lookup of a predefined service by name within a theme. */
export function findPredefinedService(theme: ThemeId, name: string): PredefinedService | undefined {
  const q = name.trim().toLowerCase();
  return (SERVICES_BY_THEME[theme] || []).find((s) => s.name.toLowerCase() === q);
}

/** Theme-aware "Suggest with AI" starter services. */
export const AI_SUGGESTION_NAMES: Record<ThemeId, [string, string]> = {
  hair: ['Keratin Smoothing Treatment', 'Balayage Highlights'],
  barber: ['Skin Fade', 'Hot Towel Shave'],
  wellness: ['Hydra Facial', 'Swedish Relaxation Massage'],
};

/** Theme-aware spoken-input example service. */
export const VOICE_SERVICE_BY_THEME: Record<ThemeId, PredefinedService> = {
  hair: { name: 'Signature Blow-Out & Style', category: 'Styling', description: 'Salon blow-out with volume and long-lasting hold.', price: 500, duration: 45 },
  barber: { name: "Gentlemen's Royal Cut", category: 'Haircut', description: 'Custom cut with scalp massage and hot towel finish.', price: 450, duration: 40 },
  wellness: { name: 'Aroma Relaxation Massage', category: 'Massage', description: 'Soothing essential-oil full-body massage.', price: 2000, duration: 60 },
};
