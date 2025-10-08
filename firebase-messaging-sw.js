// Firebase messaging service worker
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const swLocation = new URL(self.location.href);
const backendParam = swLocation.searchParams.get("backend");
const backendUrl = backendParam ? decodeURIComponent(backendParam) : "https://prod.nudgify.io";
const siteId = swLocation.searchParams.get("site_id");

async function fetchFirebaseConfig() {
    if (!backendUrl) {
        throw new Error("Missing backend URL for push configuration");
    }

    const baseUrl = backendUrl.replace(/\/$/, "");
    const url = new URL(baseUrl + "/api/v1/push/config");

    if (siteId) {
        url.searchParams.set("site_id", siteId);
    }

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Push config request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data?.ok === false || !data?.firebase) {
        throw new Error(data?.message || "Invalid push configuration response");
    }

    return data.firebase;
}

const messagingPromise = fetchFirebaseConfig()
    .then((firebaseConfig) => {
        firebase.initializeApp(firebaseConfig);
        return firebase.messaging();
    })
    .catch((error) => {
        console.error("Failed to initialize Firebase messaging:", error);
        return null;
    });

messagingPromise.then((messaging) => {
    if (!messaging) {
        return;
    }

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
        console.log("Received background message: ", payload);

        try {
            // Extract notification data with fallbacks
            const notificationTitle = payload.notification?.title || payload.data?.title || "New Notification";
            const notificationBody = payload.notification?.body || payload.data?.body || "You have a new message";

            const notificationOptions = {
                body: notificationBody,
                icon: payload.notification?.icon || payload.data?.icon || "/favicon.ico",
                badge: "/favicon.ico",
                tag: "nudgify-" + (payload.data?.notification_id || Date.now()),
                requireInteraction: true, // Keep notification visible until user interacts
                data: {
                    url: payload.data?.url || payload.fcm_options?.link || "/",
                    notification_id: payload.data?.notification_id,
                    site_id: payload.data?.site_id,
                },
            };

            console.log("Showing notification:", notificationTitle, notificationOptions);

            // Show the notification
            return self.registration
                .showNotification(notificationTitle, notificationOptions)
                .then(() => {
                    console.log("✅ Notification displayed successfully");
                })
                .catch((error) => {
                    console.error("❌ Failed to show notification:", error);
                });
        } catch (error) {
            console.error("❌ Error processing background message:", error);

            // Fallback notification
            return self.registration.showNotification("New Message", {
                body: "You have a new notification",
                icon: "/favicon.ico",
                tag: "nudgify-fallback",
            });
        }
    });
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(clients.openWindow(url));
});