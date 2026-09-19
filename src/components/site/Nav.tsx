"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { navLinks } from "@/lib/nav";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero");
      setScrolled(hero ? hero.getBoundingClientRect().bottom < 80 : window.scrollY > 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [path]);

  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setOpen(false); }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className={cn("sticky top-0 z-50 bg-paper transition-shadow duration-300", scrolled && "shadow-[0_1px_0_rgba(35,32,29,0.07)]")}>
        <div className="relative mx-auto flex h-[72px] max-w-[1408px] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="GroundPulse home" className="relative z-[60]"><Logo /></Link>

          <div className="flex items-center gap-1">
            <nav className="hidden items-center lg:flex" aria-label="Primary">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className={cn("rounded-full px-4 py-2 text-[16px] font-medium transition hover:bg-ink/[0.05]", path === l.href ? "text-ink" : "text-ink/80 hover:text-ink")}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link href="/access" className="btn btn-pill ml-2 hidden md:inline-flex">Get started</Link>
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="relative z-[60] ml-1 grid h-11 w-11 place-items-center rounded-full lg:hidden">
              <span className="relative block h-[10px] w-[20px]">
                <span className={cn("absolute left-0 top-0 h-[2px] w-full rounded bg-ink transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)]", open && "translate-y-[4px] rotate-45")} />
                <span className={cn("absolute left-0 top-[8px] h-[2px] w-full rounded bg-ink transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)]", open && "-translate-y-[4px] -rotate-45")} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="fixed inset-0 z-40 bg-paper lg:hidden">
            <div className="flex h-full flex-col px-5 pb-8 pt-[96px]">
              <motion.ul initial="hidden" animate="show" exit="hidden" variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } }, hidden: {} }}>
                {[{ href: "/", label: "Home" }, ...navLinks].map((l) => (
                  <motion.li key={l.href} variants={{ hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } } }} className="border-b border-line">
                    <Link href={l.href} className="flex items-center justify-between py-4 text-[1.6rem] font-medium tracking-[-0.04em]">{l.label} <ArrowRight size={18} className="text-text-3" /></Link>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: EASE }} className="mt-auto">
                <Link href="/access" className="btn btn-accent btn-lg w-full">Get started <ArrowRight size={16} /></Link>
                <p className="t-small mt-4 text-center">Takes 5 minutes · Your media stays private</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
