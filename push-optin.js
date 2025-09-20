/**
 * Nudgify Push Notification Opt-in Extension
 * Handles service worker registration and permission management
 *
 * Usage: <script src="push-optin.js" data-site-id="abc123"></script>
 */

(function () {
    "use strict";

    // Configuration from script tag data attributes
    const script = document.currentScript || document.querySelector('script[src*="push-optin.js"]');
    const config = {
        siteId: script?.getAttribute("data-site-id") || "",
        buttonText: script?.getAttribute("data-button-text") || "Enable Push Notifications",
        buttonStyle: script?.getAttribute("data-button-style") || "nudgify-push-btn",
        autoRequest: script?.getAttribute("data-auto-request") === "true",
        serviceWorkerPath: script?.getAttribute("data-sw-path") || "/firebase-messaging-sw.js",
        backendUrl: script?.getAttribute("data-backend-url") || "http://localhost:8000",
        debug: script?.getAttribute("data-debug") === "true",
    };

    // Default customizations (fallback)
    let customizations = {
        title: "Stay in the Loop",
        description:
            "Get notified about important updates, exclusive offers, and new features. You can unsubscribe anytime.",
        allowText: "Allow Notifications",
        denyText: "Not Now",
        icon: "bell",
    };

    // Logging utility
    function log(...args) {
        if (config.debug) {
            console.log("[Nudgify Push]", ...args);
        }
    }

    // Fetch customizations from API
    async function fetchCustomizations() {
        if (!config.siteId) {
            log("No site ID provided, using default customizations");
            return;
        }

        try {
            const response = await fetch(`${config.backendUrl}/api/v1/push/customizations?site_id=${config.siteId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.ok && data.customization) {
                    customizations = {
                        title: data.customization.title || customizations.title,
                        description: data.customization.description || customizations.description,
                        allowText: data.customization.allowText || customizations.allowText,
                        denyText: data.customization.denyText || customizations.denyText,
                        icon: data.customization.icon || customizations.icon,
                    };
                    log("Customizations loaded:", customizations);
                } else {
                    log("No customizations found, using defaults");
                }
            } else {
                log("Failed to fetch customizations, using defaults");
            }
        } catch (error) {
            log("Error fetching customizations:", error);
        }
    }

    // Get icon SVG path based on icon type
    function getIconPath(iconType) {
        const iconPaths = {
            bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
            notification:
                "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
            message:
                "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z",
            megaphone:
                "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
            star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
        };
        return iconPaths[iconType] || iconPaths.bell;
    }

    // Check if push notifications are supported
    function isPushSupported() {
        return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    }

    // Check current permission status
    function getPermissionStatus() {
        return Notification.permission;
    }

    // Create opt-in modal
    function createOptInModal() {
        // Create overlay
        const overlay = document.createElement("div");
        overlay.id = "nudgify-push-overlay";
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Create modal
        const modal = document.createElement("div");
        modal.id = "nudgify-push-modal";
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 420px;
            width: 90%;
            padding: 0;
            z-index: 10001;
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Create content with dynamic customizations
        modal.innerHTML = `
            <div style="padding: 32px 24px 24px 24px; text-align: center;">
                <div style="margin-bottom: 16px;">
                    <div style="
                        width: 60px;
                        height: 60px;
                        margin: 0 auto 16px auto;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
                    ">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="${getIconPath(customizations.icon)}"/>
                        </svg>
                    </div>
                </div>

                <h2 style="
                    margin: 0 0 12px 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: #1a1a1a;
                    line-height: 1.3;
                ">${customizations.title}</h2>

                <p style="
                    margin: 0 0 24px 0;
                    font-size: 16px;
                    color: #666;
                    line-height: 1.5;
                ">${customizations.description}</p>

                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="nudgify-push-allow" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                        min-width: 140px;
                    ">${customizations.allowText}</button>

                    <button id="nudgify-push-deny" style="
                        background: #f8f9fa;
                        color: #666;
                        border: 1px solid #e9ecef;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        min-width: 100px;
                    ">${customizations.denyText}</button>
                </div>
            </div>
        `;

        // Add hover effects
        const allowBtn = modal.querySelector("#nudgify-push-allow");
        const denyBtn = modal.querySelector("#nudgify-push-deny");

        allowBtn.addEventListener("mouseenter", () => {
            allowBtn.style.transform = "translateY(-1px)";
            allowBtn.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
        });

        allowBtn.addEventListener("mouseleave", () => {
            allowBtn.style.transform = "translateY(0)";
            allowBtn.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
        });

        denyBtn.addEventListener("mouseenter", () => {
            denyBtn.style.background = "#e9ecef";
            denyBtn.style.transform = "translateY(-1px)";
        });

        denyBtn.addEventListener("mouseleave", () => {
            denyBtn.style.background = "#f8f9fa";
            denyBtn.style.transform = "translateY(0)";
        });

        // Event listeners
        allowBtn.addEventListener("click", () => {
            hideOptInModal();
            requestPermission();
        });

        denyBtn.addEventListener("click", () => {
            hideOptInModal();
            trackEvent("permission_dismissed");
        });

        // Click overlay to close
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                hideOptInModal();
                trackEvent("permission_dismissed");
            }
        });

        // Append to body
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        return { overlay, modal };
    }

    // Show opt-in modal
    function showOptInModal() {
        const existingOverlay = document.getElementById("nudgify-push-overlay");
        if (existingOverlay) {
            existingOverlay.style.display = "block";
            setTimeout(() => {
                existingOverlay.style.opacity = "1";
                const modal = existingOverlay.querySelector("#nudgify-push-modal");
                if (modal) {
                    modal.style.transform = "translate(-50%, -50%) scale(1)";
                }
            }, 10);
            return existingOverlay;
        }

        const { overlay, modal } = createOptInModal();
        overlay.style.display = "block";

        // Animate in
        setTimeout(() => {
            overlay.style.opacity = "1";
            modal.style.transform = "translate(-50%, -50%) scale(1)";
        }, 10);

        return overlay;
    }

    // Hide opt-in modal
    function hideOptInModal() {
        const overlay = document.getElementById("nudgify-push-overlay");
        if (overlay) {
            const modal = overlay.querySelector("#nudgify-push-modal");

            // Animate out
            overlay.style.opacity = "0";
            if (modal) {
                modal.style.transform = "translate(-50%, -50%) scale(0.9)";
            }

            setTimeout(() => {
                overlay.style.display = "none";
            }, 300);
        }
    }

    // Legacy function names for backward compatibility
    function showOptInButton() {
        return showOptInModal();
    }

    function hideOptInButton() {
        return hideOptInModal();
    }

    // Register service worker
    async function registerServiceWorker() {
        try {
            log("Registering service worker...");
            const registration = await navigator.serviceWorker.register(config.serviceWorkerPath);
            log("Service worker registered:", registration.scope);

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            log("Service worker ready");

            return registration;
        } catch (error) {
            log("Service worker registration failed:", error);
            throw error;
        }
    }

    // Request notification permission
    async function requestPermission() {
        try {
            log("Requesting notification permission...");

            // Register service worker first
            await registerServiceWorker();

            // Request permission
            const permission = await Notification.requestPermission();
            log("Permission result:", permission);

            if (permission === "granted") {
                log("Permission granted - service worker will handle subscription");
                hideOptInModal();

                // Show success message briefly
                showTemporaryMessage("✓ Push notifications enabled!", "success");

                // Track successful opt-in
                trackEvent("permission_granted");
            } else if (permission === "denied") {
                log("Permission denied");
                hideOptInModal();
                trackEvent("permission_denied");
            } else {
                log("Permission dismissed");
                trackEvent("permission_dismissed");
            }

            return permission;
        } catch (error) {
            log("Error requesting permission:", error);
            showTemporaryMessage("Failed to enable notifications", "error");
            trackEvent("permission_error", { error: error.message });
            throw error;
        }
    }

    // Show temporary message
    function showTemporaryMessage(text, type = "info") {
        const message = document.createElement("div");
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 10001;
            transition: opacity 0.3s ease;
            ${type === "success" ? "background: #28a745;" : "background: #dc3545;"}
        `;
        message.textContent = text;

        document.body.appendChild(message);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            message.style.opacity = "0";
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }

    // Track events (basic implementation)
    function trackEvent(eventType, data = {}) {
        try {
            // Send to Nudgify analytics endpoint
            fetch(`http://localhost:8000/api/v1/push/track`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    site_id: config.siteId,
                    event_type: eventType,
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    ...data,
                }),
            }).catch((err) => log("Tracking failed:", err));
        } catch (error) {
            log("Tracking error:", error);
        }
    }

    // Initialize the opt-in system
    async function init() {
        log("Initializing push opt-in system...");

        // Validate configuration
        if (!config.siteId) {
            console.error("[Nudgify Push] Missing data-site-id attribute");
            return;
        }

        // Check browser support
        if (!isPushSupported()) {
            log("Push notifications not supported");
            trackEvent("unsupported_browser");
            return;
        }

        // Fetch customizations first
        await fetchCustomizations();

        const permission = getPermissionStatus();
        log("Current permission status:", permission);

        // Track page view
        trackEvent("page_view", { permission_status: permission });

        // Handle different permission states
        if (permission === "default") {
            // Show opt-in UI
            if (config.autoRequest) {
                // Auto-request permission after a short delay
                setTimeout(requestPermission, 1000);
            } else {
                // Show opt-in modal
                showOptInModal();
            }
        } else if (permission === "granted") {
            // Already granted - ensure service worker is registered
            registerServiceWorker().catch((error) => {
                log("Failed to register service worker:", error);
            });
        } else if (permission === "denied") {
            // Permission denied - nothing to do
            log("Permission previously denied");
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // Expose API for manual control
    window.NudgifyPush = {
        requestPermission,
        getPermissionStatus,
        showOptInButton,
        hideOptInButton,
        config,
    };
})();
