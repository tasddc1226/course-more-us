import { env } from "~/config/env";
import type {
  PerplexityCoursePlanningRequest,
  PerplexityCourseResponse,
  PerplexityAPIResponse
} from "~/types/perplexity";

/**
 * Perplexity API 기반 데이트 코스 생성 서비스
 */

/**
 * 시스템 프롬프트 템플릿 구성
 */
function buildPerplexitySystemPrompt(request: PerplexityCoursePlanningRequest): string {
  const { contextData, preferences } = request;
  const { selectedRegion, selectedTimeSlots, selectedDate, availablePlaces } = contextData;
  
  const placesInfo = availablePlaces.map(place => 
    `- ${place.name} (${place.categories?.name || '기타'}) - ${place.description || ''}`
  ).join('\n');

  return `
당신은 한국의 데이트 코스 전문 플래너입니다. 
실시간 검색 정보와 제공된 지역 정보를 바탕으로 최적의 데이트 코스를 추천해주세요.

## 검색 및 분석 요청:
1. "${selectedRegion.name} 지역 최신 인기 데이트 코스 트렌드" 검색
2. "${selectedRegion.name} 지역 ${selectedTimeSlots.map(t => t.name).join(', ')} 시간대 추천 장소" 검색  
3. "${request.userRequest}" 관련 최신 장소 및 리뷰 검색
4. "${selectedDate}" 날짜 주변 특별 이벤트나 계절 특성 검색

## 제공된 기존 장소 정보:
${placesInfo}

## 사용자 요청사항:
- 지역: ${selectedRegion.name}
- 날짜: ${selectedDate}
- 시간대: ${selectedTimeSlots.map(t => `${t.name} (${t.start_time}-${t.end_time})`).join(', ')}
- 요청: ${request.userRequest}
- 관심사: ${preferences.interests.join(', ')}
- 예산: ${preferences.budgetRange.min.toLocaleString()}원~${preferences.budgetRange.max.toLocaleString()}원
- 최신 트렌드 반영: ${preferences.includeTrends ? '예' : '아니오'}
- 실시간 리뷰 반영: ${preferences.includeReviews ? '예' : '아니오'}

## 추천 가이드라인:
1. 실시간 검색으로 발견한 최신 정보를 우선 활용
2. 기존 등록된 장소와 새로 발견한 장소를 적절히 조합
3. 최신 리뷰와 평점을 반영한 신뢰도 높은 추천
4. 계절/날씨/이벤트 등 실시간 상황 고려
5. 실제 이동 가능한 거리와 시간 고려 (도보 15분, 대중교통 30분 이내)
6. 예산 범위 내에서 가성비 좋은 조합 추천
7. 사용자의 관심사와 요청사항을 최대한 반영

## 응답 형식:
반드시 JSON 형태로 다음 구조를 정확히 따라 응답해주세요:

{
  "searchSummary": {
    "trendingPlaces": ["검색으로 발견한 인기 장소 3-5개"],
    "seasonalEvents": ["해당 시기 특별 이벤트나 축제"],
    "weatherConsiderations": "현재 계절/날씨에 따른 고려사항"
  },
  "recommendedCourse": {
    "name": "창의적인 코스명 (예: 🌸 봄날의 로맨틱 홍대 투어)",
    "theme": "추천 테마 (로맨틱, 액티비티, 문화예술, 맛집탐방 등)",
    "description": "코스 설명 (실시간 정보 반영, 100자 내외)",
    "reasoning": "이 코스를 추천하는 이유 (검색 근거와 트렌드 정보 포함)",
    "places": [
      {
        "name": "구체적인 장소명",
        "category": "카테고리 (카페, 식당, 문화시설 등)",
        "timeSlot": "추천 시간대 (예: 오후)",
        "duration": 90,
        "isRegistered": true,
        "searchInfo": {
          "recentReview": "최신 리뷰나 평가 요약 (50자 내외)",
          "trendScore": 85,
          "recommendationReason": "이 장소를 선택한 구체적 이유"
        },
        "specialTips": "최신 정보 기반 특별 팁이나 주의사항"
      }
    ],
    "realTimeAdvice": [
      "현재 상황 기반 실시간 조언들 (예: 예약 필요성, 혼잡 시간대 등)"
    ]
  }
}

주의사항:
- 실제 존재하는 장소명을 사용하세요
- 검색으로 확인된 정보만 포함하세요
- JSON 형식을 정확히 지켜주세요
- 한국어로 응답해주세요
`.trim();
}

/**
 * 사용자 요청을 검색 쿼리로 변환
 */
