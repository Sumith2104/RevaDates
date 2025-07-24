
'use client';

import { motion } from 'framer-motion';

export function PageLoader() {
  const loaderVariants = {
    initial: { y: -10, opacity: 0.5 },
    animate: { y: 10, opacity: 1 },
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen text-center bg-black">
      <div className="p-8 rounded-lg bg-white/10 backdrop-blur-lg shadow-2xl">
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="flex justify-center gap-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="h-3 w-3 rounded-full bg-white"
              variants={loaderVariants}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
        <p className="mt-4 text-white/70 text-sm">Loading...</p>
      </div>
    </div>
  );
}
