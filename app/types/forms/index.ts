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