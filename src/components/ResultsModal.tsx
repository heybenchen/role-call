import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Player } from "@/types/game";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl animate-scale-in">
        <DialogTitle className="text-2xl font-bold text-game-primary text-center mb-4 animate-fade-in">
          Category {currentIndex + 1} of {totalOptions}
        </DialogTitle>

        <div className="p-4 bg-[#F1F0FB] rounded-xl shadow-lego-sm space-y-2 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold text-game-neutral">{option}:</div>
            {matchedPlayer ? (
              <div className="text-lg font-semibold text-game-primary animate-enter">
                {matchedPlayer.name}
              </div>
            ) : (
              <div className="text-lg font-semibold text-game-primary">??</div>
            )}
          </div>

          <div className="space-y-1">
            {playerVotes.map((vote, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <span className="font-semibold text-game-neutral">{vote.voterName}:</span>
                <span className="text-game-secondary">{vote.votedForName}</span>
              </div>
            ))}
          </div>
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
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-24">
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
  );
};
