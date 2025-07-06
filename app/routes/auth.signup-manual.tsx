import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, Link } from '@remix-run/react'
import { supabaseAdmin } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { ROUTES } from '~/constants/routes'
import { isValidEmail, isValidPassword } from '~/utils/validation'

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
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password || !confirmPassword) {
    return json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return json({ error: '올바른 이메일 형식을 입력해주세요.' }, { status: 400 })
  }

  if (!isValidPassword(password)) {
    return json({ error: '비밀번호는 8자 이상이며, 대소문자와 숫자를 포함해야 합니다.' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  try {
    // 관리자 권한으로 사용자 생성 (이메일 인증 없이)
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 인증 완료로 설정
    })

    if (error) {
      console.error('Manual signup error:', error)
      return json({ error: error.message }, { status: 400 })
    }

    return json({ 
      success: '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.',
      email 
    })
  } catch (error) {
    console.error('Manual signup error:', error)
    return json({ error: '회원가입 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export default function SignupManual() {
  const actionData = useActionData<typeof action>()

  return (
    <AuthLayout
      title="회원가입 (수동)"
      subtitle="이메일 인증 없이 즉시 회원가입"
    >
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ 테스트용 페이지:</strong> 이메일 인증 없이 즉시 회원가입됩니다.
        </p>
      </div>

      <Form className="space-y-6" method="post">
        <div className="space-y-4">
          <Input
            name="email"
            type="email"
            required
            placeholder="이메일 주소"
            label="이메일"
          />
          
          <Input
            name="password"
            type="password"
            required
            placeholder="비밀번호 (8자 이상, 대소문자+숫자)"
            label="비밀번호"
            helperText="8자 이상, 대소문자와 숫자를 포함해야 합니다"
          />
          
          <Input
            name="confirmPassword"
            type="password"
            required
            placeholder="비밀번호 확인"
            label="비밀번호 확인"
          />
        </div>

        {actionData && 'error' in actionData && (
          <ErrorMessage message={actionData.error} />
        )}

        {actionData && 'success' in actionData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{actionData.success}</p>
            <Link 
              to={ROUTES.LOGIN}
              className="inline-block mt-2 text-sm text-green-600 hover:text-green-500 underline"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
        >
          즉시 회원가입
        </Button>
      </Form>

      <div className="mt-6 text-center">
        <Link
          to={ROUTES.SIGNUP}
          className="text-sm text-purple-600 hover:text-purple-500"
        >
          일반 회원가입으로 돌아가기
        </Link>
      </div>
    </AuthLayout>
  )
} 