import { supabaseAdmin } from './supabase.server'

export async function deleteUserAndData(userId: string, reason: string) {
  // 1. 피드백 저장 (일반 피드백 유형 사용)
  try {
    await supabaseAdmin.from('user_feedback').insert({
      user_id: userId,
      feedback_type: 'general',
      title: 'account_deletion',
      content: reason.slice(0, 1000),
    })
  } catch (e) {
    console.error('피드백 저장 실패:', e)
  }

  // 2. 사용자 관련 보조 테이블 정리 (외래키 cascade 되지 않는 경우 대비)
  try {
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
  } catch (e) {
    console.error('user_roles 삭제 실패:', e)
  }

  // 3. Supabase Auth 사용자 삭제 (연관 테이블 ON DELETE CASCADE)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
}