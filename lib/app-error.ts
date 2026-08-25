/**
 * Thrown for expected, user-facing failures (not-found, conflict, validation).
 * Distinguishes app-thrown messages that are safe to show to the user from
 * unexpected errors (e.g. raw Prisma driver failures) whose messages aren't.
 */
export class AppError extends Error {}
