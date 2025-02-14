
const useSound = () => {
  const playJoinSound = () => {
    const audio = new Audio("/sounds/join.mp3");
    audio.play();
  };

  const playSubmitSound = () => {
    const audio = new Audio("/sounds/submit.mp3");
    audio.play();
  };

  const playReadySound = () => {
    const audio = new Audio("/sounds/ready.mp3");
    audio.play();
  };

  const playEndRoundSound = () => {
    const audio = new Audio("/sounds/endround.mp3");
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

