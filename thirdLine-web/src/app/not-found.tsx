import Link from 'next/link';
export default function NotFound() { return <div className="state"><span className="eyebrow">404</span><h1>这页纸，似乎被风吹走了。</h1><p>回到首页，继续读读别的故事吧。</p><Link className="button" href="/">回到首页</Link></div>; }
