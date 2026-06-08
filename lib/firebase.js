import { initializeApp } from "firebase/app";
import { getMessaging, getToken as getFirebaseToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyC-kYkv_DX8OQmbxxUBXkFfzXwstlFG7Ls",
    authDomain: "fastguard-a3a07.firebaseapp.com",
    projectId: "fastguard-a3a07",
    storageBucket: "fastguard-a3a07.firebasestorage.app",
    messagingSenderId: "391694555688",
    appId: "1:391694555688:web:3e2511fd14b09b4513b31d",
};

const app = initializeApp(firebaseConfig);

let _swRegistration = null;

async function getServiceWorkerRegistration() {
    if (_swRegistration) return _swRegistration;

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
            _swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
                updateViaCache: "none",
            });
            console.log("[Firebase] Service Worker registered with scope:", _swRegistration.scope);

            _swRegistration.update().catch((err) => {
                console.warn("[Firebase] SW update check failed:", err);
            });
        } catch (err) {
            console.error("[Firebase] Service Worker registration failed:", err);
        }
    }
    return _swRegistration;
}

let _messagingInstance = null;
let _messagingPromise = null;

export const messaging = async () => {
    if (_messagingInstance) return _messagingInstance;
    if (_messagingPromise) return _messagingPromise;

    _messagingPromise = (async () => {
        const supported = typeof window !== "undefined" && await isSupported();
        if (!supported) return null;

        await getServiceWorkerRegistration();

        _messagingInstance = getMessaging(app);
        return _messagingInstance;
    })();

    _messagingInstance = await _messagingPromise;
    _messagingPromise = null;
    return _messagingInstance;
};

if (typeof window !== "undefined") {
    window._fcmListeners = window._fcmListeners || [];
    window._fcmListenerAttached = window._fcmListenerAttached || false;
    window._fcmSwListenerAttached = window._fcmSwListenerAttached || false;
    window._fcmSeenMessages = window._fcmSeenMessages || new Set();
    window._fcmFocusListenerAttached = window._fcmFocusListenerAttached || false;
}

function notifyListeners(payload, source) {
    const messageId = payload?.messageId || payload?.fcmMessageId || payload?.data?.notification_id || `${payload?.notification?.title}-${Date.now()}`;
    const dedupeKey = `${messageId}`;

    if (window._fcmSeenMessages.has(dedupeKey)) {
        console.log(`[Firebase] Duplicate message from ${source}, skipping. Key: ${dedupeKey}`);
        return;
    }

    window._fcmSeenMessages.add(dedupeKey);
    setTimeout(() => window._fcmSeenMessages.delete(dedupeKey), 10000);

    const currentListeners = [...(window._fcmListeners || [])];
    console.log(`[Firebase] Notifying ${currentListeners.length} listeners from ${source}...`);

    currentListeners.forEach((cb, index) => {
        try {
            cb(payload);
        } catch (err) {
            console.error(`[Firebase] Error in listener ${index}:`, err);
        }
    });
}

function attachServiceWorkerBridge() {
    if (typeof window === "undefined") return;
    if (window._fcmSwListenerAttached) return;
    window._fcmSwListenerAttached = true;

    try {
        const channel = new BroadcastChannel("fcm-notifications");
        channel.addEventListener("message", (event) => {
            if (event.data && event.data.type === "FCM_FOREGROUND_MESSAGE") {
                console.log("[Firebase] Received FCM message via BroadcastChannel:", event.data.payload);
                notifyListeners(event.data.payload, "BroadcastChannel");
            }
        });
        console.log("[Firebase] BroadcastChannel listener attached.");
    } catch (e) {
        console.warn("[Firebase] BroadcastChannel not supported, falling back to postMessage only.");
    }

    navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "FCM_FOREGROUND_MESSAGE") {
            console.log("[Firebase] Received FCM message via SW postMessage:", event.data.payload);
            notifyListeners(event.data.payload, "SW-postMessage");
        }
    });
    console.log("[Firebase] ServiceWorker message bridge attached.");
}

function attachFocusRefresh() {
    if (typeof window === "undefined") return;
    if (window._fcmFocusListenerAttached) return;
    window._fcmFocusListenerAttached = true;

    let lastFocusRefresh = 0;

    window.addEventListener("focus", () => {
        const now = Date.now();
        if (now - lastFocusRefresh < 5000) return;
        lastFocusRefresh = now;

        console.log("[Firebase] Tab focused — refreshing notifications...");
        const currentListeners = [...(window._fcmListeners || [])];
        currentListeners.forEach((cb) => {
            try {
                cb({ _focusRefresh: true });
            } catch (err) {
            }
        });
    });
    console.log("[Firebase] Focus-based refresh listener attached.");
}

export const onMessageListener = (callback) => {
    if (typeof window === "undefined") return () => { };

    if (callback) {
        window._fcmListeners.push(callback);
        console.log(`[Firebase] New listener added. Total listeners: ${window._fcmListeners.length}`);
    }

    attachServiceWorkerBridge();
    attachFocusRefresh();

    // Physical Firebase onMessage listener attachment (for data-only messages)
    const attach = async () => {
        if (window._fcmListenerAttached) return;
        if (window._fcmAttaching) return;
        window._fcmAttaching = true;

        console.log("[Firebase] Attaching physical FCM onMessage listener...");
        try {
            const messagingInst = await messaging();

            if (messagingInst) {
                console.log("[Firebase] Messaging instance ready, setting up onMessage...");

                onMessage(messagingInst, (payload) => {
                    console.log("[Firebase] FCM onMessage received payload:", payload);
                    notifyListeners(payload, "onMessage");
                });
                window._fcmListenerAttached = true;
                console.log("[Firebase] onMessage listener attached successfully.");
            } else {
                console.warn("[Firebase] Could not attach listener: messagingInstance is null.");
            }
        } catch (error) {
            console.error("[Firebase] Error during listener attachment:", error);
        } finally {
            window._fcmAttaching = false;
        }
    };

    attach();

    // Return cleanup function
    return () => {
        if (typeof window !== "undefined" && window._fcmListeners) {
            console.log("[Firebase] Removing a listener...");
            window._fcmListeners = window._fcmListeners.filter(cb => cb !== callback);
        }
    };
};

export const generateToken = async () => {
    try {
        console.log("Generating FCM token...");
        const messagingInst = await messaging();
        if (!messagingInst) {
            console.log("Messaging not supported in this browser");
            return;
        }

        const permission = await Notification.requestPermission();
        console.log("Notification permission:", permission);

        if (permission === "granted") {
            console.log("Attempting to get FCM token with VAPID key...");

            // Pass the service worker registration to getToken so Firebase uses our SW
            const swReg = await getServiceWorkerRegistration();
            const tokenOptions = {
                vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY || "BB_rSefNooeDgWCh_sXZZR1ormy6cg2zmL6klyCNCQSP-XDmYGa9FYn1mpkILVmTxP5l9VRDWXhSQxPV1zwwnug",
            };
            if (swReg) {
                tokenOptions.serviceWorkerRegistration = swReg;
            }

            const currentToken = await getFirebaseToken(messagingInst, tokenOptions);
            console.log("Token response received:", !!currentToken);

            if (currentToken) {
                console.log("FCM Token:", currentToken);
                return currentToken;
            } else {
                console.log("No registration token available");
            }
        } else {
            console.log("Notification permission not granted. Status:", permission);
        }
    } catch (error) {
        console.error("Detailed error in generateToken:", error);
        if (error.code) console.error("Error code:", error.code);
        if (error.message) console.error("Error message:", error.message);
    }
};