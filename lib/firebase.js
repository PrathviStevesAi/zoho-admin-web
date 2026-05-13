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

export const messaging = async () => {
    const supported = typeof window !== "undefined" && await isSupported();
    return supported ? getMessaging(app) : null;
};

// Use window to store listeners and attachment status to survive HMR/module re-evaluations in dev
if (typeof window !== "undefined") {
    window._fcmListeners = window._fcmListeners || [];
    window._fcmListenerAttached = window._fcmListenerAttached || false;
}

export const onMessageListener = (callback) => {
    if (typeof window === "undefined") return () => {};

    if (callback) {
        window._fcmListeners.push(callback);
        console.log(`[Firebase] New listener added. Total listeners: ${window._fcmListeners.length}`);
    }
    
    // Physical listener attachment
    const attach = async () => {
        if (window._fcmListenerAttached) {
            console.log("[Firebase] FCM listener already attached.");
            return;
        }
        
        console.log("[Firebase] Attaching physical FCM listener...");
        const messagingInstance = await messaging();
        
        if (messagingInstance) {
            window._fcmListenerAttached = true;
            console.log("[Firebase] Messaging instance ready, setting up onMessage...");
            
            onMessage(messagingInstance, (payload) => {
                console.log("[Firebase] Global FCM listener received payload:", payload);
                console.log(`[Firebase] Notifying ${window._fcmListeners.length} listeners...`);
                
                // Work on a copy to avoid issues if listeners change during iteration
                const currentListeners = [...window._fcmListeners];
                currentListeners.forEach((cb, index) => {
                    try {
                        cb(payload);
                    } catch (err) {
                        console.error(`[Firebase] Error in listener ${index}:`, err);
                    }
                });
            });
        } else {
            console.warn("[Firebase] Could not attach listener: messagingInstance is null.");
            window._fcmListenerAttached = false;
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
        const messagingInstance = await messaging();
        if (!messagingInstance) {
            console.log("Messaging not supported in this browser");
            return;
        }

        const permission = await Notification.requestPermission();
        console.log("Notification permission:", permission);

        if (permission === "granted") {
            console.log("Attempting to get FCM token with VAPID key...");
            const currentToken = await getFirebaseToken(messagingInstance, {
                vapidKey:
                    "BB_rSefNooeDgWCh_sXZZR1ormy6cg2zmL6klyCNCQSP-XDmYGa9FYn1mpkILVmTxP5l9VRDWXhSQxPV1zwwnug",
            });
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