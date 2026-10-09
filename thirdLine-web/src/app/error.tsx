'use client';
import { State } from '@/components/ui';
export default function ErrorPage({ reset }: { reset: () => void }) { return <State error={new Error('页面暂时遇到问题，请重新加载。')} retry={reset}/>; }
