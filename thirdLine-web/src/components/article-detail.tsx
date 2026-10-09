'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ShareNetwork, BookmarkSimple } from '@phosphor-icons/react';
import { date, safeUrl } from '@/lib/api';
import { Loading, State, Cover } from './ui';
import type { Article } from '@/lib/types';
export default function ArticleDetail({ id }: { id: string }) {
 const { data: a, error, mutate } = useSWR<Article>(`/user/article/${id}`); const [html, setHtml] = useState(''); const [toc, setToc] = useState<{ id: string; text: string }[]>([]); const [saved, setSaved] = useState(false); const [message, setMessage] = useState('');
 useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem('thirdline.bookmarks.v1') || '[]').includes(id)); } catch {} }, [id]);
 useEffect(() => { if (a?.content && /<\/?[a-z][\s\S]*>/i.test(a.content)) { const doc = new DOMParser().parseFromString(DOMPurify.sanitize(a.content, { FORBID_TAGS: ['style', 'iframe', 'form'], FORBID_ATTR: ['style'] }), 'text/html'); doc.querySelectorAll('a').forEach(el => { const href = safeUrl(el.getAttribute('href') || ''); if (href) { el.setAttribute('href', href); el.setAttribute('rel', 'noopener noreferrer'); } else el.removeAttribute('href'); }); doc.querySelectorAll('img').forEach(el => { const src = safeUrl(el.getAttribute('src') || ''); if (src) el.setAttribute('src', src); else el.remove(); }); setHtml(doc.body.innerHTML); } }, [a?.content]);
 useEffect(() => { const timer = setTimeout(() => { setToc(Array.from(document.querySelectorAll('.prose h1, .prose h2, .prose h3')).map((el, i) => { el.id = `heading-${i}`; return { id: el.id, text: el.textContent || '' }; })); }, 0); return () => clearTimeout(timer); }, [a, html]);
 function bookmark() { try { const list: string[] = JSON.parse(localStorage.getItem('thirdline.bookmarks.v1') || '[]'); localStorage.setItem('thirdline.bookmarks.v1', JSON.stringify(saved ? list.filter(v => v !== id) : [...list, id])); setSaved(!saved); setMessage(saved ? '已取消本地收藏' : '已收藏到当前浏览器'); } catch { setMessage('浏览器存储不可用，无法收藏'); } }
 async function share() { try { if (navigator.share) await navigator.share({ title: a?.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); setMessage('文章链接已复制'); } } catch { setMessage('分享未完成，可以复制地址栏中的链接'); } }
 if (error) return <State error={error} retry={() => mutate()}/>; if (!a) return <Loading/>;
 const isHtml = /<\/?[a-z][\s\S]*>/i.test(a.content || '');
 return <><Link href="/articles" className="read-link"><ArrowLeft size={17}/> 返回文章</Link><header className="article-header"><div className="meta"><span>{a.categoryName || '随笔'}</span><time>{date(a.publishedTime || a.createdTime)}</time><span>{a.isOriginal === 0 ? '转载' : '原创'}</span></div><h1>{a.title}</h1><p>{a.summary}</p><div className="article-author">{a.authorName || '站主'} <span>约 {Math.max(1, Math.ceil((a.content?.replace(/<[^>]+>/g, '').length || 0) / 400))} 分钟阅读</span></div>{a.coverImage ? <Cover src={a.coverImage} alt={a.title}/> : null}</header><div className="reading-layout"><article className="prose">{isHtml ? html ? <div dangerouslySetInnerHTML={{ __html: html }}/> : <Loading/> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.content || '正文暂时为空。'}</ReactMarkdown>}<div className="article-end"><span>感谢你读到这里。</span><div className="tags">{a.tags?.map(t => <Link key={t.id} href={`/articles?tagId=${t.id}`}>#{t.name}</Link>)}</div><div className="actions"><button className="button secondary" onClick={bookmark}><BookmarkSimple weight={saved ? 'fill' : 'regular'} size={18}/>{saved ? '已收藏' : '本地收藏'}</button><button className="button secondary" onClick={share}><ShareNetwork size={18}/>分享文章</button></div>{message ? <p role="status">{message}</p> : null}</div></article><aside className="toc"><h3>本篇目录</h3>{toc.length ? toc.map(item => <a key={item.id} href={`#${item.id}`}>{item.text}</a>) : <p className="muted">这一篇，适合从头慢慢读。</p>}</aside></div></>;
}
