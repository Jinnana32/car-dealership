"use client";

import { MessageCircleMore } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";

type FacebookMessengerChatProps = {
  messengerHref: string | null;
  pageId: string | null;
  sdkVersion?: string;
  themeColor?: string;
};

type FacebookSdk = {
  init: (params: { version: string; xfbml: boolean }) => void;
  XFBML: {
    parse: (node?: HTMLElement) => void;
  };
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const CHAT_ROOT_ID = "facebook-customer-chat-root";
const DEFAULT_THEME_COLOR = "#e11d2e";
const CUSTOMER_CHAT_SDK_VERSION = "v21.0";
const SDK_SCRIPT_ID = "facebook-jssdk";
const PLUGIN_CHECK_MS = 5000;

function ensureFbRoot(): void {
  if (document.getElementById("fb-root")) {
    return;
  }

  const fbRoot = document.createElement("div");
  fbRoot.id = "fb-root";
  document.body.appendChild(fbRoot);
}

function ensureChatRoot(input: {
  pageId: string;
  themeColor: string;
}): HTMLDivElement {
  const existing = document.getElementById(CHAT_ROOT_ID);

  if (existing instanceof HTMLDivElement) {
    existing.setAttribute("attribution", "biz_inbox");
    existing.setAttribute("page_id", input.pageId);
    existing.setAttribute("theme_color", input.themeColor);

    return existing;
  }

  const chatRoot = document.createElement("div");
  chatRoot.id = CHAT_ROOT_ID;
  chatRoot.className = "fb-customerchat";
  chatRoot.setAttribute("attribution", "biz_inbox");
  chatRoot.setAttribute("page_id", input.pageId);
  chatRoot.setAttribute("theme_color", input.themeColor);
  document.body.appendChild(chatRoot);

  return chatRoot;
}

function loadFacebookSdk(sdkVersion: string): Promise<void> {
  if (window.FB?.XFBML) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(SDK_SCRIPT_ID);

  if (existingScript) {
    return new Promise((resolve) => {
      const checkSdk = (): void => {
        if (window.FB?.XFBML) {
          resolve();
          return;
        }

        window.setTimeout(checkSdk, 50);
      };

      checkSdk();
    });
  }

  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        version: sdkVersion,
        xfbml: true,
      });
      resolve();
    };

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=${sdkVersion}`;
    script.onerror = () => {
      reject(new Error("facebook_sdk_load_failed"));
    };

    document.body.appendChild(script);
  });
}

function hasCustomerChatPlugin(chatRoot: HTMLElement | null): boolean {
  return Boolean(chatRoot?.querySelector("iframe"));
}

export function FacebookMessengerChat({
  messengerHref,
  pageId,
  sdkVersion = CUSTOMER_CHAT_SDK_VERSION,
  themeColor = DEFAULT_THEME_COLOR,
}: FacebookMessengerChatProps): ReactElement | null {
  const [showFallback, setShowFallback] = useState(!pageId && Boolean(messengerHref));

  useEffect(() => {
    if (!pageId) {
      return;
    }

    let cancelled = false;
    let checkTimer: number | null = null;

    const mountChatPlugin = async (): Promise<void> => {
      ensureFbRoot();
      const chatRoot = ensureChatRoot({
        pageId,
        themeColor,
      });

      try {
        await loadFacebookSdk(sdkVersion);

        if (cancelled) {
          return;
        }

        window.FB?.XFBML.parse(chatRoot);

        checkTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          const pluginLoaded = hasCustomerChatPlugin(chatRoot);

          if (!pluginLoaded) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "[facebook-messenger-chat] Meta Customer Chat plugin did not render. " +
                  "Whitelist this domain in Meta Page Inbox settings, or use the fallback button.",
              );
            }

            if (messengerHref) {
              setShowFallback(true);
            }
          }
        }, PLUGIN_CHECK_MS);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[facebook-messenger-chat] Facebook SDK failed to load.", error);
        }

        if (messengerHref) {
          setShowFallback(true);
        }
      }
    };

    void mountChatPlugin();

    return () => {
      cancelled = true;

      if (checkTimer !== null) {
        window.clearTimeout(checkTimer);
      }
    };
  }, [messengerHref, pageId, sdkVersion, themeColor]);

  if (!showFallback || !messengerHref) {
    return null;
  }

  return (
    <a
      aria-label="Message us on Messenger"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#0077e6]"
      href={messengerHref}
      rel="noreferrer"
      target="_blank"
    >
      <MessageCircleMore className="h-7 w-7" />
    </a>
  );
}
