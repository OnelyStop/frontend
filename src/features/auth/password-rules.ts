/** The rules the signup form shows and enforces before it will submit. */
export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    test: (v) => v.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (v) => /[a-z]/.test(v),
  },
  { id: "digit", label: "One number", test: (v) => /\d/.test(v) },
  {
    id: "symbol",
    label: "One special character",
    // Anything that is not a letter, a digit or whitespace.
    test: (v) => /[^\p{L}\p{N}\s]/u.test(v),
  },
];

export function failedPasswordRules(value: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value));
}

export function passwordMeetsRules(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
