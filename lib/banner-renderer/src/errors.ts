export type RenderErrorField = "country" | "city" | "handle" | "role" | "photo";

/** A rejection the API can hand straight back: HTTP status, member-facing message, offending field. */
export class RenderError extends Error {
  readonly name = "RenderError";
  constructor(
    readonly status: 400 | 413 | 422,
    message: string,
    readonly field?: RenderErrorField,
  ) {
    super(message);
  }
}
