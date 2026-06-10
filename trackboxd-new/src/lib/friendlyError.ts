const GENERIC_MESSAGES = new Set([
    "Internal server error",
    "Failed to fetch",
]);

export function friendlyError(
    message?: string | null,
    fallback = "Something went wrong. Please try again."
): string {
    if (!message || GENERIC_MESSAGES.has(message)) return fallback;
    return message;
}
