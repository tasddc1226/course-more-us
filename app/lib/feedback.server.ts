import { createSupabaseServerClient } from './supabase.server'
import { getUser } from './auth.server'

export type FeedbackType = 'like' | 'dislike' | 'visited'

export interface UserFeedback {
  id: number
  user_id: string
  place_id: number
  feedback_type: FeedbackType
  created_at: string
  updated_at: string
}

// 피드백 생성 또는 업데이트 (토글 방식)
export async function toggleFeedback(
  request: Request,
  placeId: number,
  feedbackType: FeedbackType
): Promise<{ success: boolean; action: 'created' | 'deleted' }> {
  const user = await getUser(request)
  if (!user) throw new Error('인증이 필요합니다')

  const supabase = createSupabaseServerClient(request)
  
  // 기존 피드백 확인
  const { data: existingFeedback, error: selectError } = await supabase
    .from('user_recommendation_feedback')
    .select('*')
    .eq('user_id', user.id)
    .eq('place_id', placeId)
    .eq('feedback_type', feedbackType)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    throw selectError
  }

  if (existingFeedback) {
    // 기존 피드백이 있으면 삭제 (토글 off)
    const { error: deleteError } = await supabase
      .from('user_recommendation_feedback')
      .delete()
      .eq('id', existingFeedback.id)

    if (deleteError) throw deleteError
    return { success: true, action: 'deleted' }
  } else {
    // 기존 피드백이 없으면 생성 (토글 on)
    const { error: insertError } = await supabase
      .from('user_recommendation_feedback')
      .insert({
        user_id: user.id,
        place_id: placeId,
        feedback_type: feedbackType
      })

    if (insertError) throw insertError
    return { success: true, action: 'created' }
  }
}

// 여러 장소에 대한 사용자 피드백 일괄 조회 (메인 페이지용)
export async function getUserFeedbacksForPlaces(
  request: Request,
  placeIds: number[]
): Promise<Record<number, UserFeedback[]>> {
  const user = await getUser(request)
  if (!user) return {}

  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('user_recommendation_feedback')
    .select('*')
    .eq('user_id', user.id)
    .in('place_id', placeIds)

  if (error) throw error
  
  // 장소 ID별로 그룹화
  const feedbackByPlace: Record<number, UserFeedback[]> = {}
  
  if (data) {
    for (const feedback of data) {
      if (!feedbackByPlace[feedback.place_id]) {
        feedbackByPlace[feedback.place_id] = []
      }
      feedbackByPlace[feedback.place_id].push(feedback)
    }
  }
  
  return feedbackByPlace
}
