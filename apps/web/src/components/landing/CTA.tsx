"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const CTA = () => {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 md:py-32 bg-foreground" ref={ref}>
      <div className={`max-w-3xl mx-auto section-padding text-center ${visible ? "reveal-up" : "opacity-0"}`}>
        <h2 className="text-3xl md:text-4xl font-bold text-background leading-tight">
          Ready to modernize your estate?
        </h2>
        <p className="mt-4 text-background/60 text-lg leading-relaxed max-w-lg mx-auto">
          Join hundreds of communities that switched from spreadsheets and group chats to Kynjo.Homes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-primary-foreground gap-2 active:scale-[0.97] transition-all shadow-lg shadow-primary/25"
            asChild
          >
            <Link href={isLoggedIn ? "/dashboard" : "/sign-up"}>
              {isLoggedIn ? "Go to dashboard" : "Start Free Trial"}
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-background/20 text-black hover:bg-background/10 active:scale-[0.97] transition-all"
            asChild
          >
            <Link href={isLoggedIn ? "#pricing" : "/contact"}>
              {isLoggedIn ? "View pricing" : "Talk to Sales"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
