import { createSupabaseServerClient } from './supabase.server';
import type { AdvancedFilters } from '~/components/filters';

export interface FilteredPlace {
  id: number;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price_range: number | null;
  rating: number | null;
  is_partnership: boolean;
  category_id: number | null;
  region_id: number | null;
  tags: string[] | null;
  accessibility_features: string[] | null;
  score: number;
}

export async function applyAdvancedFilters(
  request: Request,
  places: any[],
  filters: AdvancedFilters
): Promise<FilteredPlace[]> {
  const supabase = createSupabaseServerClient(request);
  
  let filteredPlaces = [...places];

  // 1. 예산 필터링
  if (filters.budget.min > 0 || filters.budget.max < 500000) {
    filteredPlaces = filteredPlaces.filter(place => {
      if (!place.price_range) return true; // 가격 정보가 없으면 포함
      
      // price_range를 실제 예상 비용으로 변환 (1=저렴, 2=보통, 3=고급, 4=프리미엄)
      const estimatedCost = place.price_range * 15000; // 대략적인 비용 추정
      
      return estimatedCost >= filters.budget.min && estimatedCost <= filters.budget.max;
    });
  }

  // 2. 접근성 필터링
  if (filters.accessibility.length > 0) {
    const accessibilityIds = filters.accessibility.map(opt => opt.id);
    
    // 접근성 정보가 있는 장소만 필터링
    filteredPlaces = filteredPlaces.filter(place => {
      if (!place.accessibility_features) return false;
      
      // 요청된 접근성 기능 중 하나라도 만족하는지 확인
      return accessibilityIds.some(id => 
        place.accessibility_features.includes(id)
      );
    });
  }

  // 3. 그룹 요구사항 필터링
  if (filters.group.hasChildren || filters.group.hasSeniors) {
    filteredPlaces = filteredPlaces.filter(place => {
      // 아동 동반 시 안전하고 가족 친화적인 장소
      if (filters.group.hasChildren) {
        const childFriendlyTags = ['가족친화', '아동', '안전', '놀이터', '교육'];
        const hasChildFriendly = place.tags?.some((tag: string) => 
          childFriendlyTags.some(friendly => tag.includes(friendly))
        );
        if (!hasChildFriendly) return false;
      }
      
      // 노약자 동반 시 접근성이 좋은 장소
      if (filters.group.hasSeniors) {
        const seniorFriendlyTags = ['휠체어', '엘리베이터', '경사로', '편의시설'];
        const hasSeniorFriendly = place.tags?.some((tag: string) => 
          seniorFriendlyTags.some(friendly => tag.includes(friendly))
        );
        if (!hasSeniorFriendly) return false;
      }
      
      return true;
    });
  }

  // 4. 날씨 고려 필터링
  if (filters.weather.preferIndoor) {
    const indoorTags = ['실내', '카페', '레스토랑', '영화관', '박물관', '갤러리', '쇼핑'];
    filteredPlaces = filteredPlaces.filter(place => {
      return place.tags?.some((tag: string) => 
        indoorTags.some(indoor => tag.includes(indoor))
      ) || place.category_id === 1; // 카페/음식점 카테고리
    });
  }

  // 5. 스코어링 및 정렬
  const scoredPlaces: FilteredPlace[] = filteredPlaces.map(place => {
    let score = 0;
    
    // 기본 점수
    score += place.rating ? place.rating * 10 : 50;
    
    // 파트너십 보너스
    if (place.is_partnership) score += 30;
    
    // 가격대 적합성 (예산 범위 내에서 적당한 가격)
    if (place.price_range && filters.budget.max > 0) {
      const estimatedCost = place.price_range * 15000;
      const budgetRatio = estimatedCost / filters.budget.max;
      if (budgetRatio <= 0.7) score += 20; // 예산의 70% 이하
      else if (budgetRatio <= 1.0) score += 10; // 예산 범위 내
    }
    
    // 접근성 보너스
    if (filters.accessibility.length > 0 && place.accessibility_features) {
      const matchedAccessibility = filters.accessibility.filter(opt => 
        place.accessibility_features.includes(opt.id)
      ).length;
      score += matchedAccessibility * 5;
    }
    
    // 그룹 크기 고려
    if (filters.group.size > 4) {
      const largeGroupTags = ['단체', '파티', '회식', '모임'];
      const isLargeGroupFriendly = place.tags?.some((tag: string) => 
        largeGroupTags.some(group => tag.includes(group))
      );
      if (isLargeGroupFriendly) score += 15;
    }
    
    return {
      ...place,
      score: Math.round(score)
    };
  });

  // 스코어 순으로 정렬
  return scoredPlaces.sort((a, b) => b.score - a.score);
}

export async function getAccessibilityFeatures(request: Request) {
  const supabase = createSupabaseServerClient(request);
  
  // 실제로는 데이터베이스에서 접근성 기능 목록을 가져와야 함
  // 현재는 하드코딩된 목록 반환
  return [
    { id: 'wheelchair', label: '휠체어 접근 가능', icon: '♿' },
    { id: 'parking', label: '주차 시설', icon: '🅿️' },
    { id: 'public_transport', label: '대중교통 접근', icon: '🚇' },
    { id: 'elevator', label: '엘리베이터', icon: '🛗' },
    { id: 'ramp', label: '경사로', icon: '🛤️' },
    { id: 'accessible_bathroom', label: '장애인 화장실', icon: '🚻' },
  ];
}

export async function getWeatherInfo(request: Request, latitude: number, longitude: number) {
  // 실제 날씨 API 연동 시 구현
  // 현재는 기본 정보 반환
  return {
    condition: 'sunny',
    temperature: 22,
    humidity: 60,
    isIndoorRecommended: false
  };
} 