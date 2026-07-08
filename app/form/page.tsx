'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function LeadFormPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [interestedIn, setInterestedIn] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!fullName.trim() || !phone.trim() || !city.trim()) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    // Split Full Name into First and Last Name for API / CRM support
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || ".";

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          city,
          interestedIn: interestedIn.trim() ? [interestedIn.trim()] : [],
          source: "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setCity("");
      setInterestedIn("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit form. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen font-serif text-foreground selection:bg-accent/20 flex flex-col justify-center py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8">
      <div className="max-w-xl mx-auto w-full">
        {/* Breadcrumb */}
        {/* <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Inquiry Form</span>
        </div> */}

        {success ? (
          /* Success Screen */
          <div className="w-full text-center transition-all duration-500 animate-in fade-in zoom-in-95">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-foreground stroke-[1.5]" />
            </div>
            <h2 className="text-3xl font-serif italic mb-6 leading-tight">Thank You</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto mb-8 font-sans">
              Your inquiry has been successfully registered. A dedicated consultant will contact you shortly to guide you on the next steps.
            </p>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setSuccess(false)}
                className="inline-block bg-foreground text-background py-4 px-12 text-xs uppercase tracking-[0.2em] font-medium hover:bg-foreground/90 transition-colors w-auto min-w-[220px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                Submit another request
              </button>
            </div>
          </div>
        ) : (
          /* Lead Form Screen */
          <div className="w-full">
            <div className="mb-10">
              <div className="mb-6 flex justify-center">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <Image
                    src="/cd-logo.svg"
                    alt="Carpe Diam"
                    width={140}
                    height={40}
                    className="w-auto h-8 md:h-10 transition-[filter] duration-500 dark:invert"
                    priority
                    unoptimized
                  />
                </Link>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif italic mb-4 leading-tight">Inquiry</h1>
              <div className="text-muted-foreground text-sm sm:text-base font-sans space-y-1 mb-8">
                <p>Email: <a href="mailto:hello@carpediam.in" className="hover:text-foreground transition-colors underline underline-offset-4">hello@carpediam.in</a></p>
                <p>Call: <a href="tel:+919833403880" className="hover:text-foreground transition-colors underline underline-offset-4">+91 98334 03880</a></p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 border border-destructive/20 bg-destructive/5 text-destructive p-4 mb-8 text-xs font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold uppercase tracking-wider mb-1">Inquiry submission failed</p>
                  <p className="leading-relaxed opacity-90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name field */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                  placeholder="E.g., Charlotte Dupont"
                />
              </div>

              {/* Email Address field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                  placeholder="name@domain.com"
                />
              </div>

              {/* Phone Number field */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              {/* City field */}
              <div className="space-y-2">
                <label htmlFor="city" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  City <span className="text-destructive">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                  placeholder="E.g., Mumbai"
                />
              </div>

              {/* Interested In - Text Input */}
              <div className="space-y-2">
                <label htmlFor="interestedIn" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  Interested In
                </label>
                <input
                  id="interestedIn"
                  type="text"
                  value={interestedIn}
                  onChange={(e) => setInterestedIn(e.target.value)}
                  className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                  placeholder="E.g., Custom Diamond Ring, Emerald Bracelet"
                />
              </div>

              {/* Submit button */}
              <div className="flex justify-start mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-foreground text-background py-4 px-12 uppercase tracking-[0.2em] font-medium text-xs hover:bg-foreground/90 transition-colors w-auto min-w-[220px] rounded-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Inquiry"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
