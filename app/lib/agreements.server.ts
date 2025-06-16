import { requireAuth } from './auth.server'
import { supabaseAdmin } from './supabase.server'

export interface UserAgreement {
  id: number
  user_id: string
  terms_agreed: boolean
  privacy_agreed: boolean
  marketing_agreed: boolean
  terms_agreed_at: string | null
  privacy_agreed_at: string | null
  marketing_agreed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AgreementUpdate {
  terms_agreed?: boolean
  privacy_agreed?: boolean
  marketing_agreed?: boolean
}

// 사용자 동의 정보 조회
export async function getUserAgreements(request: Request): Promise<UserAgreement | null> {
  const { user, supabase } = await requireAuth(request)
  
  const { data, error } = await supabase
    .from('user_agreements')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    throw new Error('동의 정보 조회 실패: ' + error.message)
  }
  
  return data
}

// 사용자 동의 정보 생성 또는 업데이트
export async function upsertUserAgreements(
  request: Request, 
  agreements: AgreementUpdate
): Promise<UserAgreement> {
  const { user } = await requireAuth(request)
  
  const now = new Date().toISOString()
  const updateData: Omit<UserAgreement, 'id' | 'created_at'> = {
    user_id: user.id,
    terms_agreed: agreements.terms_agreed ?? false,
    privacy_agreed: agreements.privacy_agreed ?? false,
    marketing_agreed: agreements.marketing_agreed ?? false,
    terms_agreed_at: null,
    privacy_agreed_at: null,
    marketing_agreed_at: null,
    updated_at: now,
  }
  
  // 동의 시간 설정
  if (agreements.terms_agreed === true) {
    updateData.terms_agreed_at = now
  }
  if (agreements.privacy_agreed === true) {
    updateData.privacy_agreed_at = now
  }
  if (agreements.marketing_agreed === true) {
    updateData.marketing_agreed_at = now
  }
  
  const { data, error } = await supabaseAdmin
    .from('user_agreements')
    .upsert(updateData, { 
      onConflict: 'user_id',
      ignoreDuplicates: false 
    })
    .select()
    .single()
  
  if (error) {
    throw new Error('동의 정보 저장 실패: ' + error.message)
  }
  
  return data
}

// 최초 가입시 기본 동의 정보 생성
export async function createInitialAgreements(
  request: Request,
  termsAgreed: boolean = true,
  privacyAgreed: boolean = true,
  marketingAgreed: boolean = false
): Promise<UserAgreement> {
  return upsertUserAgreements(request, {
    terms_agreed: termsAgreed,
    privacy_agreed: privacyAgreed,
    marketing_agreed: marketingAgreed
  })
}

// 마케팅 동의 토글
export async function toggleMarketingAgreement(request: Request): Promise<UserAgreement> {
  const currentAgreements = await getUserAgreements(request)
  const newMarketingAgreed = !currentAgreements?.marketing_agreed
  
  return upsertUserAgreements(request, {
    marketing_agreed: newMarketingAgreed
  })
} 