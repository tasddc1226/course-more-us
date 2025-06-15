export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 개인정보의 처리목적</h2>
              <p>코스모스는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>회원 가입 및 관리</li>
                <li>서비스 제공 및 맞춤형 추천</li>
                <li>고객 문의 응답</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 처리하는 개인정보 항목</h2>
              <p>코스모스는 다음의 개인정보 항목을 처리합니다:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>필수항목: 이메일 주소, 닉네임</li>
                <li>선택항목: 프로필 사진</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 개인정보의 처리 및 보유기간</h2>
              <p>개인정보는 회원 탈퇴 시까지 보유하며, 탈퇴 시 즉시 삭제됩니다.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 개인정보의 제3자 제공</h2>
              <p>코스모스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 개인정보 보호책임자</h2>
              <p>개인정보 보호책임자: 코스모스 개발팀</p>
              <p>연락처: tasddc@naver.com</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 개인정보처리방침 변경</h2>
              <p>이 개인정보처리방침은 2024년 12월 15일부터 적용됩니다.</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              최종 수정일: 2024년 12월 15일
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 