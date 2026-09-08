import { AVATARS, type AvatarKey } from "../avatars";

/** The mark itself. Sized by the caller's box, so it works at 24px and at 64px. */
export function AvatarMark({ avatar }: { avatar: AvatarKey }) {
  const look = AVATARS[avatar];
  return (
    <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
      <rect width="32" height="32" rx="16" fill={look.wash} />
      <circle cx="16" cy="13" r="5.4" fill={look.ink} />
      <circle cx="14.1" cy="12.4" r="1.05" fill="#fff" />
      <circle cx="17.9" cy="12.4" r="1.05" fill="#fff" />
      <path
        d={`M13.6 ${15.4 + look.brow * 0.1}c1.4 1.2 3.4 1.2 4.8 0`}
        stroke="#fff"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6.5 29c1.6-5 5.2-7.6 9.5-7.6s7.9 2.6 9.5 7.6z"
        fill={look.ink}
        opacity="0.9"
      />
    </svg>
  );
}
