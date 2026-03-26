'use client';

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import Image from "next/image";
import { Mail, Phone, Instagram, MapPin, MessageCircle, PenTool, Gem, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AppointmentsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Immediate Reveal for Hero & Contact
    gsap.from(".hero-content", {
      opacity: 0,
      y: 20,
      duration: 1,
      ease: "power3.out",
      stagger: 0.1
    });

    // Process Steps Reveal
    const steps = gsap.utils.toArray(".process-step");
    steps.forEach((step: any, i: number) => {
      gsap.from(step, {
        scrollTrigger: {
          trigger: step,
          start: "top 85%",
        },
        opacity: 0,
        x: i % 2 === 0 ? -20 : 20,
        duration: 1,
        ease: "power2.out"
      });
    });

  }, { scope: containerRef });

  const processSteps = [
    {
      title: "Consultation",
      description: "A private dialogue to understand your vision, preferences, and the significance behind the piece.",
      icon: <MessageCircle className="w-5 h-5" />,
      image: "/images/redesign/artistry.png"
    },
    {
      title: "Design & Curation",
      description: "Translating ideas into sketches and technical renders, ensuring every proportion and detail is perfect.",
      icon: <PenTool className="w-5 h-5" />,
      image: "/Vision.webp"
    },
    {
      title: "Master Craftsmanship",
      description: "Our artisans bring the design to life using time-honored techniques and the finest materials.",
      icon: <Gem className="w-5 h-5" />,
      image: "/images/redesign/cat-bracelets.jpeg"
    },
    {
      title: "Completion",
      description: "A final inspection of excellence before the piece is presented to you, ready to be a modern heirloom.",
      icon: <CheckCircle2 className="w-5 h-5" />,
      image: "/images/redesign/hero-luxury.png"
    }
  ];

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-gray-900 selection:bg-gray-100">

      {/* 1. HERO & CONTACT (Visible on Load) */}
      <section className="pt-32 pb-24 px-6 border-b border-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="hero-content text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-6">Concierge</p>
              <h1 className="hero-content text-4xl md:text-5xl font-serif italic mb-8 leading-tight">
                Appointments &<br />Consultations
              </h1>
              <p className="hero-content text-gray-500 leading-relaxed max-w-md mb-8">
                Whether you're seeking a meaningful gift or a piece to mark a personal milestone, our team is here to guide you. Contact us directly to begin your journey.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:bg-[#fafafa] lg:p-10 lg:rounded-sm">
              <div className="hero-content">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-gray-400">Email</h4>
                <a href="mailto:hello@carpediam.in" className="text-sm text-gray-700 hover:text-black transition-colors underline-offset-4 hover:underline block">
                  hello@carpediam.in
                </a>
              </div>
              <div className="hero-content">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-gray-400">Phone & WhatsApp</h4>
                <a href="tel:+919876543210" className="text-sm text-gray-700 hover:text-black transition-colors underline-offset-4 hover:underline block">
                  +91 98765 43210
                </a>
              </div>
              <div className="hero-content">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-gray-400">Instagram</h4>
                <a href="https://instagram.com/carpediam" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-black transition-colors underline-offset-4 hover:underline block">
                  @carpediam
                </a>
              </div>
              <div className="hero-content">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-gray-400">Location</h4>
                <p className="text-sm text-gray-700">
                  Mumbai, India
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROCESS */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-24">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-4">The Journey</p>
            <h3 className="text-3xl font-serif italic">Our Process</h3>
          </div>

          <div className="grid grid-cols-1 gap-24">
            {processSteps.map((step, i) => (
              <div key={i} className="process-step grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className={`relative aspect-video overflow-hidden ${i % 2 !== 0 ? 'lg:order-2' : ''}`}>
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  />
                </div>
                <div className={`${i % 2 !== 0 ? 'lg:order-1' : ''}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      {step.icon}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-black font-serif italic">Step 0{i + 1}</span>
                  </div>
                  <h4 className="text-2xl font-serif mb-6 text-black">{step.title}</h4>
                  <p className="text-gray-500 leading-relaxed max-w-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CLOSING SECTION */}
      {/* <section className="py-32 px-6 bg-black text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif italic mb-10 leading-snug">
            Ready to begin?
          </h2>
          <p className="text-gray-400 leading-relaxed mb-12">
            Every piece we create is a collaboration between your vision and our expertise. We look forward to welcome you to the world of Carpe Diam.
          </p>
          <a 
            href="mailto:hello@carpediam.in" 
            className="inline-block px-12 py-4 border border-white/20 hover:border-white transition-all text-[10px] uppercase tracking-[0.3em]"
          >
            Initiate Consultation
          </a>
        </div>
      </section> */}

      <footer className="py-20 px-6 text-center text-[10px] uppercase tracking-[0.5em] text-gray-300">
        Carpe Diam ©
      </footer>

    </div>
  );
}
