
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/game';

interface PromptPhaseProps {
  currentPlayer: Player;
  onPromptSubmit: (prompt: string, options: string[]) => void;
  playerCount: number;
}

export const PromptPhase = ({ currentPlayer, onPromptSubmit, playerCount }: PromptPhaseProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-options', {
        body: { prompt, playerCount },
      });

      if (error) throw error;

      onPromptSubmit(prompt, data.options);
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-game-neutral">
            {currentPlayer.name}'s Turn
          </h2>
          <p className="text-gray-600">
            Enter a category (e.g., "natural elements" or "Scooby Doo characters")
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your category..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="w-full bg-game-primary hover:bg-game-primary/90 text-white"
            disabled={!prompt.trim() || isLoading}
          >
            {isLoading ? 'Generating options...' : 'Submit Category'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
