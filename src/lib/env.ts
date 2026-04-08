export type AppEnvironment = {
  readonly youTrackBaseUrl: string | null;
  readonly youTrackToken: string | null;
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
    youTrackToken: readOptionalEnv("YOUTRACK_TOKEN"),
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

export function hasYouTrackToken(
  environment: AppEnvironment,
): environment is AppEnvironment & { readonly youTrackToken: string } {
  return environment.youTrackToken !== null;
}
