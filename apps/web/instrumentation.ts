export async function register() {
  const { validateWebEnv } = await import("./src/lib/env");
  validateWebEnv();
}
