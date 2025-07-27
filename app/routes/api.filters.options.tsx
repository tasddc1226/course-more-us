import { json, type LoaderFunction } from "@remix-run/node";
import { createClient } from "~/lib/supabase.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const supabase = createClient(request);
    
    // 사용 가능한 카테고리 조회
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    // 사용 가능한 태그 조회
    const { data: tags } = await supabase
      .from('tags')
      .select('name')
      .order('usage_count', { ascending: false })
      .limit(50);
    
    // 필터 옵션 구성
    const filterOptions = {
      categories: categories || [],
      themes: [
        { value: 'romantic', label: '로맨틱' },
        { value: 'activity', label: '액티비티' },
        { value: 'culture', label: '문화' },
        { value: 'food', label: '맛집' },
        { value: 'nature', label: '자연' }
      ],
      timeSlots: [
        { value: 'weekday_morning', label: '평일 오전' },
        { value: 'weekday_afternoon', label: '평일 오후' },
        { value: 'weekday_evening', label: '평일 저녁' },
        { value: 'weekend_morning', label: '주말 오전' },
        { value: 'weekend_afternoon', label: '주말 오후' },
        { value: 'weekend_evening', label: '주말 저녁' }
      ],
      priceRanges: [
        { min: 0, max: 20000, label: '2만원 이하' },
        { min: 20000, max: 50000, label: '2-5만원' },
        { min: 50000, max: 100000, label: '5-10만원' },
        { min: 100000, max: null, label: '10만원 이상' }
      ],
      groupSizes: [
        { value: 2, label: '2명' },
        { value: 4, label: '4명' },
        { value: 6, label: '6명' },
        { value: 10, label: '10명' },
        { value: 20, label: '20명 이상' }
      ],
      accessibilityOptions: [
        { value: 'wheelchairAccess', label: '휠체어 접근 가능' },
        { value: 'parkingRequired', label: '주차 필요' },
        { value: 'publicTransportOnly', label: '대중교통만 이용' },
        { value: 'elevatorRequired', label: '엘리베이터 필요' }
      ]
    };
    
    return json({ filterOptions });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
};