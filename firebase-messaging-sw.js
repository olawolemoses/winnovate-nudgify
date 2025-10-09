importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const API_BASE_URL = 'https://prod-api.nudgify.io';
const swLocation = new URL(self.location.href);
const siteId = swLocation.searchParams.get('site_id');

async function fetchFirebaseConfig() {
    try {
        const url = new URL('/api/v1/push/config', API_BASE_URL);
        if (siteId) {
            url.searchParams.set('site_id', siteId);
        }

        const response = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Push config request failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data?.firebase) {
            throw new Error('Firebase configuration missing in response');
        }

        return data.firebase;
    } catch (error) {
        console.error('[Nudgify Push] Failed to fetch Firebase configuration', error);
        throw error;
    }
}

const messagingPromise = fetchFirebaseConfig()
    .then((firebaseConfig) => {
        firebase.initializeApp(firebaseConfig);
        return firebase.messaging();
    })
    .catch((error) => {
        console.error('[Nudgify Push] Firebase initialisation failed', error);
        return null;
    });

messagingPromise.then((messaging) => {
    if (!messaging) {
        return;
    }

    messaging.onBackgroundMessage((payload) => {
        console.log('[Nudgify Push] Background message received', payload);

        try {
            const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
            const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new message';

            const notificationOptions = {
                body: notificationBody,
                icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'nudgify-' + (payload.data?.notification_id || Date.now()),
                requireInteraction: true,
                data: {
                    url: payload.data?.url || payload.fcm_options?.link || '/',
                    notification_id: payload.data?.notification_id,
                    site_id: payload.data?.site_id || siteId || null,
                },
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        } catch (error) {
            console.error('[Nudgify Push] Failed to display notification', error);
            self.registration.showNotification('New Message', {
                body: 'You have a new notification',
                icon: '/favicon.ico',
                tag: 'nudgify-fallback',
            });
        }
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(clients.openWindow(url));
});
