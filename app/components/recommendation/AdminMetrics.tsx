import type { RecommendationResponse } from "~/lib/recommendation/types";

interface AdminMetricsProps {
  metadata: RecommendationResponse['metadata'];
}

export function AdminMetrics({ metadata }: AdminMetricsProps) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-orange-600">🔧</span>
        <h4 className="font-semibold text-orange-800">관리자 전용 메트릭</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">총 후보</div>
          <div className="text-lg font-bold text-orange-900">{metadata.totalCandidates}개</div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">실행 시간</div>
          <div className="text-lg font-bold text-orange-900">{metadata.executionTime}ms</div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">위치 그룹화</div>
          <div className="text-lg font-bold text-orange-900">{metadata.filteringSteps.afterLocationGrouping}개</div>
          <div className="text-xs text-orange-600">
            -{metadata.totalCandidates - metadata.filteringSteps.afterLocationGrouping}개 병합
          </div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">다양성 필터</div>
          <div className="text-lg font-bold text-orange-900">{metadata.filteringSteps.afterDiversityFilter}개</div>
          <div className="text-xs text-orange-600">
            -{metadata.filteringSteps.afterLocationGrouping - metadata.filteringSteps.afterDiversityFilter}개 제외
          </div>
        </div>
      </div>
      
      <div className="mt-3 p-3 bg-white/60 rounded-lg">
        <div className="text-orange-700 font-medium mb-2">필터링 단계별 변화</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
            초기: {metadata.filteringSteps.initial}
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
            그룹화: {metadata.filteringSteps.afterLocationGrouping}
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
            다양성: {metadata.filteringSteps.afterDiversityFilter}
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
            최종: {metadata.filteringSteps.final}
          </span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-orange-600">
        필터링 효율: {((metadata.filteringSteps.final / metadata.totalCandidates) * 100).toFixed(1)}% 
        (총 {metadata.totalCandidates}개 중 {metadata.filteringSteps.final}개 선별)
      </div>
    </div>
  );
} 