/*
  Reading configuration at runtime.

  Astro (via Vite) only substitutes `import.meta.env.X` for variables it can see
  when the site is built, and only for the public prefix. Secrets set on the
  hosting platform are not there at build time, so they have to be read from
  process.env when the function actually runs.

  Reading both, runtime first, covers the deployed case and local `.env` alike.
*/
export function env(name: string): string | undefined {
  const runtime = (globalThis as any)?.process?.env?.[name];
  if (runtime) return runtime;
  const built = (import.meta.env as Record<string, unknown>)[name];
  return typeof built === 'string' && built ? built : undefined;
}

export function requireEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`${name} is not set on the hosting project.`);
  return value;
}
