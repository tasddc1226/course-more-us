export interface FormError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: FormError[];
  success?: string;
}

export interface RecommendationFormData {
  region: string;
  date: string;
  timeSlots: string[];
}

export interface PlaceFormData {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating: number;
  price_level: number;
  category_id: string;
  region_id: string;
  is_partner: boolean;
  time_slots: string[];
  images: string[];
  tags: string[];
}

export interface Place {
  id: number;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating: number;
  price_level: number;
  is_partnership: boolean;
  categories?: {
    name: string;
    icon?: string;
  };
  place_images?: Array<{
    image_url: string;
  }>;
  tags?: string[];
}

export interface RecommendationResponse {
  places: Place[];
  requestInfo: {
    regionName: string;
    date: string;
    timeSlots: string[];
  };
}

export interface UserPlaceFormData {
  name: string;
  address: string;
  description: string;
  tags: string[];
  images: File[];
  latitude?: number;
  longitude?: number;
  category_id: number;
  region_id: number;
} 