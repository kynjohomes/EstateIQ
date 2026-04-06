/**
 * Footer social URLs. Override with NEXT_PUBLIC_SOCIAL_TWITTER, INSTAGRAM, FACEBOOK, LINKEDIN in env.
 */
export const footerSocialLinks = [
  {
    label: 'X (Twitter)',
    href:
      process.env.NEXT_PUBLIC_SOCIAL_TWITTER?.trim() ||
      'https://x.com/KynjoHomes',
  },
  {
    label: 'Instagram',
    href:
      process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() ||
      'https://www.instagram.com/kynjohomes/',
  },
  {
    label: 'Facebook',
    href:
      process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim() ||
      'https://www.facebook.com/profile.php?id=61574437749769',
  },
  {
    label: 'LinkedIn',
    href:
      process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN?.trim() ||
      'https://www.linkedin.com/company/kynjo-homes',
  },
] as const
