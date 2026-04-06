import React, { HTMLAttributes } from 'react';
import { cn } from './Button';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 dark:bg-black/50 dark:border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
