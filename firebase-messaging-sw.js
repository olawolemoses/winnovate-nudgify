// Firebase messaging service worker
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBK6NgQ5kGmuIt40dTng7LdsYkGXlH1go",
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

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        tag: "nudgify-fcm",
        data: {
            url: payload.data?.url || "/",
        },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(clients.openWindow(url));
});