function buildSearchQuery(request: PerplexityCoursePlanningRequest): string {
  const { userRequest, contextData, preferences } = request;
  
  return `
${contextData.selectedRegion.name} 지역에서 ${contextData.selectedDate} 날짜에 
${contextData.selectedTimeSlots.map(t => t.name).join(', ')} 시간대에 
"${userRequest}" 이런 데이트를 하고 싶습니다.

예산은 ${preferences.budgetRange.min.toLocaleString()}원~${preferences.budgetRange.max.toLocaleString()}원이고,
관심사는 ${preferences.interests.join(', ')}입니다.

${preferences.includeTrends ? '최신 트렌드와 인기 장소를 포함해서' : ''} 
${preferences.includeReviews ? '실시간 리뷰와 평점이 좋은 곳들을 중심으로' : ''}
실용적이고 구체적인 데이트 코스를 추천해주세요.

특히 다음 정보들을 검색해서 반영해주세요:
- ${contextData.selectedRegion.name} 지역 최신 인기 장소
- 해당 지역 맛집과 카페 트렌드
- ${contextData.selectedDate} 시기의 특별 이벤트나 행사
- 날씨나 계절에 적합한 장소들
`.trim();
}

/**
 * Perplexity API 호출
 */
export async function generatePerplexityCourse(
  request: PerplexityCoursePlanningRequest
): Promise<PerplexityCourseResponse> {
  if (!env.ENABLE_SEARCH_RECOMMENDATIONS) {
    throw new Error('검색 기반 추천 기능이 비활성화되어 있습니다.');
  }

  if (!env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API 키가 설정되지 않았습니다.');
  }

  const systemPrompt = buildPerplexitySystemPrompt(request);
  const userQuery = buildSearchQuery(request);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        return_citations: true,
        search_domain_filter: ['korean'], // 한국 도메인 우선 검색
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const apiResponse: PerplexityAPIResponse = await response.json();
    
    if (!apiResponse.choices || apiResponse.choices.length === 0) {
      throw new Error('Perplexity API 응답이 비어있습니다.');
    }

    const content = apiResponse.choices[0].message.content;
    
    return parsePerplexityResponse(content, apiResponse.citations);

  } catch (error) {
    console.error('Perplexity API 호출 오류:', error);
    throw new Error(`검색 기반 코스 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * Perplexity API 응답 파싱
 */
function parsePerplexityResponse(
  content: string, 
  citations?: string[]
): PerplexityCourseResponse {
  try {
    // JSON 부분만 추출 (마크다운 코드 블록 제거)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('응답에서 JSON을 찾을 수 없습니다.');
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const parsedResponse = JSON.parse(jsonString);

    // 응답 구조 검증
    if (!parsedResponse.searchSummary || !parsedResponse.recommendedCourse) {
      throw new Error('응답 구조가 올바르지 않습니다.');
    }

    return {
      ...parsedResponse,
      citations: citations || []
    } as PerplexityCourseResponse;

  } catch (error) {
    console.error('Perplexity 응답 파싱 오류:', error);
    console.error('원본 응답:', content);
    
    // 파싱 실패 시 기본 응답 반환
    return {
      searchSummary: {
        trendingPlaces: ['검색 정보 파싱 실패'],
        seasonalEvents: [],
        weatherConsiderations: '날씨 정보를 확인할 수 없습니다.'
      },
      recommendedCourse: {
        name: '기본 추천 코스',
        theme: '일반',
        description: '검색 기반 추천을 생성할 수 없어 기본 코스를 제공합니다.',
        reasoning: '응답 파싱 실패로 인한 기본 추천',
        places: [],
        realTimeAdvice: ['검색 정보를 확인할 수 없습니다.']
      },
      citations: citations || []
    };
  }
}

/**
 * 간단한 캐싱을 위한 메모리 저장소
 * 실제 운영에서는 Redis 등을 사용해야 합니다.
 */
const searchCache = new Map<string, {
  response: PerplexityCourseResponse;
  timestamp: number;
}>();

/**
 * 캐시 키 생성
 */
function generateCacheKey(request: PerplexityCoursePlanningRequest): string {
  const key = {
    region: request.contextData.selectedRegion.id,
    date: request.contextData.selectedDate,
    timeSlots: request.contextData.selectedTimeSlots.map(t => t.id).sort(),
    userRequest: request.userRequest,
    interests: request.preferences.interests.sort(),
    budget: request.preferences.budgetRange,
    includeTrends: request.preferences.includeTrends,
    includeReviews: request.preferences.includeReviews
  };
  
  return Buffer.from(JSON.stringify(key)).toString('base64');
}

/**
 * 캐시된 검색 기반 코스 생성 (메모리 캐싱 포함)
 */
export async function generateCachedPerplexityCourse(
  request: PerplexityCoursePlanningRequest
): Promise<PerplexityCourseResponse> {
  const cacheKey = generateCacheKey(request);
  const cachedResult = searchCache.get(cacheKey);
  
  // 캐시된 결과가 있고 아직 유효한 경우
  if (cachedResult) {
    const ageInMinutes = (Date.now() - cachedResult.timestamp) / (1000 * 60);
    if (ageInMinutes < env.SEARCH_CACHE_DURATION) {
      console.log('캐시된 검색 결과 사용:', cacheKey.substring(0, 10) + '...');
      return cachedResult.response;
    } else {
      // 만료된 캐시 제거
      searchCache.delete(cacheKey);
    }
  }

  // 새로운 검색 수행
  const response = await generatePerplexityCourse(request);
  
  // 캐시에 저장
  searchCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  });

  console.log('새로운 검색 결과 캐시:', cacheKey.substring(0, 10) + '...');
  
  return response;
} 