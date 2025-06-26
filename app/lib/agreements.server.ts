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
  
  // 기존 동의 정보 조회
  const currentAgreements = await getUserAgreements(request)
  
  const now = new Date().toISOString()
  const updateData: Omit<UserAgreement, 'id' | 'created_at'> = {
    user_id: user.id,
    terms_agreed: agreements.terms_agreed ?? currentAgreements?.terms_agreed ?? false,
    privacy_agreed: agreements.privacy_agreed ?? currentAgreements?.privacy_agreed ?? false,
    marketing_agreed: agreements.marketing_agreed ?? currentAgreements?.marketing_agreed ?? false,
    // 기존 동의 시점 보존
    terms_agreed_at: currentAgreements?.terms_agreed_at ?? null,
    privacy_agreed_at: currentAgreements?.privacy_agreed_at ?? null,
    marketing_agreed_at: currentAgreements?.marketing_agreed_at ?? null,
    updated_at: now,
  }
  
  // 새로 동의한 항목만 동의 시간 업데이트
  if (agreements.terms_agreed === true && !currentAgreements?.terms_agreed) {
    updateData.terms_agreed_at = now
  }
  if (agreements.privacy_agreed === true && !currentAgreements?.privacy_agreed) {
    updateData.privacy_agreed_at = now
  }
  if (agreements.marketing_agreed === true && !currentAgreements?.marketing_agreed) {
    updateData.marketing_agreed_at = now
  }
  
  // 동의 철회 시 동의 시점 제거
  if (agreements.marketing_agreed === false) {
    updateData.marketing_agreed_at = null
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
  
  // 기존 필수 동의 정보는 유지하면서 마케팅 동의만 변경
  return upsertUserAgreements(request, {
    terms_agreed: currentAgreements?.terms_agreed ?? true,
    privacy_agreed: currentAgreements?.privacy_agreed ?? true,
    marketing_agreed: newMarketingAgreed
  })
} 