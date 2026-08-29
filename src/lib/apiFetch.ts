export const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.";

/**
 * fetch() throws on network failure (offline, DNS, timeout) instead of
 * resolving with a response. Every caller in this app was treating that as
 * "can't happen" and left loading/disabled state stuck forever when it did.
 * This never throws — callers check for null instead.
 */
export async function apiFetch(
  input: string,
  init?: RequestInit
): Promise<Response | null> {
  try {
    return await fetch(input, init);
  } catch {
    return null;
  }
}
