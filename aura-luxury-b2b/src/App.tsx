import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Menu, X, Search, User } from "lucide-react";
import { useState, useEffect } from "react";

const categories = [
  {
    id: "earrings",
    title: "EARRINGS",
    pieces: 40,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "rings",
    title: "RINGS",
    pieces: 21,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "bracelets",
    title: "BRACELETS",
    pieces: 5,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "necklaces",
    title: "NECKLACES",
    pieces: 4,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
  },
];

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen selection:bg-gold/30">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isScrolled
          ? "bg-white/80 backdrop-blur-xl border-black/5 py-4"
          : "bg-transparent border-transparent py-8"
          }`}
      >
        <div className="max-w-[1440px] mx-auto px-12 flex items-center justify-between">
          <div className="flex flex-col items-start">
            <h1 className="font-serif text-3xl tracking-[0.3em] text-black leading-none">CARPE DIAM</h1>
            <p className="font-sans text-[8px] tracking-[0.8em] text-black/40 mt-1 ml-0.5">B O M B A Y</p>
          </div>

          <div className="items-center gap-10 font-sans text-[11px] font-medium tracking-[0.15em] text-black/70 hidden lg:flex">
            <div className="group relative cursor-pointer flex items-center gap-1.5 hover:text-black transition-colors">
              COLLECTIONS <ChevronDown className="w-3 h-3 text-black/30" />
            </div>
            <div className="group relative cursor-pointer flex items-center gap-1.5 hover:text-black transition-colors">
              CATEGORIES <ChevronDown className="w-3 h-3 text-black/30" />
            </div>
            <div className="cursor-pointer hover:text-black transition-colors ml-4">BESPOKE</div>
            <div className="cursor-pointer hover:text-black transition-colors">CONTACT US</div>
          </div>

          <div className="lg:hidden">
            <Menu className="w-6 h-6 text-black" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-[320px] pb-[280px] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-12 text-center space-y-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <p className="max-w-4xl mx-auto text-[30px] leading-[1.6] text-black/90 font-serif italic font-light tracking-tight px-4">
              Before it opens to the world,
              <br /> it opens for you. <br />
              Welcome to the Carpe Diam private collection.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="flex items-center justify-center gap-6"
          >
            <button className="btn-primary">Explore</button>
            <button className="btn-secondary">Request Access</button>
          </motion.div>
        </div>
      </section>

      {/* Category Section */}
      <section className="py-section bg-white">
        <div className="max-w-[1440px] mx-auto px-section-gap space-y-20">
          <div className="text-center">
            <h2 className="text-headline">Category</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}
                className="group relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden cursor-pointer"
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-[2s] ease-[0.19, 1, 0.22, 1] group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Soft Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-white/80 to-transparent group-hover:opacity-0 transition-opacity duration-500" />

                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-1">
                  <h3 className="font-serif text-sm font-medium tracking-[0.15em] text-black group-hover:text-white transition-colors duration-500 uppercase">
                    {category.title}
                  </h3>
                  <p className="font-sans text-[9px] tracking-[0.1em] text-black/50 group-hover:text-white/60 transition-colors duration-500 uppercase">
                    {category.pieces} Pieces
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-black text-white/40">
        <div className="max-w-[1440px] mx-auto px-section-gap flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <h2 className="font-serif text-xl tracking-[0.4em] text-white">CARPE DIAM</h2>
            <p className="max-w-xs text-[10px] leading-loose tracking-widest uppercase">
              Exclusively for trade partners. Our collection remains private until the moment it is yours.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-20">
            <div className="space-y-6 text-[10px] tracking-[0.2em] uppercase font-semibold">
              <p className="text-white">The Brand</p>
              <div className="space-y-4">
                <p className="hover:text-white cursor-pointer transition-colors">Philosophy</p>
                <p className="hover:text-white cursor-pointer transition-colors">Craftsmanship</p>
                <p className="hover:text-white cursor-pointer transition-colors">Stories</p>
              </div>
            </div>
            <div className="space-y-6 text-[10px] tracking-[0.2em] uppercase font-semibold">
              <p className="text-white">Services</p>
              <div className="space-y-4">
                <p className="hover:text-white cursor-pointer transition-colors">Wholesale</p>
                <p className="hover:text-white cursor-pointer transition-colors">Bespoke</p>
                <p className="hover:text-white cursor-pointer transition-colors">Support</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-section-gap mt-24 pt-8 border-t border-white/5 flex justify-between items-center text-[8px] tracking-[0.2em] uppercase">
          <p>© 2026 Carpe Diam. All rights reserved.</p>
          <p className="flex gap-6">
            <span className="cursor-pointer hover:text-white">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white">Terms of Service</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
