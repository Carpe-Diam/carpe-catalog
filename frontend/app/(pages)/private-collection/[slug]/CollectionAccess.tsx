"use client";

import { useState } from "react";
import { accessPrivateCollection } from "@/lib/strapiClient";
import DisplayCard from "@/components/custom/DisplayCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";

interface CollectionAccessProps {
    slug: string;
}

export default function CollectionAccess({ slug }: CollectionAccessProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [collection, setCollection] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await accessPrivateCollection(slug, password);
            setCollection(data);
        } catch (err: any) {
            setError(err.message || "Failed to access collection");
        } finally {
            setLoading(false);
        }
    };

    if (collection) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-serif font-bold mb-2">{collection.Title}</h1>
                    {/* Add description if available in the future */}
                </div>

                {collection.products && collection.products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {collection.products.map((product: any) => (
                            <DisplayCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-12">
                        No products found in this collection.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-stone-100">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 mb-4">
                        <Lock className="w-6 h-6 text-stone-600" />
                    </div>
                    <h2 className="text-2xl font-serif font-semibold text-stone-900">
                        Private Collection
                    </h2>
                    <p className="text-stone-500 mt-2">
                        This collection is password protected. Please enter the password to view.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Accessing...
                            </>
                        ) : (
                            "View Collection"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
