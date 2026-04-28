import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

const messages = [
  "Analyzing claim patterns...",
  "Running fraud detection model...",
  "Evaluating risk factors...",
  "Generating risk score...",
];

const LoadingAnimation = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 1200);
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 95));
    }, 200);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-8"
    >
      {/* Animated shield icon */}
      <div className="relative">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border-2 border-transparent"
          style={{
            borderImage: "linear-gradient(135deg, hsl(var(--glow-primary)), hsl(var(--glow-purple)), hsl(var(--glow-cyan))) 1",
            borderRadius: "50%",
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </m.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <m.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-7 h-7 text-primary" />
          </m.div>
        </div>
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse-glow" />
      </div>

      {/* Progress bar */}
      <div className="w-48">
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <m.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(var(--glow-primary)), hsl(var(--glow-purple)))",
              width: `${progress}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Animated message */}
      <AnimatePresence mode="wait">
        <m.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-sm text-muted-foreground font-medium"
        >
          {messages[msgIndex]}
        </m.p>
      </AnimatePresence>
    </m.div>
  );
};

export default LoadingAnimation;
