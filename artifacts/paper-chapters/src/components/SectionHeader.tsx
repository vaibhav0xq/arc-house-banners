import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Props = {
  eyebrow: string;
  title: ReactNode;
  /** Short supporting copy, set to the right of the title on wide screens. */
  aside?: ReactNode;
  className?: string;
};

/** Every section opens the same way: eyebrow, a two-line-max title and a quiet aside. */
export function SectionHeader({ eyebrow, title, aside, className = '' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end ${className}`}
    >
      <div className="lg:col-span-7">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-4 text-[2rem] leading-[1.02] sm:text-[2.6rem] lg:text-[3.1rem] text-[var(--ink)] ink-fade text-balance">{title}</h2>
      </div>
      {aside && (
        <p className="lg:col-span-4 lg:col-start-9 text-base sm:text-[1.0625rem] leading-relaxed text-[var(--muted)] ink-fade text-balance lg:pb-1.5">
          {aside}
        </p>
      )}
    </motion.div>
  );
}
