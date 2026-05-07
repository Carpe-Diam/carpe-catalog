import CollectionAccess from "./CollectionAccess";

export default async function PrivateCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <CollectionAccess slug={slug} />;
}
