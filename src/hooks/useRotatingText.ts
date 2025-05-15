import { useState, useEffect } from "react";

const PLACEHOLDER_TEXTS = [
  "bad pizza toppings",
  "awkward first dates",
  "fast food restaurants",
  "superheroes",
  "retro video games",
  "types of pasta",
  "classic rock bands",
  "disney characters",
  "types of clouds",
  "historical figures",
  "ice cream flavors",
  "conspiracy theories",
  "reasons to skip work",
];

const TIMING = {
  PAUSE_AFTER_TYPING: 2000,
  PAUSE_BEFORE_NEXT: 500,
} as const;

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface RotatingTextResult {
  text: string;
  isTyping: boolean;
}

/**
 * A hook that creates a typing animation effect with rotating placeholder texts
 * @param typingSpeed - Speed of typing animation in milliseconds (default: 50)
 * @param deletingSpeed - Speed of deleting animation in milliseconds (default: 30)
 * @returns Object containing the current text and typing state
 */
export const useRotatingText = (
  typingSpeed = 40,
  deletingSpeed = 20
): RotatingTextResult => {
  const [texts] = useState<string[]>(() => shuffleArray(PLACEHOLDER_TEXTS));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [displayText, setDisplayText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [charIndex, setCharIndex] = useState<number>(0);

  useEffect(() => {
    const currentText = texts[currentIndex];

    if (isTyping && charIndex < currentText.length) {
      const timer = setTimeout(() => {
        setDisplayText(currentText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(timer);
    }

    if (isTyping && charIndex === currentText.length) {
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, TIMING.PAUSE_AFTER_TYPING);
      return () => clearTimeout(timer);
    }

    if (!isTyping && charIndex > 0) {
      const timer = setTimeout(() => {
        setDisplayText(currentText.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, deletingSpeed);
      return () => clearTimeout(timer);
    }

    if (!isTyping && charIndex === 0) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= texts.length) {
            const newTexts = shuffleArray(PLACEHOLDER_TEXTS);
            texts.splice(0, texts.length, ...newTexts);
            return 0;
          }
          return next;
        });
        setIsTyping(true);
      }, TIMING.PAUSE_BEFORE_NEXT);
      return () => clearTimeout(timer);
    }
  }, [charIndex, currentIndex, deletingSpeed, isTyping, texts, typingSpeed]);

  return {
    text: `e.g., ${displayText}`,
    isTyping,
  };
};
