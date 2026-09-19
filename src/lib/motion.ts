import type { Variants, Transition } from "framer-motion";

export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const spring: Transition = { type: "spring", stiffness: 120, damping: 20, mass: 0.8 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

export const stagger = (delay = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren } },
});

export const viewportOnce = { once: true, margin: "-8% 0px -8% 0px" } as const;
