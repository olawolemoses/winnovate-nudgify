// Minimal service worker that defers logic to Nudgify's hosted script
const swLocation = new URL(self.location.href);
const backendUrl = "https://prod.nudgify.io";
const siteId = swLocation.searchParams.get("site_id");

const remoteScript = new URL("/widget/push-sw.js", backendUrl.replace(/\/$/, ""));

if (siteId) {
    remoteScript.searchParams.set("site_id", siteId);
}

importScripts(remoteScript.toString());
