import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Player } from "@/types/game";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGame } from "@/hooks/useGame";
import { EmojiReactionButtons } from "./EmojiReactionButtons";

interface ResultsModalProps {
  isOpen: boolean;
  option: string;
  matchedPlayer: Player | undefined;
  playerVotes: Array<{ voterName: string; votedForName: string }>;
  currentIndex: number;
  totalOptions: number;
  optionReactions: Record<string, number>;
  onPrevious: () => void;
  onNext: () => void;
  onOpenChange: (open: boolean) => void;
  onReactionClick: (emoji: string) => void;
  canControlResults: boolean;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export const ResultsModal = ({
  isOpen,
  option,
  matchedPlayer,
  playerVotes,
  currentIndex,
  totalOptions,
  optionReactions,
  onPrevious,
  onNext,
  onOpenChange,
  onReactionClick,
  canControlResults,
}: ResultsModalProps) => {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const prevOptionRef = useRef(option);
  const prevReactionsRef = useRef(optionReactions);

  const isLastPage = currentIndex === totalOptions - 1;

  const animateEmoji = (emoji: string, event: React.MouseEvent) => {
    const x = event.clientX;
    const y = event.clientY;

    const newEmoji: FloatingEmoji = {
      id: Date.now(),
      emoji,
      x,
      y,
    };

    setFloatingEmojis((prev) => [...prev, newEmoji]);

    // Remove the emoji after animation completes
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 1000);
  };

  const handleEmojiClick = (emoji: string, event: React.MouseEvent) => {
    onReactionClick(emoji);
  };

  useEffect(() => {
    // Check each emoji for changes in count
    Object.entries(optionReactions).forEach(([emoji, count]) => {
      const prevCount = prevReactionsRef.current[emoji] ?? 0;
      const prevOption = prevOptionRef.current;
      if (count > prevCount && option === prevOption) {
        // Create a synthetic event at the center of the button
        const button = document.querySelector(`[data-emoji="${emoji}"]`);
        if (button) {
          const rect = button.getBoundingClientRect();
          const event = {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          } as React.MouseEvent;
          animateEmoji(emoji, event);
        }
      }
    });

    // Update the ref with current reactions
    prevReactionsRef.current = optionReactions;
    prevOptionRef.current = option;
  }, [optionReactions, option]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="animate-scale-in p-4 w-[calc(100vw-2rem)] rounded-xl">
          <DialogTitle className="text-2xl font-bold text-game-primary text-center mb-4 animate-fade-in">
            Results
          </DialogTitle>

          <div className="p-4 bg-[#F1F0FB] rounded-xl shadow-lego-sm space-y-2 animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="text-lg font-bold text-game-neutral">
                {option} is...
              </div>
              {matchedPlayer ? (
                <div className="text-lg font-semibold text-game-primary animate-enter">
                  {matchedPlayer.name}
                </div>
              ) : (
                <div className="text-lg font-semibold text-game-primary">
                  ??
                </div>
              )}
            </div>

            <div className="space-y-1">
              {playerVotes.map((vote, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <span className="font-semibold text-game-neutral">
                    {vote.voterName}:
                  </span>
                  <span className="text-game-secondary">
                    {vote.votedForName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <EmojiReactionButtons
            optionReactions={optionReactions}
            onEmojiClick={handleEmojiClick}
          />

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={currentIndex === 0 || !canControlResults}
              className="w-24"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-game-neutral">
              {currentIndex + 1} of {totalOptions}
            </span>
            {isLastPage ? (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-24"
              >
                Done
                <Check className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={onNext} 
                className="w-24"
                disabled={!canControlResults}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            {floatingEmojis.map(({ id, emoji, x, y }) => (
              <div
                key={id}
                className="fixed pointer-events-none text-4xl animate-float-up"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {emoji}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
