
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Player } from "@/types/game";

interface ResultsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  option: string;
  matchedPlayer: Player | undefined;
  playerVotes: Array<{ voterName: string; votedForName: string }>;
  currentIndex: number;
  totalOptions: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const ResultsModal = ({
  isOpen,
  onOpenChange,
  option,
  matchedPlayer,
  playerVotes,
  currentIndex,
  totalOptions,
  onPrevious,
  onNext,
}: ResultsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogTitle className="text-2xl font-bold text-game-primary text-center mb-4">
          Category Result {currentIndex + 1} of {totalOptions}
        </DialogTitle>

        <div className="p-4 bg-[#F1F0FB] rounded-xl shadow-lego-sm space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold text-game-neutral">{option}:</div>
            {matchedPlayer ? (
              <div className="text-lg font-semibold text-game-primary">
                {matchedPlayer.name}
              </div>
            ) : (
              <div className="text-lg font-semibold text-game-primary">??</div>
            )}
          </div>

          <div className="space-y-1">
            {playerVotes.map((vote, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
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
          <Button
            variant="outline"
            onClick={onNext}
            disabled={currentIndex === totalOptions - 1}
            className="w-24"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
