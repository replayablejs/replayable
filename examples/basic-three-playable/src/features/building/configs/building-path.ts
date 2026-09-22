/** Pavement falls into place shortly after the building starts appearing. */
export const buildingPathConfig = {
  // Heights use world units; animation times use seconds.
  startHeight: 0.12,
  delay: 0.1,
  stagger: 0.12,
  duration: 0.22,
  ease: 'easeOut',
} as const;
