import confetti from "canvas-confetti";

export function triggerBrandConfetti() {
  const colors = ["#c4943f", "#6f8765", "#b97954", "#ded8ca", "#9a6d23"];

  // First burst from center-left and center-right
  confetti({
    particleCount: 45,
    spread: 60,
    origin: { y: 0.7, x: 0.35 },
    colors,
    disableForReducedMotion: true
  });

  confetti({
    particleCount: 45,
    spread: 60,
    origin: { y: 0.7, x: 0.65 },
    colors,
    disableForReducedMotion: true
  });
}
