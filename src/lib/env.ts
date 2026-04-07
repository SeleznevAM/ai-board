export type AppEnvironment = {
  readonly youTrackBaseUrl: string | null;
  readonly sessionMode: "current-user";
  readonly expectsAuthenticatedUser: true;
  readonly authStrategy: "ambient-session";
};

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getAppEnvironment(): AppEnvironment {
  return {
    youTrackBaseUrl: readOptionalEnv("YOUTRACK_BASE_URL"),
    sessionMode: "current-user",
    expectsAuthenticatedUser: true,
    authStrategy: "ambient-session",
  };
}

export function hasYouTrackBaseUrl(
  environment: AppEnvironment,
): environment is AppEnvironment & { readonly youTrackBaseUrl: string } {
  return environment.youTrackBaseUrl !== null;
}
