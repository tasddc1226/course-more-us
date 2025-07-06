import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { supabaseAdmin } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { ROUTES } from '~/constants/routes'
import { isValidEmail } from '~/utils/validation'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (user) {
    return redirect('/')
  }
  
  return json({})
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const email = formData.get('email') as string

  if (!email) {
    return json({ error: '이메일을 입력해주세요.' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return json({ error: '올바른 이메일 형식을 입력해주세요.' }, { status: 400 })
  }

  try {
    // 관리자 권한으로 사용자 찾기
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('List users error:', listError)
      return json({ error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return json({ error: '해당 이메일로 가입된 사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 인증된 사용자인지 확인
    if (user.email_confirmed_at) {
      return json({ 
        success: '이미 이메일 인증이 완료된 사용자입니다.',
        redirectToLogin: true 
      })
    }

    // 관리자 권한으로 이메일 인증 완료 처리
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        email_confirm: true,
      }
    )

    if (updateError) {
      console.error('Manual verification error:', updateError)
      return json({ error: '이메일 인증 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return json({ 
      success: `${email} 이메일 인증이 완료되었습니다! 이제 로그인할 수 있습니다.`,
      redirectToLogin: true 
    })

  } catch (error) {
    console.error('Manual verification error:', error)
    return json({ error: '이메일 인증 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export default function ManualVerifyPage() {
  const actionData = useActionData<typeof action>()

  return (
    <AuthLayout
      title="수동 이메일 인증"
      subtitle="개발용: 이메일 인증을 수동으로 완료"
    >
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ 개발용 페이지:</strong> 이메일 인증을 수동으로 완료합니다.
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          이미 회원가입된 이메일의 인증 상태를 활성화합니다.
        </p>
      </div>

      <Form className="space-y-6" method="post">
        <Input
          name="email"
          type="email"
          required
          placeholder="인증할 이메일 주소"
          label="이메일"
          helperText="이미 회원가입된 이메일을 입력해주세요"
        />

        {actionData && 'error' in actionData && (
          <ErrorMessage message={actionData.error} />
        )}

        {actionData && 'success' in actionData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{actionData.success}</p>
            {actionData.redirectToLogin && (
              <a 
                href={ROUTES.LOGIN}
                className="inline-block mt-2 text-sm text-green-600 hover:text-green-500 underline"
              >
                로그인 페이지로 이동
              </a>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
        >
          이메일 인증 완료 처리
        </Button>
      </Form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <a
          href={ROUTES.VERIFY_EMAIL}
          className="block text-purple-600 hover:text-purple-500"
        >
          일반 이메일 인증으로 돌아가기
        </a>
        <a
          href={ROUTES.LOGIN}
          className="block text-gray-600 hover:text-gray-500"
        >
          로그인 페이지로 이동
        </a>
      </div>
    </AuthLayout>
  )
} 