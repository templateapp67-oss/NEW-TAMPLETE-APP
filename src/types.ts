export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number; // minutes
  featured?: boolean;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
}

export type StaffStatus = 'Available' | 'Busy' | 'On Leave' | 'Inactive';

export type AppAccessRole = 
  | 'Owner / Admin'
  | 'Manager'
  | 'Service Provider'
  | 'Receptionist / Frontdesk'
  | 'Limited Staff'
  | 'No App Access'
  | 'Manager (Full Access)' 
  | 'Service Provider (Assigned)' 
  | 'Receptionist (Frontdesk)';

export interface WeeklyScheduleDay {
  working: boolean;
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "06:00 PM"
}

export type WeeklySchedule = Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  WeeklyScheduleDay
>;

export interface TeamMember {
  id: string;
  name: string;
  role: string; // Primary Role (e.g. Senior Stylist)
  customRole?: string;
  appAccessRole?: AppAccessRole;
  specialties: string[];
  imageUrl: string;
  bio?: string;
  phone?: string;
  commission?: number; // percentage, e.g. 15
  status?: StaffStatus;
  assignedServiceIds?: string[];
  hidePhoneFromPublic?: boolean;
  schedule?: WeeklySchedule;
  rating?: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  category?: 'Interior' | 'Details' | 'Hair' | 'Barber' | 'Beauty' | 'General' | string;
}

export interface SocialProfiles {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

export interface SocialVideo {
  id: string;
  title: string;
  platform: 'instagram' | 'youtube' | 'facebook' | 'tiktok';
  url: string;
  thumbnailUrl: string;
  dateAdded?: string;
  likesCount?: string;
}

export interface SalonAddress {
  fullAddress: string;
  shopNumber?: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  landmark?: string;
}

export interface DaySchedule {
  open: boolean;
  startTime: string;
  endTime: string;
}

export interface SalonOpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface EnabledContactOptions {
  callNow: boolean;
  whatsapp: boolean;
  bookNow: boolean;
}

export interface BookingRules {
  minNotice: string;
  maxAdvance: string;
  bufferTime: string;
  allowStaffSelection: boolean;
  advanceDepositPercentage: number;
}

export type WebsiteAppearance = 'light' | 'dark';

export interface ReviewedContent {
  heroHeadline: string;
  tagline: string;
  about: string;
  ownerIntro: string;
  serviceDescriptions: Record<string, string>;
  bookingCTA: string;
}

export type PublishState = 'draft' | 'publishing' | 'published';

export interface SalonData {
  templateId?: 'hair' | 'barber' | 'wellness';
  salonName: string;
  tagline: string;
  ownerName: string;
  ownerRole: string;
  about: string;
  phone: string;
  email: string;
  whatsappPhone?: string;
  contactOptions?: EnabledContactOptions;
  bookingRules?: BookingRules;
  logoUrl?: string;
  heroImageUrl?: string;
  heroPosition?: 'Top' | 'Center' | 'Bottom';
  gallery?: GalleryImage[];
  socialProfiles?: SocialProfiles;
  socialVideos?: SocialVideo[];
  address?: SalonAddress;
  openingHours?: SalonOpeningHours;
  services: Service[];
  packages: Package[];
  team: TeamMember[];
  websiteAppearance?: WebsiteAppearance;
  reviewedContent?: ReviewedContent;
  websiteSlug?: string;
  publishState?: PublishState;
  publishedUrl?: string;
  lastCompletedStep?: number;
}

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { working: true, startTime: '09:00 AM', endTime: '06:00 PM' },
  tuesday: { working: true, startTime: '09:00 AM', endTime: '06:00 PM' },
  wednesday: { working: true, startTime: '09:00 AM', endTime: '06:00 PM' },
  thursday: { working: true, startTime: '09:00 AM', endTime: '06:00 PM' },
  friday: { working: true, startTime: '09:00 AM', endTime: '07:00 PM' },
  saturday: { working: true, startTime: '10:00 AM', endTime: '05:00 PM' },
  sunday: { working: false, startTime: '10:00 AM', endTime: '04:00 PM' },
};

/**
 * Public Website Rule Helper:
 * Returns only safe public information for customer website display.
 * Never exposes appAccessRole, commission, internal status, private phone, or schedule.
 */
