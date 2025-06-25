import { createSupabaseServerClient } from './supabase.server';
import { requireAuth } from './auth.server';

export type UserProfile = {
  id: string;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateProfileData = {
  nickname?: string;
  bio?: string;
  avatar_url?: string;
};

/**
 * 사용자 프로필 조회
 */
export async function getUserProfile(request: Request): Promise<UserProfile | null> {
  const { user } = await requireAuth(request);
  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  request: Request, 
  profileData: UpdateProfileData
): Promise<UserProfile> {
  const { user } = await requireAuth(request);
  const supabase = createSupabaseServerClient(request);

  // 닉네임 중복 확인
  if (profileData.nickname) {
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('nickname', profileData.nickname)
      .neq('id', user.id)
      .single();

    if (existingProfile) {
      throw new Error('이미 사용 중인 닉네임입니다.');
    }
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(profileData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw new Error('프로필 업데이트 중 오류가 발생했습니다.');
  }

  return data;
}

/**
 * 닉네임 사용 가능 여부 확인
 */
export async function isNicknameAvailable(
  request: Request, 
  nickname: string
): Promise<boolean> {
  const { user } = await requireAuth(request);
  const supabase = createSupabaseServerClient(request);

  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('nickname', nickname)
    .neq('id', user.id)
    .single();

  return !data; // 데이터가 없으면 사용 가능
}

/**
 * 사용자 닉네임 조회 (다른 사용자들이 볼 수 있는 정보)
 */
export async function getUserDisplayName(userId: string, request: Request): Promise<string> {
  const supabase = createSupabaseServerClient(request);

  const { data } = await supabase
    .from('user_profiles')
    .select('nickname')
    .eq('id', userId)
    .single();

  return data?.nickname || '사용자';
} 