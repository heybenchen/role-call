import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface LobbyCreationProps {
  onJoin: (name: string) => void;
  lobbyCode: string;
}

export const LobbyCreation = ({ onJoin, lobbyCode }: LobbyCreationProps) => {
  const [name, setName] = useState(() => {
    return sessionStorage.getItem("playerName") || "";
  });

  const copyInviteLink = () => {
    const url = `${window.location.origin}/join/${lobbyCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Invite link copied!",
      description: "Share this link with your friends to join the game.",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7CD]">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lego border-4 border-game-neutral">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-game-neutral">Play Role Call</h1>
          <p className="text-xl font-semibold text-game-primary">Join this game to get started!</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="name" className="block text-lg font-bold text-game-neutral">
              Your Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="h-12 text-lg border-2 border-game-neutral rounded-lg shadow-lego-sm focus:ring-2 focus:ring-game-primary"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-bold text-game-neutral">Lobby Code</label>
            <div className="flex items-center space-x-3">
              <div className="flex-1 px-4 py-3 bg-[#F1F0FB] rounded-lg shadow-lego-sm font-mono text-xl text-center font-bold text-game-secondary">
                {lobbyCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                className="h-12 w-12 border-2 border-game-neutral hover:bg-[#F1F0FB] shadow-lego-sm"
              >
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg font-bold bg-game-primary hover:bg-game-primary/90 text-white shadow-lego transform transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            onClick={() => name && onJoin(name)}
            disabled={!name}
          >
            Enter Lobby
          </Button>
        </div>
      </Card>
    </div>
  );
};
