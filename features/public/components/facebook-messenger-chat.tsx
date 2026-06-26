"use client";

import Script from "next/script";
import { useEffect, useRef, type ReactElement } from "react";

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
  }
}

const DEFAULT_THEME_COLOR = "#e11d2e";
const DEFAULT_SDK_VERSION = "v23.0";

export function FacebookMessengerChat({
  pageId,
  sdkVersion = DEFAULT_SDK_VERSION,
  themeColor = DEFAULT_THEME_COLOR,
}: FacebookMessengerChatProps): ReactElement {
  const chatRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRoot = chatRootRef.current;

    if (!chatRoot) {
      return;
    }

    chatRoot.setAttribute("attribution", "biz_inbox");
    chatRoot.setAttribute("page_id", pageId);
    chatRoot.setAttribute("theme_color", themeColor);

    if (window.FB?.XFBML) {
      window.FB.XFBML.parse(chatRoot);
    }
  }, [pageId, themeColor]);

  const handleSdkLoad = (): void => {
    const chatRoot = chatRootRef.current;

    if (chatRoot && window.FB?.XFBML) {
      window.FB.XFBML.parse(chatRoot);
    }
  };

  return (
    <>
      <div id="fb-root" />
      <div className="fb-customerchat" ref={chatRootRef} />
      <Script
        crossOrigin="anonymous"
        id="facebook-jssdk"
        onLoad={handleSdkLoad}
        src={`https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=${sdkVersion}`}
        strategy="lazyOnload"
      />
    </>
  );
}
