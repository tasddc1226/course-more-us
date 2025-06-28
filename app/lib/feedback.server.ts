import { createSupabaseServerClient } from './supabase.server'
import { getUser } from './auth.server'
import type { Tables, TablesInsert } from '~/types/database.types'

export type FeedbackType = 'like' | 'dislike' | 'visited'
export type UserFeedback = Tables<'user_recommendation_feedback'>

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

// 개발자 피드백 저장
export async function createUserFeedback(
  request: Request,
  content: string,
  feedbackType: 'general' | 'bug_report' | 'feature_request' | 'improvement' = 'general',
  title?: string
): Promise<Tables<'user_feedback'>> {
  const user = await getUser(request)
  if (!user) {
    throw new Error('인증이 필요합니다')
  }

  const supabase = createSupabaseServerClient(request)

  const feedbackData: TablesInsert<'user_feedback'> = {
    user_id: user.id,
    feedback_type: feedbackType,
    title: title || null,
    content: content.trim(),
    status: 'pending',
    priority: 'medium'
  }

  const { data, error } = await supabase
    .from('user_feedback')
    .insert(feedbackData)
    .select()
    .single()

  if (error) {
    console.error('Database feedback error:', error)
    throw new Error('피드백 저장 중 오류가 발생했습니다')
  }

  return data
}

// 사용자 피드백 목록 조회
export async function getUserFeedbacks(
  request: Request
): Promise<Tables<'user_feedback'>[]> {
  const user = await getUser(request)
  if (!user) {
    throw new Error('인증이 필요합니다')
  }

  const supabase = createSupabaseServerClient(request)

  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get user feedbacks error:', error)
    throw new Error('피드백 조회 중 오류가 발생했습니다')
  }

  return data || []
}
