'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { ArrowUpRight, Leaf, List, Moon, Sun, MagnifyingGlass, X, MusicNote, SkipForward } from '@phosphor-icons/react';
import { useAuth } from './providers';
import { safeUrl } from '@/lib/api';
import type { Music, Profile } from '@/lib/types';
const links = [['/', '首页'], ['/articles', '文章'], ['/archive', '归档'], ['/album', '相册'], ['/portfolio', '作品'], ['/danmaku', '弹幕'], ['/about', '关于']];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const [menu, setMenu] = useState(false); const [dark, setDark] = useState(false); const { user } = useAuth();
  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
  useEffect(() => { setMenu(false); }, [path]);
  function toggle() { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'; try { localStorage.setItem('thirdline.theme.v1', next ? 'dark' : 'light'); } catch {} }
  return <><a className="skip-link" href="#main">跳转到内容</a><header className="site-header"><div className="header-inner"><Link href="/" className="brand"><Leaf size={28} weight="duotone"/><span>第三行<small>THIRD LINE</small></span></Link><nav aria-label="主导航" className={menu ? 'nav open' : 'nav'}>{links.map(([href, label]) => <Link key={href} className={path === href || (href === '/articles' && path.startsWith('/articles/')) ? 'active' : ''} href={href}>{label}</Link>)}</nav><div className="header-actions"><Link className="icon-button" href="/search" aria-label="搜索文章"><MagnifyingGlass size={21}/></Link><button className="icon-button" onClick={toggle} aria-label={dark ? '切换浅色主题' : '切换暗色主题'}>{dark ? <Sun size={21}/> : <Moon size={21}/>}</button><Link className="login-link" href={user ? '/account' : '/auth'}>{user ? user.nickname || user.username : '登录'}</Link><button className="icon-button menu-button" aria-label={menu ? '关闭导航' : '打开导航'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={23}/> : <List size={23}/>}</button></div></div></header><main id="main" className="main-container">{children}</main><Footer/><Player/></>;
}
function Footer() { const { data } = useSWR<Profile>('/user/site/profile'); return <footer className="site-footer"><div><Link className="footer-brand" href="/">第三行</Link><p>写下热爱，也收藏平凡。</p></div><div className="footer-right"><Link href="/about">关于这个小站 <ArrowUpRight size={14}/></Link><small>© {new Date().getFullYear()} {data?.nickname || '第三行'}{data?.startTime ? ` · 始于 ${data.startTime.slice(0, 4)}` : ''}</small></div></footer>; }
function Player() { const { data } = useSWR<Music[]>('/user/music/list'); const [index, setIndex] = useState(0); const [open, setOpen] = useState(false); const [error, setError] = useState(''); const audio = useRef<HTMLAudioElement>(null); const track = data?.[index]; if (!track) return null; return <aside className={`music-player ${open ? 'expanded' : ''}`} aria-label="音乐播放器"><button className="icon-button" aria-label={open ? '收起播放器' : '打开播放器'} onClick={() => setOpen(!open)}><MusicNote size={23}/></button>{open ? <div><strong>{track.title}</strong><small>{track.artist || '未知艺术家'}</small><audio ref={audio} controls preload="none" src={safeUrl(track.audioUrl)} onError={() => setError('这首音乐暂时无法播放')} onEnded={() => setIndex((index + 1) % data!.length)}/>{error ? <small role="status">{error}</small> : null}<button className="text-button" onClick={() => { setIndex((index + 1) % data!.length); setError(''); }}>下一首 <SkipForward size={16}/></button></div> : null}</aside>; }