export function getPublicStaffData(member: TeamMember) {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    specialties: member.specialties,
    imageUrl: member.imageUrl,
    bio: member.bio,
    phone: member.hidePhoneFromPublic ? undefined : member.phone,
    rating: member.rating
  };
}

export const initialData: SalonData = {
  templateId: 'hair',
  salonName: 'Royal Hair & Beauty Studio',
  tagline: 'Premium Hair, Beauty & Spa Care in Indore',
  ownerName: 'Rahul Sharma',
  ownerRole: 'Founder & Master Stylist',
  about: 'Welcome to Royal Hair & Beauty Studio. We offer professional haircutting, hair spa, organic coloring, HD bridal makeup, and relaxing skin treatments.',
  phone: '+91 98765 43210',
  whatsappPhone: '+91 98765 43210',
  email: 'contact@royalhairstudio.in',
  contactOptions: {
    callNow: true,
    whatsapp: true,
    bookNow: true
  },
  bookingRules: {
    minNotice: '1 hour',
    maxAdvance: '30 days',
    bufferTime: 'No buffer',
    allowStaffSelection: true,
    advanceDepositPercentage: 25
  },
  logoUrl: '',
  heroImageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1000&auto=format&fit=crop',
  heroPosition: 'Center',
  gallery: [
    {
      id: 'g1',
      url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
      alt: 'Luxury salon interior in Mumbai with bright lighting',
      category: 'Interior'
    },
    {
      id: 'g2',
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
      alt: 'Close up of professional salon tools and shears',
      category: 'Details'
    },
    {
      id: 'g3',
      url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=600&auto=format&fit=crop',
      alt: 'Beautiful hair coloring and styling result',
      category: 'Hair'
    }
  ],
  socialProfiles: {
    instagram: 'https://instagram.com/royalhairstudio_mumbai',
    facebook: 'https://facebook.com/royalhairstudio_mumbai',
    youtube: 'https://youtube.com/@royalhairstudio_mumbai',
    tiktok: 'https://instagram.com/royalhairstudio_mumbai'
  },
  address: {
    fullAddress: 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
    shopNumber: 'Shop 14',
    area: 'Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400050',
    landmark: 'Opposite National College'
  },
  openingHours: {
    monday: { open: true, startTime: '10:00', endTime: '20:00' },
    tuesday: { open: true, startTime: '10:00', endTime: '20:00' },
    wednesday: { open: true, startTime: '10:00', endTime: '20:00' },
    thursday: { open: true, startTime: '10:00', endTime: '20:00' },
    friday: { open: true, startTime: '10:00', endTime: '20:00' },
    saturday: { open: true, startTime: '10:00', endTime: '20:00' },
    sunday: { open: false, startTime: '10:00', endTime: '20:00' }
  },
  socialVideos: [
    {
      id: 'v1',
      title: 'Hair Spa & Scalp Massage ✨',
      platform: 'instagram',
      url: 'https://instagram.com/reel/12345',
      thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
      dateAdded: 'Today',
      likesCount: '1.8k'
    },
    {
      id: 'v2',
      title: 'HD Bridal Glow Makeup 💄',
      platform: 'youtube',
      url: 'https://youtube.com/shorts/67890',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
      dateAdded: 'Yesterday',
      likesCount: '2.4k'
    }
  ],
  services: [
    {
      id: '1',
      name: 'Haircut & Blow-Dry Styling',
      category: 'Haircut',
      description: 'Classic and modern haircut tailored to your face shape, including head wash and blow-dry styling.',
      price: 350,
      duration: 30,
      featured: true
    },
    {
      id: '2',
      name: 'Nourishing Hair Spa',
      category: 'Treatment',
      description: 'Deep conditioning scalp massage and spa treatment to restore hydration, shine, and soft texture.',
      price: 900,
      duration: 45,
      featured: true
    },
    {
      id: '3',
      name: 'Ammonia-Free Hair Color',
      category: 'Hair Coloring',
      description: 'Full grey coverage or vibrant root touch-up with ammonia-free organic color products.',
      price: 1500,
      duration: 90
    },
    {
      id: '4',
      name: 'Keratin Hair Treatment',
      category: 'Treatment',
      description: 'Advanced smoothing keratin treatment to eliminate frizz and deliver long-lasting silky straight hair.',
      price: 3500,
      duration: 120
    },
    {
      id: '5',
      name: 'HD Bridal Makeup & Styling',
      category: 'Beauty',
      description: 'High-definition bridal makeup look with skin preparation, premium lashes, and saree/hair draping.',
      price: 4500,
      duration: 120,
      featured: true
    }
  ],
  packages: [
    {
      id: 'p1',
      name: 'Royal Bridal Glow Package',
      description: 'Complete head-to-toe bridal makeover including HD makeup, hair spa, facial, manicure & pedicure.',
      price: 8500,
      duration: 240
    },
    {
      id: 'p2',
      name: 'Executive Grooming & Spa Combo',
      description: 'Stylish haircut, precision beard sculpting, scalp massage, and refreshing facial setup.',
      price: 1200,
      duration: 75
    }
  ],
  websiteAppearance: 'light' as const,
  websiteSlug: 'royal-hair-studio',
  publishState: 'draft' as const,
  publishedUrl: '',
  lastCompletedStep: 0,
  reviewedContent: {
    heroHeadline: 'Royal Hair & Beauty Studio',
    tagline: 'Premium Hair, Beauty & Spa Care in Indore',
    about: 'Welcome to Royal Hair & Beauty Studio. We offer professional haircutting, hair spa, organic coloring, HD bridal makeup, and relaxing skin treatments. Our expert stylists are dedicated to making you look and feel your best.',
    ownerIntro: 'I am Rahul Sharma, Founder & Master Stylist with over 12 years of experience in luxury haircutting and salon management across India. My passion is creating personalized looks that elevate your natural beauty.',
    serviceDescriptions: {},
    bookingCTA: 'Ready to Transform Your Look? Book your appointment today and experience premium care.'
  },
  team: [
    {
      id: 't1',
      name: 'Rahul Sharma',
      role: 'Owner & Master Stylist',
      appAccessRole: 'Manager (Full Access)',
      specialties: ['Precision Haircut', 'Balayage', 'Salon Management'],
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      bio: 'Rahul has over 12 years of experience in luxury haircutting and salon management across India.',
      phone: '+91 98765 43210',
      commission: 20,
      status: 'Available',
      assignedServiceIds: ['1', '2', '3', '4'],
      hidePhoneFromPublic: false,
      rating: 5.0,
      schedule: DEFAULT_WEEKLY_SCHEDULE,
    },
    {
      id: 't2',
      name: 'Ananya Verma',
      role: 'Senior Hair Specialist',
      appAccessRole: 'Service Provider (Assigned)',
      specialties: ['Hair Spa', 'Organic Coloring', 'Keratin Treatment'],
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      bio: 'Ananya is an expert in organic hair coloring, customized keratin treatments, and hair spa therapy.',
      phone: '+91 98765 43211',
      commission: 15,
      status: 'Available',
      assignedServiceIds: ['1', '2', '3', '4'],
      hidePhoneFromPublic: true,
      rating: 4.9,
      schedule: DEFAULT_WEEKLY_SCHEDULE,
    },
    {
      id: 't3',
      name: 'Priya Patel',
      role: 'Bridal Makeup & Skin Therapist',
      appAccessRole: 'Service Provider (Assigned)',
      specialties: ['Bridal Makeup', 'HD Makeup', 'Skin Facials'],
      imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=200&auto=format&fit=crop',
      bio: 'Priya specializes in flawless HD bridal makeups, pre-wedding skin prep, and calming facial treatments.',
      phone: '+91 98765 43212',
      commission: 15,
      status: 'On Leave',
      assignedServiceIds: ['5'],
      hidePhoneFromPublic: true,
      rating: 4.9,
      schedule: DEFAULT_WEEKLY_SCHEDULE,
    },
    {
      id: 't4',
      name: 'Vikram Singh',
      role: 'Senior Barber & Grooming Expert',
      appAccessRole: 'Service Provider (Assigned)',
      specialties: ['Beard Sculpting', 'Skin Fade', 'Hot Towel Shave'],
      imageUrl: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=200&auto=format&fit=crop',
      bio: 'Vikram brings 8 years of mastery in classic barbershop techniques, beard styling, and hot towel treatments.',
      phone: '+91 98765 43213',
      commission: 15,
      status: 'Busy',
      assignedServiceIds: ['1'],
      hidePhoneFromPublic: true,
      rating: 4.8,
      schedule: DEFAULT_WEEKLY_SCHEDULE,
    }
  ]
};

