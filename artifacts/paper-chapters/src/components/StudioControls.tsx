import { useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ImagePlus } from 'lucide-react';
import { useStudio } from '@/store/use-studio';
import {
  getCountry,
  validateCity,
  validateHandle,
  validateRole,
  CITY_MAX_LENGTH,
  HANDLE_MAX_LENGTH,
  ROLE_MAX_LENGTH,
  normalizeHandle,
  roleLine,
  cropImagePercentages,
} from '@workspace/papercut-core';
import { preparePhoto, loadSamplePhoto, releasePhoto, PHOTO_ACCEPT, type PreparedPhoto } from '@/lib/photo';
import { useRenderFlow } from '@/hooks/use-render-flow';
import { ChapterSelect } from '@/components/ChapterSelect';

const Tick = ({ done }: { done: boolean }) => (
  <span
    className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-300 ${
      done ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--tag)]' : 'border-[var(--line-strong)] text-transparent'
    }`}
    aria-hidden="true"
  >
    <Check size={11} strokeWidth={3.5} />
  </span>
);

function Field({
  label,
  htmlFor,
  done,
  meta,
  children,
}: {
  label: string;
  htmlFor?: string;
  done: boolean;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const Label = htmlFor ? 'label' : 'div';
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)] ink-fade">
          {label}
        </Label>
        <div className="flex items-center gap-3">
          {meta && <span className="text-[0.6875rem] font-semibold tabular-nums text-[var(--muted)] ink-fade">{meta}</span>}
          <Tick done={done} />
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Fades in without animating height: measuring `height: auto` makes framer-motion
 * restore the scroll position mid-frame, which cancels the smooth scroll that
 * brings the failing field into view on submit.
 */
function FieldError({ id, testId, children }: { id?: string; testId?: string; children: ReactNode }) {
  return (
    <motion.div
      id={id}
      data-testid={testId}
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <p className="pt-1 text-sm font-semibold text-[#B3410F]">{children}</p>
    </motion.div>
  );
}

export function StudioControls() {
  const { countrySlug, setCountry, city, setCity, handle, setHandle, role, setRole, photo, setPhoto, crop, submitAttempted } = useStudio();
  const { apiError, readiness, render, busy } = useRenderFlow();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const country = getCountry(countrySlug);

  // Enter in a text field behaves like pressing the download button.
  const submitOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || busy) return;
    e.preventDefault();
    const button = document.querySelector<HTMLButtonElement>('[data-testid="button-download"]');
    const rect = button?.getBoundingClientRect();
    void render(rect ? { origin: { x: rect.left + rect.width / 2, y: rect.top } } : undefined);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const cityError = city || submitAttempted ? validateCity(city) : null;
  const handleError = handle || submitAttempted ? validateHandle(handle) : null;
  const roleError = validateRole(role);

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value.slice(0, CITY_MAX_LENGTH));
  };

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHandle(normalizeHandle(e.target.value).slice(0, HANDLE_MAX_LENGTH));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRole(e.target.value.slice(0, ROLE_MAX_LENGTH));
  };

  // Only the most recent preparation may land; slower earlier ones are released, not applied.
  const photoRequest = useRef(0);
  const adoptPhoto = async (prepare: () => Promise<PreparedPhoto>, fallbackMessage: string) => {
    const ticket = ++photoRequest.current;
    setPhotoError(null);
    try {
      const prepared = await prepare();
      if (ticket !== photoRequest.current) {
        releasePhoto(prepared);
        return;
      }
      releasePhoto(useStudio.getState().photo);
      setPhoto(prepared);
    } catch (err) {
      if (ticket !== photoRequest.current) return;
      setPhotoError(err instanceof Error && err.message ? err.message : fallbackMessage);
    }
  };
  const processFile = (file: File) => adoptPhoto(() => preparePhoto(file), 'Could not load photo');
  const handleSamplePhoto = () => adoptPhoto(loadSamplePhoto, 'Could not load sample photo');
  const openFilePicker = () => fileInputRef.current?.click();

  const finalCityError = cityError || (apiError?.field === 'city' ? apiError.error : null);
  const finalHandleError = handleError || (apiError?.field === 'handle' ? apiError.error : null);
  const finalRoleError = roleError || (apiError?.field === 'role' ? apiError.error : null);
  const finalPhotoError = photoError || (apiError?.field === 'photo' ? apiError.error : null);
  const countryError = apiError?.field === 'country' ? apiError.error : null;
  const globalError = apiError && !apiError.field ? apiError.error : null;

  const divider = <div className="h-px bg-[var(--line)] ink-fade" role="presentation" />;

  return (
    <div className="paper-sheet p-5 sm:p-7 flex flex-col gap-6 ink-fade">
      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="rounded-2xl border border-[#F1C7B2] bg-[#FFF4EE] px-4 py-3 text-[#8A3A12]"
          >
            <p className="text-xs font-bold uppercase tracking-widest">Paper jam</p>
            <p className="mt-1 text-sm font-semibold">{globalError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter */}
      <Field label="Chapter" htmlFor="country-select" done={readiness.chapter}>
        <ChapterSelect
          id="country-select"
          value={countrySlug}
          onChange={setCountry}
          invalid={Boolean(countryError)}
          describedBy={countryError ? 'error-country' : undefined}
        />
        {countryError && (
          <p id="error-country" className="text-sm font-semibold text-[#B3410F]" data-testid="error-country">
            {countryError}
          </p>
        )}
      </Field>

      {divider}

      {/* City */}
      <Field label="City" htmlFor="city-input" done={readiness.city} meta={`${city.length}/${CITY_MAX_LENGTH}`}>
        <input
          id="city-input"
          type="text"
          value={city}
          onChange={handleCityChange}
          className="field"
          placeholder={country.defaultCity}
          autoComplete="off"
          enterKeyHint="next"
          onKeyDown={submitOnEnter}
          aria-invalid={Boolean(finalCityError)}
          aria-describedby={finalCityError ? 'error-city' : undefined}
          data-testid="input-city"
        />
        <AnimatePresence>
          {finalCityError && (
            <FieldError id="error-city" testId="error-city">
              {finalCityError}
            </FieldError>
          )}
        </AnimatePresence>
      </Field>

      {/* Handle */}
      <Field label="X handle" htmlFor="handle-input" done={readiness.handle} meta={`${handle.length}/${HANDLE_MAX_LENGTH}`}>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-[var(--muted)] ink-fade" aria-hidden="true">
            @
          </span>
          <input
            id="handle-input"
            type="text"
            value={handle}
            onChange={handleHandleChange}
            className="field pl-9"
            placeholder="yourhandle"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="go"
            onKeyDown={submitOnEnter}
            aria-invalid={Boolean(finalHandleError)}
            aria-describedby={finalHandleError ? 'error-handle' : undefined}
            data-testid="input-handle"
          />
        </div>
        <AnimatePresence>
          {finalHandleError && (
            <FieldError id="error-handle" testId="error-handle">
              {finalHandleError}
            </FieldError>
          )}
        </AnimatePresence>
      </Field>

      {divider}

      {/* Role: the word before the chapter on the pill's second line */}
      <Field label="Role" htmlFor="role-input" done={!roleError} meta={`${role.length}/${ROLE_MAX_LENGTH}`}>
        <input
          id="role-input"
          type="text"
          value={role}
          onChange={handleRoleChange}
          className="field"
          placeholder="Builder"
          autoComplete="organization-title"
          enterKeyHint="go"
          onKeyDown={submitOnEnter}
          aria-invalid={Boolean(finalRoleError)}
          aria-describedby={finalRoleError ? 'error-role' : 'hint-role'}
          data-testid="input-role"
        />
        <AnimatePresence>
          {finalRoleError && (
            <FieldError id="error-role" testId="error-role">
              {finalRoleError}
            </FieldError>
          )}
        </AnimatePresence>
        <p id="hint-role" className="text-xs font-semibold text-[var(--muted)] ink-fade">
          Shown under your handle as {roleLine(country, role)}. Leave it empty to show only the chapter.
        </p>
      </Field>

      {divider}

      {/* Photo */}
      <Field label="Portrait" done={readiness.photo} meta="Optional">
        {!photo ? (
          <div
            className={`flex flex-col items-center rounded-2xl border-2 border-dashed p-2 text-center transition-colors duration-300 ${
              isDragging
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--line-strong)] bg-[var(--wash)] hover:border-[var(--ink)]'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) processFile(file);
            }}
          >
            {/* A real button opens the picker; the wrapper only handles drag and drop so no controls nest. */}
            <button
              type="button"
              onClick={openFilePicker}
              className="flex w-full flex-col items-center rounded-xl px-3 pt-5 pb-3 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ink)]/15"
              data-testid="dropzone-photo"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sheet)] border border-[var(--line)] text-[var(--ink)] ink-fade">
                <ImagePlus size={18} strokeWidth={2.25} />
              </span>
              <span className="mt-3 text-sm font-bold text-[var(--ink)] ink-fade">Drop a photo or click to choose</span>
              <span className="mt-1 text-xs font-semibold text-[var(--muted)] ink-fade">JPG, PNG or WebP · up to 25 MB · cropped into the ring</span>
            </button>
            <button
              type="button"
              className="mb-4 text-xs font-bold text-[var(--ink)] underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--ink)] transition-colors cursor-pointer ink-fade"
              onClick={() => void handleSamplePhoto()}
              data-testid="button-sample-photo"
            >
              Use a sample photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={PHOTO_ACCEPT}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-3 ink-fade">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-[var(--ink)] bg-white ink-fade">
              <img src={photo.objectUrl} alt="" className="pointer-events-none absolute max-w-none" style={cropImagePercentages(photo.width, photo.height, crop)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--ink)] ink-fade">{photo.fileName}</p>
              <p className="mt-0.5 text-xs font-semibold text-[var(--muted)] ink-fade">Drag the portrait in the preview to reposition it.</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="btn btn-secondary btn-sm ink-fade"
                onClick={() => (document.getElementById('dialog-crop') as HTMLDialogElement | null)?.showModal()}
                data-testid="button-crop"
              >
                Crop
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm ink-fade"
                onClick={() => {
                  photoRequest.current += 1;
                  releasePhoto(photo);
                  setPhoto(null);
                }}
                data-testid="button-remove-photo"
              >
                Remove
              </button>
            </div>
          </div>
        )}
        <AnimatePresence>{finalPhotoError && <FieldError testId="error-photo">{finalPhotoError}</FieldError>}</AnimatePresence>
      </Field>
    </div>
  );
}
