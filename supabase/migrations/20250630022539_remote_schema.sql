drop policy "Authenticated users can insert places" on "public"."places";

drop policy "누구나 장소 정보를 읽을 수 있습니다." on "public"."places";

drop policy "인증된 사용자는 장소를 관리할 수 있습니다." on "public"."places";

drop policy "사용자는 자신의 동의 정보를 관리할 수 있습니" on "public"."user_agreements";

drop policy "서비스 관리자는 모든 동의 정보를 관리할 수 " on "public"."user_agreements";

drop policy "Users can create their own favorites" on "public"."user_favorites";

drop policy "Users can delete their own favorites" on "public"."user_favorites";

drop policy "Users can view their own favorites" on "public"."user_favorites";

drop policy "Admins can read all profiles" on "public"."user_profiles";

drop policy "Users can insert their own profile" on "public"."user_profiles";

drop policy "Users can create their own feedback" on "public"."user_recommendation_feedback";

drop policy "Users can delete their own feedback" on "public"."user_recommendation_feedback";

drop policy "Users can update their own feedback" on "public"."user_recommendation_feedback";

drop policy "Users can view their own feedback" on "public"."user_recommendation_feedback";

drop policy "사용자는 자신의 역할 정보를 볼 수 있습니다." on "public"."user_roles";

drop policy "서비스 관리자는 모든 역할을 관리할 수 있습니" on "public"."user_roles";

drop policy "Users can view their own places" on "public"."places";

drop policy "Users can read their own profile" on "public"."user_profiles";

drop function if exists "public"."create_profile_for_existing_users"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  nickname_value text;
BEGIN
  -- 1. user_roles 생성
  BEGIN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user');
  EXCEPTION 
    WHEN OTHERS THEN 
      -- 에러 로그 후 계속 진행
      RAISE NOTICE 'Error creating user role for %: %', NEW.id, SQLERRM;
  END;
  
  -- 2. user_profiles 생성
  BEGIN
    -- nickname 생성
    nickname_value := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- 중복 nickname 방지
    IF EXISTS (SELECT 1 FROM user_profiles WHERE nickname = nickname_value) THEN
      nickname_value := nickname_value || '_' || substring(NEW.id::text from 1 for 8);
    END IF;
    
    INSERT INTO user_profiles (id, nickname, avatar_url)
    VALUES (
      NEW.id,
      nickname_value,
      NEW.raw_user_meta_data->>'avatar_url'
    );
    
  EXCEPTION 
    WHEN OTHERS THEN 
      -- 에러 로그 후 계속 진행
      RAISE NOTICE 'Error creating user profile for %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_regions(search_term text)
 RETURNS TABLE(id integer, name character varying, slug character varying, description text, region_type character varying, parent_name character varying, match_score integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.slug,
    r.description,
    r.region_type,
    p.name as parent_name,
    CASE 
      WHEN r.name ILIKE search_term || '%' THEN 100
      WHEN r.name ILIKE '%' || search_term || '%' THEN 90
      WHEN search_term = ANY(r.search_keywords) THEN 80
      WHEN EXISTS (SELECT 1 FROM unnest(r.search_keywords) k WHERE k ILIKE '%' || search_term || '%') THEN 70
      ELSE 50
    END as match_score
  FROM regions r
  LEFT JOIN regions p ON r.parent_region_id = p.id
  WHERE 
    r.name ILIKE '%' || search_term || '%' 
    OR search_term = ANY(r.search_keywords)
    OR EXISTS (SELECT 1 FROM unnest(r.search_keywords) k WHERE k ILIKE '%' || search_term || '%')
  ORDER BY match_score DESC, r.is_popular DESC, r.display_order ASC;
END;
$function$
;

create policy "Anyone can view active places"
on "public"."places"
as permissive
for select
to public
using ((is_active = true));


create policy "Users can insert their own places"
on "public"."places"
as permissive
for insert
to public
with check (((auth.uid() IS NOT NULL) AND ((source)::text = 'user'::text)));


create policy "Service role can manage all agreements"
on "public"."user_agreements"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can manage their own agreements"
on "public"."user_agreements"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can manage their own favorites"
on "public"."user_favorites"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Allow profile creation"
on "public"."user_profiles"
as permissive
for insert
to public
with check (true);


create policy "Users can manage their own recommendation feedback"
on "public"."user_recommendation_feedback"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Service role can manage all roles"
on "public"."user_roles"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view their own role"
on "public"."user_roles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view their own places"
on "public"."places"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can read their own profile"
on "public"."user_profiles"
as permissive
for select
to public
using (((auth.uid() = id) OR (auth.role() = 'service_role'::text)));



