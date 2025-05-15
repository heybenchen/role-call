import { Button } from "@/components/ui/button";

interface EmojiReactionButtonsProps {
  optionReactions: Record<string, number>;
  onEmojiClick: (emoji: string, event: React.MouseEvent) => void;
}

export const EmojiReactionButtons = ({
  optionReactions,
  onEmojiClick,
}: EmojiReactionButtonsProps) => {
  const emojis = ["💯", "😆", "💩", "🌶️"];

  return (
    <div className="flex justify-center gap-2 mt-4">
      {emojis.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className="text-xl hover:bg-[#F1F0FB]"
          onClick={(e) => onEmojiClick(emoji, e)}
          data-emoji={emoji}
        >
          {emoji}
          {optionReactions[emoji] > 0 && (
            <span className="text-xs text-game-neutral ml-1">
              {optionReactions[emoji]}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}; 