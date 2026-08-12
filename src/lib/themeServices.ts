import type { SalonData } from '../types';

/** Theme = the salon website template chosen in Step 2 (Hair / Barber / Hair Studio / Wellness / Family). */
export type ThemeId = NonNullable<SalonData['templateId']>;

/** All currently selectable themes, in display order. */
export const THEME_IDS: ThemeId[] = [
  'hair',
  'barber_mens_grooming',
  'hair-studio',
  'wellness',
  'family-salon',
];

/**
 * Normalises a saved `templateId` into a valid ThemeId.
 *
 * `barber` is the legacy id for the Barber & Men's Grooming slot; it has been
 * superseded by `barber_mens_grooming`. Old drafts saved as `barber` are mapped
 * forward so nothing breaks, while new data is always written with the canonical id.
 */
export function normalizeThemeId(id: string | undefined | null): ThemeId {
  if (id === 'barber') return 'barber_mens_grooming';
  if (id && (THEME_IDS as string[]).includes(id)) return id as ThemeId;
  return 'hair';
}

export const THEME_LABELS: Record<ThemeId, string> = {
  hair: 'Hair & Unisex Salon',
  barber_mens_grooming: "Barber & Men's Grooming",
  'hair-studio': 'Hair Studio & Color Bar',
  wellness: 'Beauty, Skin & Spa',
  'family-salon': 'Full-Service Family Salon',
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
  barber_mens_grooming: ['Haircuts', 'Beard & Shave', 'Grooming & Treatments'],
  'hair-studio': ['Cut & Style', 'Color & Highlights', 'Texture & Perms', 'Treatments', 'Bridal & Events'],
  wellness: ['Massage', 'Facials', 'Nails', 'Hair Removal', 'Spa Packages'],
  'family-salon': ['Hair', 'Beauty', 'Skin', 'Grooming', 'Spa', 'Kids'],
};

/**
 * Shared design tokens for the Barber & Men's Grooming theme.
 * Used by both TemplateRenderer (BarberTemplateRenderer) and PreviewPane so the
 * Dark Charcoal + Gold identity stays consistent everywhere it is rendered.
 */
