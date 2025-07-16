import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseServerClient } from '~/lib/supabase.server';
import { getUserPreferences, updateUserPreferences } from '~/lib/preferences.server';
import { requireAuth } from '~/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, response: authResponse } = await requireAuth(request);
  if (!user) return authResponse;

  const supabase = createSupabaseServerClient(request);
  const preferences = await getUserPreferences(supabase, user.id);

  if (!preferences) {
    return json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }

  return json({ preferences });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { user, response: authResponse } = await requireAuth(request);
  if (!user) return authResponse;

  try {
    const formData = await request.json();
    const supabase = createSupabaseServerClient(request);
    
    const updatedPreferences = await updateUserPreferences(
      supabase,
      user.id,
      formData
    );

    if (!updatedPreferences) {
      return json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return json({ preferences: updatedPreferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}