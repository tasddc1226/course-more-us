import { json, type ActionFunctionArgs } from '@remix-run/node'
import { supabaseAdmin } from '~/lib/supabase.server'
import { isValidEmail } from '~/utils/validation'

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  const formData = await request.formData()
  const email = formData.get('email') as string

  if (!email) {
    return json({ error: '이메일을 입력해주세요.' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return json({ error: '올바른 이메일 형식을 입력해주세요.' }, { status: 400 })
  }

  try {
    // 관리자 권한으로 이메일 중복 확인
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Email check error:', error)
      return json({ error: '이메일 확인 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 해당 이메일이 이미 존재하는지 확인
    const existingUser = users.users.find(user => user.email === email)

    if (existingUser) {
      return json({ 
        available: false, 
        message: '이미 사용 중인 이메일입니다.' 
      })
    }

    return json({ 
      available: true, 
      message: '사용 가능한 이메일입니다.' 
    })

  } catch (error) {
    console.error('Email check error:', error)
    return json({ error: '이메일 확인 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 