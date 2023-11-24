// From: https://github.com/thewca/tnoodle/blob/2d9ef27d95eec86367a592210ebc6e45558516aa/tnoodle-ui/src/test/mock/tnoodle.api.test.mock.ts#L14
export const tnoodleEventNameMappings = {
  "333": "3x3x3",
  "222": "2x2x2",
  "444": "4x4x4",
  "555": "5x5x5",
  "666": "6x6x6",
  "777": "7x7x7",
  "333bf": "3x3x3 Blindfolded",
  "333fm": "3x3x3 Fewest Moves",
  "333oh": "3x3x3 One-Handed",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4x4x4 Blindfolded",
  "555bf": "5x5x5 Blindfolded",
  "333mbf": "3x3x3 Multiple Blindfolded",
} as const;

// TODO: distinguish between multi-scrambles and per-attempt encypted scrambles.
export const multiScramblesEncryptedPerAttemptEvents: Partial<
  Record<keyof typeof tnoodleEventNameMappings, boolean>
> = {
  "333fm": true,
  "333mbf": true,
};
