/*
  Banner photography, keyed so the copy JSON can name one without holding an
  import. Same pattern as screens.ts.

  Stand-ins from Unsplash, whose licence permits commercial use without
  attribution. They should still be replaced by commissioned photography before
  launch — see OUTSTANDING.md §3.

  An editor never touches these files: they describe the shot they want and it
  gets sourced, dropped in here, and named in one line of JSON.
*/

import studentsLaptops from '@/assets/banners/students-laptops.jpg';
import primaryClassroom from '@/assets/banners/primary-classroom.jpg';
import classroom from '@/assets/images/classroom.jpg';

export const banners = {
  'students-laptops': studentsLaptops,
  'primary-classroom': primaryClassroom,
  classroom,
} as const;

export type BannerKey = keyof typeof banners;
export const isBannerKey = (k: string | undefined): k is BannerKey =>
  Boolean(k && k in banners);