export const BARBER_THEME = {
  id: 'barber_mens_grooming' as const,
  charcoal: '#141414',
  charcoalSoft: '#1d1d1d',
  charcoalCard: '#1a1a1a',
  gold: '#c9a227',
  goldBright: '#e8c95c',
  goldSoft: '#3a3016',
  cream: '#f5efe0',
  muted: '#a6a49b',
} as const;

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

  barber_mens_grooming: [
    // Haircuts
    { name: 'Skin Fade', category: 'Haircuts', description: 'Precision skin fade blended seamlessly from skin to your preferred length on top.', price: 450, duration: 45 },
    { name: 'Scissors Cut', category: 'Haircuts', description: 'Classic scissor-over-comb cut tailored to your hair type and face shape.', price: 400, duration: 40 },
    { name: 'Buzz Cut', category: 'Haircuts', description: 'Clean, uniform clipper cut for a low-maintenance, sharp look.', price: 250, duration: 20 },
    { name: 'Taper Fade', category: 'Haircuts', description: 'Gradual taper fade with a crisp neckline and clean, sharp finish.', price: 400, duration: 40 },
    { name: 'Kids Barbering', category: 'Haircuts', description: 'Patient, friendly haircut for boys with a fun, fuss-free finish.', price: 250, duration: 25 },
    { name: 'Head Shave', category: 'Haircuts', description: 'Smooth head shave with hot-towel prep and soothing aftercare.', price: 300, duration: 25 },

    // Beard & Shave
    { name: 'Beard Sculpting & Lineup', category: 'Beard & Shave', description: 'Detailed beard sculpting with a sharp line-up, hot towel and beard oil finish.', price: 350, duration: 30 },
    { name: 'Hot Towel Classic Shave', category: 'Beard & Shave', description: 'Traditional straight-razor shave with hot towels and a cooling balm.', price: 400, duration: 35 },
    { name: 'Beard Trim & Lineup', category: 'Beard & Shave', description: 'Precision beard trim with crisp cheek and neck line-up.', price: 250, duration: 20 },
    { name: 'Moustache Styling', category: 'Beard & Shave', description: 'Moustache trim, shape and styling with premium wax.', price: 150, duration: 15 },
    { name: 'Beard Color/Coverup', category: 'Beard & Shave', description: 'Natural-looking beard colour to cover greys and deepen tone.', price: 450, duration: 30 },

    // Grooming & Treatments
    { name: 'Charcoal Face Detox', category: 'Grooming & Treatments', description: 'Deep-cleansing charcoal facial to unclog pores and refresh tired skin.', price: 800, duration: 40 },
    { name: 'Scalp & Head Massage', category: 'Grooming & Treatments', description: 'Therapeutic scalp massage to relieve tension and boost circulation.', price: 600, duration: 30 },
    { name: 'Executive Beard & Hair Combo', category: 'Grooming & Treatments', description: 'Signature haircut plus sculpted beard and styling finish in one sitting.', price: 700, duration: 60 },
    { name: 'Hair Loss Scalp Therapy', category: 'Grooming & Treatments', description: 'Targeted scalp therapy to strengthen roots and reduce hair fall.', price: 1200, duration: 45 },
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

  'hair-studio': [
    // Cut & Style
    { name: 'Precision Dry Cut', category: 'Cut & Style', description: 'Expert dry-cutting technique for perfect shape, movement and texture tailored to your hair type.', price: 1200, duration: 45 },
    { name: 'Signature Blowout & Style', category: 'Cut & Style', description: 'Voluminous salon blowout with round-brush finish for bounce and lasting hold.', price: 800, duration: 40 },
    { name: 'Creative Crop & Texture', category: 'Cut & Style', description: 'Edgy, fashion-forward short cut with razor texturising and personalised finish.', price: 1500, duration: 50 },
    { name: 'Long-Layer Transformation', category: 'Cut & Style', description: 'Face-framing long layers with invisible blending for natural movement.', price: 1400, duration: 55 },
    { name: 'Editorial Upstyle', category: 'Cut & Style', description: 'Red-carpet-worthy updo with intricate braiding, twists and accessory placement.', price: 2500, duration: 75 },

    // Color & Highlights
    { name: 'Root Shadow & Smudge', category: 'Color & Highlights', description: 'Soft shadow-root blending for seamless grow-out and depth dimension.', price: 2800, duration: 90 },
    { name: 'Hand-Painted Balayage', category: 'Color & Highlights', description: 'French balayage technique for sun-kissed, natural-looking dimension with zero harsh lines.', price: 4500, duration: 150 },
    { name: 'Foilayage Hybrid', category: 'Color & Highlights', description: 'Best of both worlds — foil precision meets balayage softness for maximum brightness.', price: 5200, duration: 160 },
    { name: 'Pastel & Fashion Tones', category: 'Color & Highlights', description: 'Creative pastel pinks, lavenders or silvers on pre-lightened hair for a statement look.', price: 4000, duration: 120 },
    { name: 'Color Correction', category: 'Color & Highlights', description: 'Expert corrective work to fix banding, brassiness or unwanted tones. Consultation required.', price: 6000, duration: 180 },

    // Texture & Perms
    { name: 'Digital Perm', category: 'Texture & Perms', description: 'Heat-activated digital waves for soft, natural-looking curls with lasting definition.', price: 3500, duration: 150 },
    { name: 'Keratin Smoothing', category: 'Texture & Perms', description: 'Premium formaldehyde-free keratin therapy to eliminate frizz for up to 12 weeks.', price: 5000, duration: 150 },
    { name: 'Beach Wave Perm', category: 'Texture & Perms', description: 'Loose, effortless beachy waves with body and movement — low maintenance, high impact.', price: 3800, duration: 140 },
    { name: 'Japanese Straightening', category: 'Texture & Perms', description: 'Thermal reconditioning for permanently sleek, pin-straight hair with mirror shine.', price: 6500, duration: 200 },

    // Treatments
    { name: 'Bond Repair Treatment', category: 'Treatments', description: 'Advanced bond-building therapy to reconstruct damaged disulfide bonds from within.', price: 3000, duration: 60 },
    { name: 'Scalp Microbiome Detox', category: 'Treatments', description: 'Trichologist-inspired scalp reset with exfoliation, steam and probiotic serum infusion.', price: 1800, duration: 50 },
    { name: 'Liquid Hair Gloss', category: 'Treatments', description: 'Instant glass-like shine treatment that seals cuticles and boosts colour vibrancy.', price: 1500, duration: 35 },
    { name: 'Collagen Hair Filler', category: 'Treatments', description: 'Injectable-grade collagen complex to plump, thicken and revitalise fine or thinning hair.', price: 2800, duration: 55 },

    // Bridal & Events
    { name: 'Bridal Hair Trial', category: 'Bridal & Events', description: 'Pre-wedding consultation and trial run of your chosen bridal hairstyle with veil placement.', price: 1800, duration: 60 },
    { name: 'Bridal Hair & Styling', category: 'Bridal & Events', description: 'Complete wedding-day hair: style, setting, accessory placement and touch-up kit.', price: 5500, duration: 120 },
    { name: 'Event Styling & Finish', category: 'Bridal & Events', description: 'Glamorous blowout or upstyle for parties, galas, cocktail events and red-carpet moments.', price: 2200, duration: 60 },
    { name: 'Bridal Party Package', category: 'Bridal & Events', description: 'Coordinated styling for bride + 3 bridesmaids with on-location option available.', price: 12000, duration: 240 },
  ],

  'family-salon': [
    // Hair
    { name: "Women's Cut & Style", category: 'Hair', description: 'Flattering cut shaped to your face, finished with a relaxing wash and blow-dry.', price: 400, duration: 45 },
    { name: "Men's Classic Cut", category: 'Hair', description: 'Sharp scissor-and-clipper cut with neck clean-up and styling product finish.', price: 300, duration: 30 },
    { name: 'Kids Fun Cut (under 12)', category: 'Hair', description: 'Gentle, friendly haircut in a kid-approved chair with a little surprise at the end.', price: 200, duration: 25 },
    { name: 'Root Touch-Up Colour', category: 'Hair', description: 'Quick grey coverage or root refresh in under an hour with gentle formula.', price: 800, duration: 50 },
    { name: 'Global Hair Colour', category: 'Hair', description: 'All-over rich colour transformation with pre-colour scalp protection.', price: 2000, duration: 100 },
    { name: 'Blow-Dry & Style', category: 'Hair', description: 'Bouncy blow-dry with volume for a polished everyday look.', price: 300, duration: 30 },

    // Beauty
    { name: 'Party Makeup', category: 'Beauty', description: 'Camera-ready makeup for birthdays, dinners and celebrations.', price: 1800, duration: 75 },
    { name: 'Bridal Makeup HD', category: 'Beauty', description: 'Flawless high-definition bridal look with airbrush finish and lashes.', price: 7000, duration: 150 },
    { name: 'Eyebrow Threading', category: 'Beauty', description: 'Precision brow shaping to frame your face perfectly.', price: 100, duration: 15 },
    { name: 'Upper Lip Threading', category: 'Beauty', description: 'Quick, hygienic upper lip threading.', price: 50, duration: 10 },
    { name: 'Saree Draping', category: 'Beauty', description: 'Expert saree draping for weddings, parties and festive occasions.', price: 500, duration: 30 },

    // Skin
    { name: 'Clean-Up Facial', category: 'Skin', description: 'Basic deep-cleansing facial with steam, extraction and soothing mask.', price: 600, duration: 45 },
    { name: 'Glow Facial', category: 'Skin', description: 'Vitamin C brightening facial for instant radiance and even skin tone.', price: 1200, duration: 60 },
    { name: 'Anti-Tan Pack', category: 'Skin', description: 'De-tan treatment to reverse sun damage and restore natural complexion.', price: 800, duration: 40 },
    { name: 'Full Body Waxing', category: 'Skin', description: 'Complete body waxing — arms, legs, underarms and bikini line with soothing gel.', price: 1800, duration: 90 },

    // Grooming
    { name: 'Beard Trim & Shape', category: 'Grooming', description: 'Precision beard styling with hot-towel prep and beard oil finish.', price: 200, duration: 20 },
    { name: 'Clean Shave Experience', category: 'Grooming', description: 'Luxurious straight-razor shave with pre-shave oil, hot towel and cooling balm.', price: 350, duration: 30 },
    { name: "Men's Facial", category: 'Grooming', description: 'Deep-cleansing facial designed for men’s thicker skin with charcoal detox.', price: 700, duration: 45 },
    { name: 'Haircut + Beard Combo', category: 'Grooming', description: 'Complete grooming: fresh haircut paired with a precision beard trim.', price: 450, duration: 50 },

    // Spa
    { name: 'Head & Shoulder Massage', category: 'Spa', description: 'Tension-melting massage for scalp, neck and shoulders with warm oil.', price: 600, duration: 30 },
    { name: 'Foot Reflexology', category: 'Spa', description: 'Pressure-point foot massage to relieve stress and boost circulation.', price: 700, duration: 40 },
    { name: 'Body Massage', category: 'Spa', description: 'Full-body relaxation massage with aromatic oils to ease tired muscles.', price: 1500, duration: 60 },
    { name: 'De-Stress Spa Combo', category: 'Spa', description: 'Head massage + foot reflexology + mini facial for total rejuvenation.', price: 1800, duration: 90 },

    // Kids
    { name: 'Kids Haircut (Girls)', category: 'Kids', description: 'Sweet, gentle haircut for little girls with a fun clip or bow.', price: 200, duration: 25 },
    { name: 'Kids Haircut (Boys)', category: 'Kids', description: 'Cool kids cut with clippers or scissors — quick and fuss-free.', price: 200, duration: 20 },
    { name: 'Mommy & Me Package', category: 'Kids', description: 'Matching blow-dry styles for mom and daughter — a fun bonding experience.', price: 900, duration: 60 },
    { name: 'Teen Glow Facial', category: 'Kids', description: 'Gentle teen-friendly facial for clear, fresh skin — ages 13 to 18.', price: 500, duration: 40 },
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
  barber_mens_grooming: [
    'Skin Fade',
    'Beard Sculpting',
    'Hot Towel Shave',
    'Hair & Beard Combo',
    'Head Shave',
    'Charcoal Face Mask',
  ],
  'hair-studio': [
    'Precision Dry Cut',
    'Hand-Painted Balayage',
    'Root Shadow & Smudge',
    'Bond Repair Treatment',
    'Digital Perm',
    'Bridal Hair & Styling',
    'Editorial Upstyle',
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
  'family-salon': [
    "Women's Cut & Style",
    "Men's Classic Cut",
    'Kids Fun Cut (under 12)',
    'Party Makeup',
    'Glow Facial',
    'Haircut + Beard Combo',
    'De-Stress Spa Combo',
  ],
};

/**
 * Display-name → catalogue-name aliases for suggested services.
 * The Barber theme's suggested chips use short customer-facing labels
 * (e.g. "Beard Sculpting") while the catalogue stores the fuller name
 * (e.g. "Beard Sculpting & Lineup"). This maps them together so one-click
 * "Add Selected" always resolves to a real, fully-described service.
 */
export const SUGGESTED_SERVICE_ALIASES: Partial<Record<ThemeId, Record<string, string>>> = {
  barber_mens_grooming: {
    'Beard Sculpting': 'Beard Sculpting & Lineup',
    'Hot Towel Shave': 'Hot Towel Classic Shave',
    'Hair & Beard Combo': 'Executive Beard & Hair Combo',
    'Charcoal Face Mask': 'Charcoal Face Detox',
  },
};

/** Returns the curated suggested services for a theme (resolved from the catalogue). */
export function getSuggestedServices(theme: ThemeId): PredefinedService[] {
  const all = SERVICES_BY_THEME[theme] || [];
  const aliases = SUGGESTED_SERVICE_ALIASES[theme] || {};
  return (SUGGESTED_SERVICE_NAMES[theme] || [])
    .map((name) => all.find((s) => s.name === name) || all.find((s) => s.name === aliases[name]))
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
  barber_mens_grooming: ['Skin Fade', 'Hot Towel Classic Shave'],
  'hair-studio': ['Hand-Painted Balayage', 'Bond Repair Treatment'],
  wellness: ['Hydra Facial', 'Swedish Relaxation Massage'],
  'family-salon': ['De-Stress Spa Combo', 'Mommy & Me Package'],
};

/** Theme-aware spoken-input example service. */
export const VOICE_SERVICE_BY_THEME: Record<ThemeId, PredefinedService> = {
  hair: { name: 'Signature Blow-Out & Style', category: 'Styling', description: 'Salon blow-out with volume and long-lasting hold.', price: 500, duration: 45 },
  barber_mens_grooming: { name: 'The Executive Cut & Shave', category: 'Grooming & Treatments', description: 'Signature cut with hot-towel shave and scalp massage finish.', price: 750, duration: 60 },
  'hair-studio': { name: 'Glass Hair Gloss & Finish', category: 'Treatments', description: 'Mirror-shine gloss treatment with silk press finish.', price: 2000, duration: 55 },
  wellness: { name: 'Aroma Relaxation Massage', category: 'Massage', description: 'Soothing essential-oil full-body massage.', price: 2000, duration: 60 },
  'family-salon': { name: 'Family Pamper Day Pass', category: 'Spa', description: 'A relaxing head massage and mini facial for the whole family.', price: 2500, duration: 120 },
};
