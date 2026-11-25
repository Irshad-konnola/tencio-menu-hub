import { notFound } from 'next/navigation';
import { getPublicMenuBySlug } from '@/app/actions/adminActions';
import CustomerMenuClient from '../CustomerMenuClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPublicMenuBySlug(slug, 'catering');
  if (!data) return { title: 'Catering Menu Not Found | MenuHub', robots: { index: false } };
  const title = `${data.cafe.name} | Catering Menu`;
  const description = `Explore ${data.cafe.name}'s full catering menu with dish details and prices. Enquire about your next event.`;
  const url = `/${encodeURIComponent(slug)}/catering`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CateringMenuPage({ params }) {
  const { slug } = await params;
  const data = await getPublicMenuBySlug(slug, 'catering');
  if (!data) notFound();
  return <CustomerMenuClient initialData={data} slug={slug} mode="catering" />;
}
