"use client";

import { useState, useCallback, memo } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Variant = {
  variant_sku: string;
  total_cost: number;
  // Add other fields as needed
};

type Product = {
  title: string;
  // Add other fields as needed
};

interface OrderRequestDrawerProps {
  variant: Variant;
  product: Product;
}

export const OrderRequestDrawer = memo(function OrderRequestDrawer({ variant, product }: OrderRequestDrawerProps) {
  const [open, setOpen] = useState(false);
  const [communication, setCommunication] = useState("call");
  const [orderType, setOrderType] = useState("purchase");
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    whatsapp: "",
    message: "",
  });

  const handleChange = useCallback((field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const contactField = () => {
    switch (communication) {
      case "call":
      case "text":
        return (
          <Input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            type="number"
          />
        );
      case "whatsapp":
        return (
          <Input
            placeholder="WhatsApp Number"
            value={form.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            type="number"
          />
        );
      case "email":
        return (
          <Input
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            type="email"
          />
        );
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      const res = await fetch("/api/order-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          communication,
          orderType,
          productTitle: product.title,
          variantSku: variant.variant_sku,
          price: variant.total_cost,
          productLink:
            typeof window !== "undefined" ? window.location.href : "",
        }),
      });

      const json = await res.json();
      console.log("API RESPONSE:", json);

      if (!json.success) {
        throw new Error(json.error || "Email failed");
      }

      alert("Request sent!");
      setOpen(false); // Close drawer on success
    } catch (err) {
      console.error("❌ SUBMIT ERROR:", err);
      alert("Error sending request");
    }
  }, [form, communication, orderType, product.title, variant.variant_sku, variant.total_cost]);


  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button className="bg-accent text-accent-foreground rounded-full px-8 py-6 font-semibold tracking-widest uppercase text-xs hover:opacity-90 transition-all">
          Submit Order Request
        </Button>
      </DrawerTrigger>

      <DrawerContent className="p-8 bg-card border-l border-white/5">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-2xl font-medium tracking-tight text-foreground">
            Submit Order Request
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground tracking-wide">
            Provide your contact info and we will reach out shortly.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 mt-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">Full Name</label>
            <Input
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-secondary border-white/5 rounded-xl h-12"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">Company Name</label>
            <Input
              placeholder="Enter company name"
              value={form.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className="bg-secondary border-white/5 rounded-xl h-12"
            />
          </div>

          {/* Communication */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              Preferred Communication
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["call", "text", "whatsapp", "email"].map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={communication === method ? "default" : "outline"}
                  className={`capitalize rounded-xl text-[11px] tracking-wider ${communication === method ? 'bg-accent text-accent-foreground' : 'border-white/10'}`}
                  onClick={() => setCommunication(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          {/* Dynamic Contact Info */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">Contact Info</label>
            {contactField()}
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              {["purchase", "consignment"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={orderType === type ? "default" : "outline"}
                  className={`capitalize rounded-xl text-[11px] tracking-wider ${orderType === type ? 'bg-accent text-accent-foreground' : 'border-white/10'}`}
                  onClick={() => setOrderType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">Message</label>
            <Textarea
              placeholder="Enter custom notes or special instructions"
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              className="min-h-[100px] bg-secondary border-white/5 rounded-xl"
            />
          </div>

          {/* Hidden Product Metadata */}
          <div className="text-[10px] text-muted-foreground/60 border-t border-white/5 pt-6 leading-relaxed uppercase tracking-widest">
            Requesting: <strong className="text-foreground">{product.title}</strong>
            <br />
            Variant: <strong className="text-foreground">{variant.variant_sku}</strong>
            <br />
            Order Type: <strong className="text-foreground">{orderType}</strong>
          </div>
        </div>

        <DrawerFooter className="px-0 pt-8 pb-0">
          <Button className="bg-accent text-accent-foreground rounded-full h-14 font-bold tracking-widest uppercase text-xs shadow-xl shadow-accent/10" onClick={handleSubmit}>
            Submit Request
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="rounded-full h-14 border-white/10 text-muted-foreground hover:text-foreground">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});