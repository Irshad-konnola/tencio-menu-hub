import { getPublicMenuBySlug } from '../actions/adminActions';
import CustomerMenuClient from './CustomerMenuClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPublicMenuBySlug(slug);
  
  if (!data || !data.cafe) {
    return { title: 'Not Found | MenuHub' };
  }
  
  return {
    title: `${data.cafe.name} | Digital Menu`,
    description: `Explore the digital menu for ${data.cafe.name}.`,
    openGraph: {
      title: `${data.cafe.name} - Digital Menu`,
      description: `Explore the digital menu for ${data.cafe.name}.`,
    }
  };
}

export default async function CafeMenuPage({ params }) {
  const { slug } = await params;
  
  // The server fetches the data instantly before the user even sees the page
  const data = await getPublicMenuBySlug(slug);

  // If the cafe doesn't exist, show the 404 screen instantly
  if (!data || !data.cafe) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-[#111814] mb-4">404</h1>
        <p className="text-neutral-500 font-medium">This menu doesn&apos;t exist.</p>
      </div>
    );
  }

  // Pass the instantly loaded data to the interactive client component
  return <CustomerMenuClient initialData={data} slug={slug} />;
}