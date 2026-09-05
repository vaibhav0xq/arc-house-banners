import { create } from 'zustand';
import {
  type CountrySlug,
  getCountry,
  DEFAULT_COUNTRY,
  DEFAULT_ROLE,
  type CropState,
  DEFAULT_CROP,
} from '@workspace/papercut-core';
import type { PreparedPhoto } from '@/lib/photo';

interface StudioState {
  countrySlug: CountrySlug;
  city: string;
  handle: string;
  /** second pill line, before the chapter; empty means the line is just "<COUNTRY> CHAPTER" */
  role: string;
  photo: PreparedPhoto | null;
  crop: CropState;
  /** true once someone has tried to download; empty required fields show their errors from then on */
  submitAttempted: boolean;
  /**
   * true while the hero's chapter tour is flipping through the chapters on its
   * own. The address bar does not mirror those flips; only the member's picks.
   */
  touring: boolean;
  setCountry: (slug: CountrySlug) => void;
  setTouring: (touring: boolean) => void;
  setCity: (city: string) => void;
  setHandle: (handle: string) => void;
  setRole: (role: string) => void;
  setPhoto: (photo: PreparedPhoto | null) => void;
  setCrop: (crop: CropState) => void;
  markSubmitAttempted: () => void;
  /** Apply values read from a shared studio link; missing fields are left alone. */
  hydrate: (values: Partial<Pick<StudioState, 'countrySlug' | 'city' | 'handle' | 'role'>>) => void;
}

export const useStudio = create<StudioState>()((set) => ({
  countrySlug: DEFAULT_COUNTRY,
  city: getCountry(DEFAULT_COUNTRY).defaultCity,
  handle: '',
  role: DEFAULT_ROLE,
  photo: null,
  crop: DEFAULT_CROP,
  submitAttempted: false,
  touring: false,
  setTouring: (touring: boolean) => set({ touring }),
  setCountry: (slug: CountrySlug) =>
    set((state: StudioState) => ({
      countrySlug: slug,
      // Swap the suggested city along with the chapter unless the member typed their own.
      city: state.city === getCountry(state.countrySlug).defaultCity ? getCountry(slug).defaultCity : state.city,
    })),
  setCity: (city: string) => set({ city }),
  setHandle: (handle: string) => set({ handle }),
  setRole: (role: string) => set({ role }),
  setPhoto: (photo: PreparedPhoto | null) => set({ photo, crop: DEFAULT_CROP }),
  setCrop: (crop: CropState) => set({ crop }),
  markSubmitAttempted: () => set({ submitAttempted: true }),
  hydrate: (values) =>
    set((state: StudioState) => {
      const countrySlug = values.countrySlug ?? state.countrySlug;
      const cityChanged = values.city !== undefined;
      return {
        countrySlug,
        city: cityChanged ? (values.city as string) : getCountry(countrySlug).defaultCity,
        handle: values.handle ?? state.handle,
        role: values.role ?? state.role,
      };
    }),
}));
