import type { Metadata } from "next";
import Script from "next/script";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  GeneralData,
  PagesData,
  ApiResponse,
  IndexPageData,
  RegistrationInfo,
} from "@/types";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PartneredContent from "./components/PartneredContent";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getBaseUrl } from "@/lib/getBaseUrl";
import {
  emptyApiResponse,
  emptyIndexPageData,
  emptyRegisterInfo,
} from "@/lib/fallbacks";
import WhatsAppWidget from "./components/WhatsAppWidget";
// import MediaCollaborators from "./components/MediaCollaborators";

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("SSR fetch failed:", e);
    return fallback;
  }
}

async function fetchGeneralData(): Promise<ApiResponse> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/general`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch general data");
  return res.json();
}

async function fetchIndexPageData(): Promise<IndexPageData> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/index-page`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch index page data");
  return res.json();
}
async function fetchRegisterPageData(): Promise<RegistrationInfo> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/reg-page-data`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch registration page data");
  return res.json();
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await fetchGeneralData();
    const general = data?.data || emptyApiResponse.data;
    const pageData = data?.pages || emptyApiResponse.pages;
    const eventName = `${general?.clname || "Annual Tech Conference"} ${general?.year || ""
      }`.trim();

    return {
      title: eventName,
      description: pageData?.register?.[0]?.content || "",
      keywords: pageData?.register?.[0]?.meta_keywords || "",
      icons: {
        icon: `${general?.site_url || ""}/images/images/favicon.png`,
      },
      openGraph: {
        images: `${general?.site_url || ""}/images/images/opengraph_image.jpg`,
      },
    };
  } catch (error) {
    console.error("Metadata generation error in layout:", error);
    return {
      title: "Annual Tech Conference",
      description: "",
      keywords: "",
      icons: { icon: "/favicon.ico" },
    };
  }
}

function formatDate(
  dateString: string | undefined,
  defaultTime: string
): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Check if the date string includes time
    const hasTime = dateString.includes("T");
    const hours = hasTime
      ? String(date.getHours()).padStart(2, "0")
      : defaultTime.split(":")[0];
    const minutes = hasTime
      ? String(date.getMinutes()).padStart(2, "0")
      : defaultTime.split(":")[1];

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [generaldata, indexPageData, registerData] = await Promise.all([
    safeFetch<ApiResponse>(fetchGeneralData, emptyApiResponse),
    safeFetch<IndexPageData>(fetchIndexPageData, emptyIndexPageData),
    safeFetch<RegistrationInfo>(fetchRegisterPageData, emptyRegisterInfo),
  ]);

  const general: GeneralData = generaldata?.data || emptyApiResponse.data;
  const pageData: PagesData = generaldata?.pages || emptyApiResponse.pages;

  const eventName = `${general?.clname || "Annual Tech Conference"} ${general?.year || ""
    }`.trim();
  const register = pageData?.register || [];

  // Format dates
  const formattedStartDate =
    formatDate(general?.startDate, "09:00") || "2024-05-01T09:00";
  const formattedEndDate =
    formatDate(general?.endDate, "17:00") || "2024-05-01T17:00";

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventName,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: `${general?.site_url || ""}/images/images/opengraph_image.jpg`,
    description: register[0]?.content || "",
    location: {
      "@type": "Place",
      name: general?.venue_p1,
      address: {
        "@type": "PostalAddress",
        streetAddress: `Location: ${general?.venue_p1 || ""}.`,
        addressLocality: general?.v1,
        addressRegion: general?.v2,
        postalCode: ".",
        addressCountry: general?.v2,
      },
    },
    offers: {
      "@type": "Offer",
      url: `${general?.site_url || ""}/register`,
      price: general?.offerPrice || "$449",
      priceCurrency: general?.offerCurrency || "USD",
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
    },
  };

  const GA_ID = process.env.GOOGLE_ANALYTICS_ID;
  const isGTM = GA_ID?.startsWith("GTM-");

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/images/favicon.png" />
        {/* Google Tag Manager */}
        {/* <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-tag-manager-config" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
          `}
        </Script> */}

        {/* GA4 / Universal Analytics */}
        {!isGTM && GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
            <Script id="google-tag-manager-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager */}
        {isGTM && (
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),
                    dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GA_ID}');
            `}
          </Script>
        )}

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>

        {isGTM && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GA_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {/* Toast container - only one instance needed */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
        />
        <Header generalData={generaldata} registerData={registerData} />
        {children}
        {/* <MediaCollaborators />  */}
        <PartneredContent />
        <Footer indexPageData={indexPageData} generalData={generaldata} />
        <WhatsAppWidget /> 
      </body>
    </html>
  );
}
