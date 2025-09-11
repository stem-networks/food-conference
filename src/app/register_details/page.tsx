import { Suspense } from "react";
import RegisterDetailsClient from "../components/RegisterDetails";
import { Metadata } from "next";
import { ApiResponse } from "@/types";
import { getBaseUrl } from "@/lib/getBaseUrl";

async function fetchGeneralData(): Promise<ApiResponse> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/general`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch general data");
  return res.json();
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const generalData = await fetchGeneralData();
    const meta = generalData?.pages?.register_details?.[0] || {
      title: "Register",
      content: "Explore the Register of the conference.",
      meta_keywords: "",
    };

    // Canonical
    // const baseUrl = process.env.BASE_URL || '';
    const canonicalPath = "/register_details"; // hardcode since we know this is sessions page
    const canonicalURL = `${getBaseUrl()}${canonicalPath}`;

    return {
      title: meta.title,
      description: meta.content,
      keywords: meta.meta_keywords,
      metadataBase: new URL(getBaseUrl()),
      alternates: {
        canonical: canonicalURL,
      },
    };
  } catch (error) {
    console.error("Metadata generation error Registration:", error);
    return {
      title: "Register",
      description: "Explore the Register of the conference.",
      keywords: "",
    };
  }
}

export default async function RegisterDetailsPage() {
  const general = await fetchGeneralData();
  const general_info = general?.data || {};
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterDetailsClient generalInfo={general_info} />
    </Suspense>
  );
}
