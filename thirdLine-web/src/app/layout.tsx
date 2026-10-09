import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Shell } from '@/components/shell';
import './globals.css';
export const metadata: Metadata = { title: { default: '第三行 | 写下热爱，收藏平凡', template: '%s | 第三行' }, description: '一个记录技术、生活与灵感的个人博客。分享思考，收藏日常，在文字中相遇。' };
const themeScript = `(function(){try{var t=localStorage.getItem('thirdline.theme.v1');document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch(e){}})()`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }}/></head><body><Providers><Shell>{children}</Shell></Providers></body></html>; }
