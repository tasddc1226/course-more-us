import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useSubmit } from "@remix-run/react";
import { requireAdmin, getAllUsers, updateUserRole, deleteUser, getUserStats } from "~/lib/admin.server";
import { Button } from "~/components/ui";
import { PageHeader } from "~/components/common";
import { ROUTES } from "~/constants/routes";
import { formatDate } from "~/utils/date";

export const meta: MetaFunction = () => {
  return [
    { title: "유저 관리 - 코스모스 관리자" },
    { name: "description", content: "모든 유저를 관리하는 관리자 페이지" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAdmin(request);
  const [users, stats] = await Promise.all([
    getAllUsers(request),
    getUserStats(request)
  ]);
  
  return json({ 
    currentUser: user,
    users,
    stats
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const userId = formData.get('userId') as string;

  try {
    switch (action) {
      case 'updateRole': {
        const newRole = formData.get('role') as 'admin' | 'user';
        await updateUserRole(request, userId, newRole);
        return json({ success: true, message: '사용자 역할이 업데이트되었습니다.' });
      }
      case 'deleteUser': {
        await deleteUser(request, userId);
        return json({ success: true, message: '사용자가 삭제되었습니다.' });
      }
      default:
        return json({ error: '잘못된 액션입니다.' }, { status: 400 });
    }
  } catch (error) {
    // Error handling without console.log
    console.error(error);
    return json({ error: '작업 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export default function AdminUsers() {
  const { currentUser, users, stats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
    if (userId === currentUser.id && newRole !== 'admin') {
      alert('자신의 관리자 권한은 제거할 수 없습니다.');
      return;
    }
    
    const formData = new FormData();
    formData.append('action', 'updateRole');
    formData.append('userId', userId);
    formData.append('role', newRole);
    submit(formData, { method: 'post' });
  };

  const handleDeleteUser = (userId: string, userEmail: string) => {
    if (userId === currentUser.id) {
      alert('자신의 계정은 삭제할 수 없습니다.');
      return;
    }
    
    if (confirm(`정말로 ${userEmail} 사용자를 삭제하시겠습니까?`)) {
      const formData = new FormData();
      formData.append('action', 'deleteUser');
      formData.append('userId', userId);
      submit(formData, { method: 'post' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="유저 관리"
        backLink={{
          to: ROUTES.ADMIN,
          text: "관리자 대시보드"
        }}
        rightContent={
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">관리자: {currentUser.email}</span>
            <Form method="post" action={ROUTES.LOGOUT}>
              <Button type="submit" variant="danger">
                로그아웃
              </Button>
            </Form>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 알림 메시지 */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {actionData.message}
          </div>
        )}
        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">전체 사용자</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}명</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👑</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">관리자</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.adminUsers}명</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👤</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">일반 사용자</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.regularUsers}명</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 테이블 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              전체 사용자 목록
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              모든 사용자의 정보와 역할을 관리할 수 있습니다.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    내 장소 수
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {(user.user_metadata as Record<string, unknown>)?.avatar_url && typeof (user.user_metadata as Record<string, unknown>).avatar_url === 'string' ? (
                            <img
                              className="h-8 w-8 rounded-full"
                              src={(user.user_metadata as Record<string, unknown>).avatar_url as string}
                              alt=""
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.nickname || (user.user_metadata as Record<string, unknown>)?.full_name as string || user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? '관리자' : '사용자'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(user.created_at || ''))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.placesCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                          disabled={user.id === currentUser.id}
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="user">사용자</option>
                          <option value="admin">관리자</option>
                        </select>
                        <Button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          variant="danger"
                          size="sm"
                          disabled={user.id === currentUser.id}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 