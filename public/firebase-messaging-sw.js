importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

self.addEventListener("install", (event) => {
    console.log("[firebase-messaging-sw.js] Installing new SW version...");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[firebase-messaging-sw.js] Activating new SW version...");
    event.waitUntil(self.clients.claim());
});

firebase.initializeApp({
    apiKey: "AIzaSyC-kYkv_DX8OQmbxxUBXkFfzXwstlFG7Ls",
    authDomain: "fastguard-a3a07.firebaseapp.com",
    projectId: "fastguard-a3a07",
    storageBucket: "fastguard-a3a07.firebasestorage.app",
    messagingSenderId: "391694555688",
    appId: "1:391694555688:web:3e2511fd14b09b4513b31d"
});

const messaging = firebase.messaging();
const notificationChannel = new BroadcastChannel("fcm-notifications");
messaging.onBackgroundMessage(function (payload) {
    console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
    );

    const title = payload.notification?.title || payload.data?.title || "New Notification";
    const body = payload.notification?.body || payload.data?.body || payload.notification?.message || payload.data?.message || payload.message || "You have a new message.";

    const notificationOptions = {
        body: body,
        icon: "/images/website-logo.png",
        data: payload.data
    };

    self.registration.showNotification(
        title,
        notificationOptions
    );

    notificationChannel.postMessage({
        type: "FCM_FOREGROUND_MESSAGE",
        payload: payload,
    });
});

self.addEventListener("push", function (event) {
    let payload = null;
    try {
        payload = event.data?.json();
    } catch (e) {
        console.warn("[firebase-messaging-sw.js] Could not parse push data:", e);
        return;
    }

    if (!payload) return;

    console.log("[firebase-messaging-sw.js] Push event received, broadcasting to clients:", payload);

    notificationChannel.postMessage({
        type: "FCM_FOREGROUND_MESSAGE",
        payload: payload,
    });

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            console.log(`[firebase-messaging-sw.js] postMessage to ${clients.length} client(s)`);
            clients.forEach((client) => {
                client.postMessage({
                    type: "FCM_FOREGROUND_MESSAGE",
                    payload: payload,
                });
            });
        })
    );
});