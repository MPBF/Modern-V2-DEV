export const NO_CHROME_PATHS: ReadonlySet<string> = new Set<string>([
  "/login",
  "/mpbf",
  "/setup",
  "/bag-configurator",
  "/display-screen",
  "/factory-simulation",
  "/factory-floor",
  "/alerts",
  "/system-health",
  "/twilio-content",
  "/meta-whatsapp-setup",
  "/whatsapp-setup",
  "/whatsapp-test",
  "/whatsapp-troubleshoot",
  "/whatsapp-production-setup",
  "/whatsapp-final-setup",
  "/whatsapp-template-test",
  "/whatsapp-webhooks",
]);

export function shouldShowChrome(pathname: string): boolean {
  return !NO_CHROME_PATHS.has(pathname);
}
