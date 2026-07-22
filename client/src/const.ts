export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Se a variável VITE_OAUTH_PORTAL_URL não estiver definida, usa a origem atual como padrão seguro
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || window.location.origin;
  const appId = import.meta.env.VITE_APP_ID || "";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // Garante que não vai quebrar se oauthPortalUrl não for uma URL completa
  const baseUrl = oauthPortalUrl.startsWith("http") 
    ? oauthPortalUrl 
    : window.location.origin;

  const url = new URL("/app-auth", baseUrl);
  if (appId) url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};