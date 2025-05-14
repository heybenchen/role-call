import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Player } from "@/types/game";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

interface ResultsModalProps {
  isOpen: boolean;
  option: string;
  matchedPlayer: Player | undefined;
  playerVotes: Array<{ voterName: string; votedForName: string }>;
  currentIndex: number;
  totalOptions: number;
  onPrevious: () => void;
  onNext: () => void;
  onOpenChange: (open: boolean) => void;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface ReactionCounts {
  "💯": number;
  "🤣": number;
  "👎": number;
  "🌶️": number;
}

type PageReactions = Record<number, ReactionCounts>;

export const ResultsModal = ({
  isOpen,
  option,
  matchedPlayer,
  playerVotes,
  currentIndex,
  totalOptions,
  onPrevious,
  onNext,
  onOpenChange,
}: ResultsModalProps) => {
  const isLastPage = currentIndex === totalOptions - 1;
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [pageReactions, setPageReactions] = useState<PageReactions>({});

  const currentReactions = pageReactions[currentIndex] || {
    "💯": 0,
    "🤣": 0,
    "👎": 0,
    "🌶️": 0,
  };

  const handleEmojiClick = (emoji: string, event: React.MouseEvent) => {
    const x = event.clientX;
    const y = event.clientY;

    const newEmoji: FloatingEmoji = {
      id: Date.now(),
      emoji,
      x,
      y,
    };

    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setPageReactions((prev) => ({
      ...prev,
      [currentIndex]: {
        ...currentReactions,
        [emoji]: (currentReactions[emoji as keyof ReactionCounts] || 0) + 1,
      },
    }));

    // Remove the emoji after animation completes
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 1000);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="animate-scale-in p-4 w-[calc(100vw-2rem)] rounded-xl">
          <DialogTitle className="text-2xl font-bold text-game-primary text-center mb-4 animate-fade-in">
            Role {currentIndex + 1} of {totalOptions}
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

          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xl hover:bg-[#F1F0FB]"
              onClick={(e) => handleEmojiClick("💯", e)}
            >
              💯
              {currentReactions["💯"] > 0 && (
                <span className="text-xs text-game-neutral ml-1">
                  {currentReactions["💯"]}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xl hover:bg-[#F1F0FB]"
              onClick={(e) => handleEmojiClick("🤣", e)}
            >
              🤣
              {currentReactions["🤣"] > 0 && (
                <span className="text-xs text-game-neutral ml-1">
                  {currentReactions["🤣"]}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xl hover:bg-[#F1F0FB]"
              onClick={(e) => handleEmojiClick("👎", e)}
            >
              👎
              {currentReactions["👎"] > 0 && (
                <span className="text-xs text-game-neutral ml-1">
                  {currentReactions["👎"]}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xl hover:bg-[#F1F0FB]"
              onClick={(e) => handleEmojiClick("🌶️", e)}
            >
              🌶️
              {currentReactions["🌶️"] > 0 && (
                <span className="text-xs text-game-neutral ml-1">
                  {currentReactions["🌶️"]}
                </span>
              )}
            </Button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={currentIndex === 0}
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
              <Button variant="outline" onClick={onNext} className="w-24">
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
                className="fixed pointer-events-none text-4xl animate-float-up bg-white/50 p-2 rounded-full"
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
