
import { supabase } from "@/integrations/supabase/client";

const useSound = () => {
  const getStorageUrl = (filename: string) => {
    const { data } = supabase.storage
      .from("sound_effects")
      .getPublicUrl(filename);
    return data.publicUrl;
  };

  const playJoinSound = () => {
    const audio = new Audio(getStorageUrl("join.mp3"));
    audio.play();
  };

  const playSubmitSound = () => {
    const audio = new Audio(getStorageUrl("submit.mp3"));
    audio.play();
  };

  const playReadySound = () => {
    const audio = new Audio(getStorageUrl("ready.mp3"));
    audio.play();
  };

  const playEndRoundSound = () => {
    const audio = new Audio(getStorageUrl("endround.mp3"));
    audio.play();
  };

  return {
    playJoinSound,
    playSubmitSound,
    playReadySound,
    playEndRoundSound,
  };
};

export default useSound;
