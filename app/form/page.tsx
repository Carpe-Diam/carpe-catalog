'use client';

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function LeadFormPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [source, setSource] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const interestOptions = ["Designer Piece", "Custom Piece"];
  const sourceOptions = [
    "Instagram",
    "Facebook",
    "Google Search",
    "Exhibition",
    "Friends/Family",
    "Others",
  ];

  const handleInterestToggle = (option: string) => {
    setInterestedIn((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !city.trim()) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

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
          interestedIn,
          source,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setCity("");
      setInterestedIn([]);
      setSource("");
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
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Inquiry Form</span>
        </div>

        {success ? (
          /* Success Screen */
          <div className="border border-border p-8 sm:p-12 text-center shadow-2xl bg-card transition-all duration-500 animate-in fade-in zoom-in-95">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-foreground stroke-[1.5]" />
            </div>
            <h2 className="text-3xl font-serif italic mb-6 leading-tight">Thank You</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto mb-8 font-sans">
              Your inquiry has been successfully registered. A dedicated consultant will contact you shortly to guide you on the next steps.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setSuccess(false)}
                className="inline-block bg-foreground text-background py-4 px-6 text-xs uppercase tracking-[0.2em] font-medium hover:bg-foreground/90 transition-colors w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                Submit another request
              </button>
            </div>
          </div>
        ) : (
          /* Lead Form Screen */
          <div className="border border-border p-5 sm:p-8 md:p-12 shadow-2xl bg-card">
            <div className="mb-10">
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Carpe Diam</p>
              <h1 className="text-3xl md:text-4xl font-serif italic mb-4 leading-tight">Acquisition & Design Inquiry</h1>
              <p className="text-muted-foreground text-sm leading-relaxed font-sans">
                Please complete the form below. Our consultants will evaluate your preferences and connect with you to begin the process.
              </p>
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
              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                    placeholder="E.g., Charlotte"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                    placeholder="E.g., Dupont"
                  />
                </div>
              </div>

              {/* Contact fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none font-sans"
                    placeholder="name@domain.com"
                  />
                </div>
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

              {/* Interested In - Multi-Select tags */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  Interested In (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {interestOptions.map((opt) => {
                    const isSelected = interestedIn.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleInterestToggle(opt)}
                        className={`border px-4 py-3.5 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 rounded-none text-center select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground cursor-pointer ${
                          isSelected
                            ? "border-foreground bg-foreground text-background font-semibold"
                            : "border-border text-muted-foreground hover:border-foreground/45"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* How did you find about us? - Styled Select */}
              <div className="space-y-2">
                <label htmlFor="source" className="block text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  How did you find about us?
                </label>
                <div className="relative">
                  <select
                    id="source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="border border-border bg-background px-4 py-3.5 text-sm focus:outline-none focus:border-foreground focus-visible:ring-1 focus-visible:ring-foreground transition-colors w-full rounded-none appearance-none cursor-pointer font-sans"
                  >
                    <option value="" disabled className="text-muted-foreground">
                      Select an option
                    </option>
                    {sourceOptions.map((opt) => (
                      <option key={opt} value={opt} className="text-foreground bg-background">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-foreground text-background py-4.5 uppercase tracking-[0.2em] font-medium text-xs hover:bg-foreground/90 transition-colors w-full rounded-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
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
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
