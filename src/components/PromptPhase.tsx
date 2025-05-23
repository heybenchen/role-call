import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/game';
import { useRotatingText } from '@/hooks/useRotatingText';

interface PromptPhaseProps {
  currentPlayer: Player;
  onPromptSubmit: (prompt: string, options: string[]) => void;
  playerCount: number;
  isPlayerTurn: boolean;
}

export const PromptPhase = ({ currentPlayer, onPromptSubmit, playerCount, isPlayerTurn }: PromptPhaseProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();
  const { text: rotatingText, isTyping } = useRotatingText();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlayerTurn || hasSubmitted) return;
    
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-options', {
        body: { prompt, playerCount },
      });

      if (error) throw error;

      onPromptSubmit(prompt, data.options);
      setHasSubmitted(true);
    } catch (error) {
      console.error('Error generating options:', error);
      toast({
        title: 'Error generating options',
        description: 'Please try a different category',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7CD]">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lego border-4 border-game-neutral transform transition-transform hover:-translate-y-1">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-game-primary">
            {currentPlayer.name}'s Turn
          </h2>
          {isPlayerTurn ? (
            hasSubmitted ? (
              <p className="text-xl font-semibold text-game-neutral">
                Waiting for others to match the options...
              </p>
            ) : (
              <p className="text-xl font-semibold text-game-neutral">
                Enter a category and AI will generate options for people to match.
              </p>
            )
          ) : (
            <p className="text-xl font-semibold text-game-neutral">
              Waiting for {currentPlayer.name} to enter a category...
            </p>
          )}
        </div>

        {isPlayerTurn && !hasSubmitted && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                className="h-12 text-lg border-2 border-game-neutral rounded-lg shadow-lego-sm focus:ring-2 focus:ring-game-primary"
              />
              {!prompt && (
                <div 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${isTyping ? 'after:content-["|"] after:animate-blink' : ''}`}
                >
                  {rotatingText}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-game-primary hover:bg-game-primary/90 text-white shadow-lego transform transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
              disabled={!prompt.trim() || isLoading}
            >
              {isLoading ? 'Generating options...' : 'Submit Category'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
