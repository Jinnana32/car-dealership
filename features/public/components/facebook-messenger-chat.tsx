"use client";

import { useEffect, type ReactElement } from "react";

type FacebookMessengerChatProps = {
  pageId: string;
  sdkVersion?: string;
  themeColor?: string;
};

type FacebookSdk = {
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

const DEFAULT_THEME_COLOR = "#e11d2e";
const DEFAULT_SDK_VERSION = "v23.0";
const SDK_SCRIPT_ID = "facebook-jssdk";

function ensureFbRoot(): void {
  if (document.getElementById("fb-root")) {
    return;
  }

  const fbRoot = document.createElement("div");
  fbRoot.id = "fb-root";
  document.body.appendChild(fbRoot);
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

export function FacebookMessengerChat({
  pageId,
  sdkVersion = DEFAULT_SDK_VERSION,
  themeColor = DEFAULT_THEME_COLOR,
}: FacebookMessengerChatProps): ReactElement | null {
  useEffect(() => {
    let chatRoot: HTMLDivElement | null = null;
    let cancelled = false;

    const mountChatPlugin = async (): Promise<void> => {
      ensureFbRoot();

      chatRoot = document.createElement("div");
      chatRoot.className = "fb-customerchat";
      chatRoot.setAttribute("attribution", "biz_inbox");
      chatRoot.setAttribute("page_id", pageId);
      chatRoot.setAttribute("theme_color", themeColor);
      document.body.appendChild(chatRoot);

      try {
        await loadFacebookSdk(sdkVersion);

        if (cancelled || !chatRoot) {
          return;
        }

        window.FB?.XFBML.parse(chatRoot);
      } catch {
        // Facebook SDK blocked or failed to load.
      }
    };

    void mountChatPlugin();

    return () => {
      cancelled = true;
      chatRoot?.remove();
    };
  }, [pageId, sdkVersion, themeColor]);

  return null;
}
