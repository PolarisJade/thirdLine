import { Suspense } from 'react';
import Feed from '@/components/feed';
import { Loading } from '@/components/ui';
export default function Page() { return <Suspense fallback={<Loading/>}><Feed mode="archive"/></Suspense>; }
