import { redirect } from 'next/navigation';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/product?id=${encodeURIComponent(id)}`);
}
