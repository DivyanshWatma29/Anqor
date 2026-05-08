import { m } from "framer-motion";
import { ReactNode, useEffect } from "react";

interface PageWrapperProps {
  children: ReactNode;
}

const PageWrapper = ({ children }: PageWrapperProps) => {
  // Scroll to top on page transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      className="w-full h-full"
    >
      {children}
    </m.div>
  );
};

export default PageWrapper;