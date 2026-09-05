import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { COUNTRIES, getCountry, type Country, type CountrySlug } from '@workspace/papercut-core';
import { baseImageUrl } from '@/lib/banner-assets';

type Props = {
  id: string;
  value: CountrySlug;
  onChange: (slug: CountrySlug) => void;
  invalid?: boolean;
  describedBy?: string;
};

/** A miniature of the chapter's banner art, 3:1 like the real thing. */
function Thumb({ country, className }: { country: Country; className: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-[7px] border border-black/10 bg-[var(--sheet)] ${className}`} aria-hidden="true">
      <img
        src={baseImageUrl(country.slug, 'thumb')}
        alt=""
        width={1200}
        height={400}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </span>
  );
}

/**
 * The chapter picker: a Radix Select dressed as a paper sheet. Each row shows
 * the banner art, the name in that chapter's own ink, its number and region.
 * Radix handles the combobox semantics, arrow keys, Home/End and type-ahead;
 * `position="popper"` keeps it a real drop-down under the trigger.
 */
export function ChapterSelect({ id, value, onChange, invalid, describedBy }: Props) {
  const current = getCountry(value);

  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as CountrySlug)}>
      <Select.Trigger
        id={id}
        className="field group flex items-center gap-3.5 text-left cursor-pointer data-[state=open]:border-[var(--ink)] data-[state=open]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ink)_12%,transparent)]"
        aria-label={`Chapter: ${current.name}`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-testid="select-country"
        data-value={value}
      >
        <Thumb country={current} className="h-8 w-[5.5rem] sm:w-28" />
        <span className="flex min-w-0 flex-1 flex-col">
          {/* Not asChild: Radix wraps Value children in a keyed Fragment and Slot would merge props onto it. */}
          <Select.Value className="truncate font-display text-lg font-bold leading-tight text-[var(--ink)] ink-fade" data-testid="text-selected-country">
            {current.name}
          </Select.Value>
          <span className="mt-0.5 truncate text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)] ink-fade">
            {current.chapter} · {current.region}
          </span>
        </span>
        <Select.Icon asChild>
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className="shrink-0 text-[var(--muted)] transition-transform duration-300 ease-out group-data-[state=open]:rotate-180"
          />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          className="z-[60] w-[var(--radix-select-trigger-width)] max-h-[min(36rem,var(--radix-select-content-available-height))] overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--sheet)] shadow-[0_1px_0_color-mix(in_srgb,var(--ink)_6%,transparent),0_24px_50px_-20px_color-mix(in_srgb,var(--ink)_35%,transparent)] origin-[var(--radix-select-content-transform-origin)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          data-testid="menu-country"
        >
          <Select.ScrollUpButton className="flex h-7 items-center justify-center bg-[var(--sheet)] text-[var(--muted)]">
            <ChevronUp size={16} strokeWidth={2.5} />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-1.5">
            <div className="flex items-center justify-between px-3 pb-1.5 pt-2">
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Ten chapters</span>
              <span className="hidden text-[0.625rem] font-semibold text-[var(--muted)] sm:inline">Type a name to jump</span>
            </div>
            {COUNTRIES.map((c) => (
              <Select.Item
                key={c.slug}
                value={c.slug}
                textValue={c.name}
                className="group/item relative flex cursor-pointer select-none items-center gap-3 rounded-[12px] px-2.5 py-2 outline-none transition-[background-color,box-shadow] data-[state=checked]:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] data-[highlighted]:shadow-[inset_0_0_0_2px_var(--ink)]"
                data-testid={`option-country-${c.slug}`}
              >
                <Thumb country={c} className="h-7 w-[5.25rem]" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <Select.ItemText asChild>
                    <span className="truncate font-display text-[0.9375rem] font-bold leading-tight" style={{ color: c.ink }}>
                      {c.name}
                    </span>
                  </Select.ItemText>
                  <span className="mt-0.5 truncate text-[0.625rem] font-bold uppercase tracking-[0.16em]" style={{ color: c.ink, opacity: 0.8 }}>
                    {c.chapter} · {c.region}
                  </span>
                </span>
                <Select.ItemIndicator asChild>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--tag)]" style={{ backgroundColor: c.ink }}>
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="flex h-7 items-center justify-center bg-[var(--sheet)] text-[var(--muted)]">
            <ChevronDown size={16} strokeWidth={2.5} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
