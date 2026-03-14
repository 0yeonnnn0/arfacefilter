'use client';

import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback } from 'react';

const ARScene = dynamic(
  () => import('@/components/ARScene/ARScene').then((mod) => mod.ARScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70">로딩 중...</p>
        </div>
      </div>
    ),
  }
);

function ARPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const model = params.get('model') || 'cat';
  const modelPath = `/models/${model}.glb`;

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return <ARScene modelPath={modelPath} onBack={handleBack} />;
}

export default function ARPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <ARPageInner />
    </Suspense>
  );
}
