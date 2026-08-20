'use client';

import { motion } from 'motion/react';

interface ScrollIndicatorProps {
  label: string;
}

export default function ScrollIndicator({ label }: ScrollIndicatorProps) {
  return (
    <motion.a
      href="#how-it-works"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85, duration: 0.45, ease: 'easeOut' }}
      className="group inline-flex flex-col items-center gap-2 text-white/75 drop-shadow-[0_3px_14px_rgba(0,0,0,0.34)] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/75"
    >
      <motion.span
        aria-hidden="true"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-xl backdrop-blur-md motion-reduce:animate-none"
      >
        ↓
      </motion.span>
      <span className="text-xs font-black tracking-normal sm:text-sm">{label}</span>
    </motion.a>
  );
}
