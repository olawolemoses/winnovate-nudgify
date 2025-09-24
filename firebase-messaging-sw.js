// Firebase messaging service worker
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBK6NgQ5aKcmuLt4QdTng7LdsYkGXlH1qo",
    authDomain: "nudgify-nuxt-auth.firebaseapp.com",
    projectId: "nudgify-nuxt-auth",
    storageBucket: "nudgify-nuxt-auth.firebasestorage.app",
    messagingSenderId: "569400564094",
    appId: "1:569400564094:web:13944ee178b1b3e0d83b2f",
    measurementId: "G-F1YVT9MGFB",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log("Received background message: ", payload);

    try {
        // Extract notification data with fallbacks
        const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
        const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new message';

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
        return self.registration.showNotification(notificationTitle, notificationOptions)
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
            tag: "nudgify-fallback"
        });
    }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(clients.openWindow(url));
});
