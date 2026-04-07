import { getAppEnvironment, hasYouTrackBaseUrl } from "../env";

export type CurrentUserYouTrackAccess = {
  readonly baseUrl: string;
  readonly authHeader: string;
  readonly userId: string | null;
};

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    return null;
  }

  const bearerPrefix = "Bearer ";
  if (!authorization.startsWith(bearerPrefix)) {
    return null;
  }

  const token = authorization.slice(bearerPrefix.length).trim();
  return token.length > 0 ? token : null;
}

export async function resolveCurrentUserYouTrackAccess(
  request: Request,
): Promise<CurrentUserYouTrackAccess> {
  const environment = getAppEnvironment();
  if (!hasYouTrackBaseUrl(environment)) {
    throw new Error("YOUTRACK_BASE_URL is not configured.");
  }
  const baseUrl = environment.youTrackBaseUrl;

  const token = readBearerToken(request);
  if (token === null) {
    throw new Error("Missing current-user YouTrack bearer token.");
  }

  return {
    baseUrl,
    authHeader: `Bearer ${token}`,
    userId: request.headers.get("x-youtrack-user-id"),
  };
}
