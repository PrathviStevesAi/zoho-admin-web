importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyC-kYkv_DX8OQmbxxUBXkFfzXwstlFG7Ls",
    authDomain: "fastguard-a3a07.firebaseapp.com",
    projectId: "fastguard-a3a07",
    storageBucket: "fastguard-a3a07.firebasestorage.app",
    messagingSenderId: "391694555688",
    appId: "1:391694555688:web:3e2511fd14b09b4513b31d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
    );

    const title = payload.notification?.title || payload.data?.title || "New Notification";
    const body = payload.notification?.body || payload.data?.body || "You have a new message.";

    const notificationOptions = {
        body: body,
        icon: "/images/website-logo.png",
        data: payload.data
    };

    self.registration.showNotification(
        title,
        notificationOptions
    );
});