/** Shared rules for registration — keep API and client in sync. */

const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/

export const passwordRules = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (p: string) => p.length >= 8,
  },
  {
    id: 'upper',
    label: 'One uppercase letter',
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: 'lower',
    label: 'One lowercase letter',
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: 'digit',
    label: 'One number',
    test: (p: string) => /\d/.test(p),
  },
  {
    id: 'special',
    label: 'One special character (!@#$% etc.)',
    test: (p: string) => SPECIAL_RE.test(p),
  },
] as const

export function passwordMeetsPolicy(password: string): boolean {
  return passwordRules.every(r => r.test(password))
}

/** Single message for API responses when validation fails. */
export function getPasswordPolicyErrorMessage(): string {
  return 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
}
