/** The o, struck like a coin: one stroke split by an inline. */

export const MARK_VIEW_BOX = "0 0 64 64";

/* Four concentric circles under evenodd. The inline is a transparent gap rather than a ground-coloured stroke, so one path works on the frame, on paper and on a tinted card. */
export const MARK_FULL =
  "M32 5a27 27 0 1 1 0 54a27 27 0 1 1 0-54Z" +
  "M32 10.05a21.95 21.95 0 1 1 0 43.9a21.95 21.95 0 1 1 0-43.9Z" +
  "M32 11.95a20.05 20.05 0 1 1 0 40.1a20.05 20.05 0 1 1 0-40.1Z" +
  "M32 17a15 15 0 1 1 0 30a15 15 0 1 1 0-30Z";
