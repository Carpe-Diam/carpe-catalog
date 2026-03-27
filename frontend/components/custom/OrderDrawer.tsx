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
        <Button className="bg-black text-white">Submit Order Request</Button>
      </DrawerTrigger>

      <DrawerContent className="p-6">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-semibold">
            Submit Order Request
          </DrawerTitle>
          <DrawerDescription>
            Provide your contact info and we will reach out shortly.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* Company */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Company Name</label>
            <Input
              placeholder="Enter company name"
              value={form.company}
              onChange={(e) => handleChange("company", e.target.value)}
            />
          </div>

          {/* Communication */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Preferred Communication
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["call", "text", "whatsapp", "email"].map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={communication === method ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => setCommunication(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          {/* Dynamic Contact Info */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Contact Info</label>
            {contactField()}
          </div>

          {/* Order Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              {["purchase", "consignment"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={orderType === type ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => setOrderType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Enter custom notes or special instructions"
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Hidden Product Metadata */}
          <div className="text-xs text-gray-500 border-t pt-3">
            Requesting: <strong>{product.title}</strong>
            <br />
            Variant: <strong>{variant.variant_sku}</strong>
            <br />
            Order Type: <strong>{orderType}</strong>
          </div>
        </div>

        <DrawerFooter>
          <Button className="bg-black text-white" onClick={handleSubmit}>
            Submit Request
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});