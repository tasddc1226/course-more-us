import { env } from "~/config/env";
import type {
  PerplexityCoursePlanningRequest,
  PerplexityCourseResponse,
  PerplexityAPIResponse
} from "~/types/perplexity";

/**
 * Perplexity API 기반 데이트 코스 생성 서비스
 */

/*
 * TODO: Re-enable when needed for enhanced course planning
 * System prompt template function temporarily disabled
 
function buildPerplexitySystemPrompt(request: PerplexityCoursePlanningRequest): string {
  // Function body commented out
}
*/

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

  const userQuery = buildSearchQuery(request);

  const requestBody = {
    model: 'sonar', // 최신 Perplexity Sonar 모델
    messages: [
      {
        role: 'user',
        content: `${userQuery}\n\n위 요청을 바탕으로 한국의 데이트 코스를 다음 JSON 형태로 추천해주세요:
{
  "recommendedCourse": {
    "name": "코스명",
    "description": "코스 설명",
    "places": [
      {
        "name": "장소명",
        "category": "카테고리",
        "timeSlot": "시간대",
        "duration": 90
      }
    ]
  }
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000, // JSON 응답을 위해 토큰 수 증가
    return_citations: true, // Sonar 모델은 citations 지원
  };



  try {
    // AbortController로 타임아웃 설정 (30초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'CourseMoreUs/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId); // 응답 받으면 타임아웃 해제

    console.log('📥 API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ API 에러 응답 본문:', errorBody);
      
      // 상세한 에러 메시지 제공
      let errorMessage = `Perplexity API 호출 실패: ${response.status} ${response.statusText}`;
      if (errorBody) {
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.error?.message) {
            errorMessage += ` - ${errorJson.error.message}`;
          }
        } catch {
          errorMessage += ` - ${errorBody.substring(0, 200)}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const apiResponse: PerplexityAPIResponse = await response.json();
    console.log('✅ API 응답 받음:', {
      choices: apiResponse.choices?.length || 0,
      citations: apiResponse.citations?.length || 0
    });
    
    if (!apiResponse.choices || apiResponse.choices.length === 0) {
      throw new Error('Perplexity API 응답이 비어있습니다.');
    }

    const content = apiResponse.choices[0].message.content;
    console.log('📝 응답 내용 길이:', content.length, 'chars');
    
    return parsePerplexityResponse(content, apiResponse.citations);

  } catch (error) {
    console.error('❌ Perplexity API 호출 오류:', error);
    
    // 네트워크 에러와 API 에러 구분
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('네트워크 연결 오류: Perplexity API에 연결할 수 없습니다.');
    }
    
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
    console.log('🔍 파싱할 JSON:', jsonString.substring(0, 200) + '...');
    
    const parsedResponse = JSON.parse(jsonString);

    // recommendedCourse만 필수로 검증 (searchSummary는 선택사항)
    if (!parsedResponse.recommendedCourse) {
      throw new Error('recommendedCourse가 응답에 없습니다.');
    }

    // searchSummary가 없으면 기본값 생성
    const searchSummary = parsedResponse.searchSummary || {
      trendingPlaces: ['실시간 검색 기반 추천'],
      seasonalEvents: [],
      weatherConsiderations: '계절 고려사항 포함됨'
    };

    // recommendedCourse 구조 보완
    const recommendedCourse = {
      name: parsedResponse.recommendedCourse.name || '🤖 AI 추천 코스',
      theme: parsedResponse.recommendedCourse.theme || '맞춤형',
      description: parsedResponse.recommendedCourse.description || '실시간 검색으로 생성된 맞춤 데이트 코스입니다.',
      reasoning: parsedResponse.recommendedCourse.reasoning || 'AI 검색 기반 추천',
      places: parsedResponse.recommendedCourse.places || [],
      realTimeAdvice: parsedResponse.recommendedCourse.realTimeAdvice || []
    };

    console.log('✅ 파싱 성공 - 코스명:', recommendedCourse.name);
    console.log('✅ 장소 수:', recommendedCourse.places.length);

    return {
      searchSummary,
      recommendedCourse,
      citations: citations || []
    } as PerplexityCourseResponse;

  } catch (error) {
    console.error('❌ Perplexity 응답 파싱 오류:', error);
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
  console.log('🤖 AI 데이트 코스 생성 요청 시작');
  console.log('사용자 요청:', request.userRequest);
  console.log('지역:', request.contextData.selectedRegion.name);
  
  const cacheKey = generateCacheKey(request);
  const cachedResult = searchCache.get(cacheKey);
  
  // 캐시된 결과가 있고 아직 유효한 경우
  if (cachedResult) {
    const ageInMinutes = (Date.now() - cachedResult.timestamp) / (1000 * 60);
    if (ageInMinutes < env.SEARCH_CACHE_DURATION) {
      console.log('✅ 캐시된 검색 결과 사용:', cacheKey.substring(0, 10) + '...');
      return cachedResult.response;
    } else {
      // 만료된 캐시 제거
      searchCache.delete(cacheKey);
    }
  }

  console.log('🔍 Perplexity API 호출 시작...');
  
  // 새로운 검색 수행
  const response = await generatePerplexityCourse(request);
  
  console.log('✅ Perplexity API 호출 완료');
  console.log('코스명:', response.recommendedCourse.name);
  
  // 캐시에 저장
  searchCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  });

  console.log('💾 새로운 검색 결과 캐시 저장:', cacheKey.substring(0, 10) + '...');
  
  return response;
} 