export type FinanceErrorCode =
  | "INVALID_INPUT"
  | "INVALID_DATE"
  | "INVALID_DATE_RANGE"
  | "MISSING_CONTEXT"
  | "UNSAFE_INTEGER"
  | "OVERFLOW";

export class FinanceError extends Error {
  constructor(
    public readonly code: FinanceErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "FinanceError";
  }
}

export function requireFields(
  value: Record<string, unknown>,
  fields: string[],
  context: string,
): void {
  const missingFields = fields.filter((field) => value[field] === undefined || value[field] === null);
  if (missingFields.length) {
    throw new FinanceError("MISSING_CONTEXT", `${context} is missing required context`, {
      missingFields,
    });
  }
}
