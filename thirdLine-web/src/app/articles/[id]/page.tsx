import ArticleDetail from '@/components/article-detail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ArticleDetail id={id}/>; }
