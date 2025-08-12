// // app/api/payment/confirm/route.ts
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     const {
//       payment_ref_id,
//       web_token,
//       payment_method,
//       status,
//       total_price,
//       other_info,
//       discount_amt,
//     } = body;

//     const payload = {
//       module_name: "payment",
//       keys: {
//         data: [
//           {
//             payment_ref_id,
//             web_token,
//             payment_method,
//             status,
//             total_price,
//             other_info,
//             discount_amt,
//           },
//         ],
//       },
//       cid: process.env.CID, // Secure: not exposed to client
//     };

//     const apiUrl = process.env.API_URL; // e.g. https://example.com/api/save

//     const res = await fetch(apiUrl!, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     const result = await res.json();

//     if (!res.ok) {
//       throw new Error(`Failed to save payment: ${result.message}`);
//     }

//     return NextResponse.json({ success: true, data: result });
//   } catch (err) {
//     console.error("[API] Payment Confirm Error:", err);
//     return NextResponse.json({ success: false, error: "Payment save failed." }, { status: 500 });
//   }
// }

// app/api/payment/confirm/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { projectName, web_token } = await req.json();

    if (!projectName || typeof projectName !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing projectName" },
        { status: 400 }
      );
    }

    if (!web_token || typeof web_token !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing web_token" },
        { status: 400 }
      );
    }

    if (!process.env.BLOB_BASE_URL) {
      throw new Error("BLOB_BASE_URL is not set in environment variables");
    }

    // Build blob URL just like payment-check
    const BLOB_URL = `${process.env.BLOB_BASE_URL}/${projectName}/payment/${web_token}.json`;

    // Fetch from Vercel Blob
    const response = await fetch(BLOB_URL);

    if (!response.ok) {
      throw new Error("Blob not found");
    }

    const paymentData = await response.json();

    // Return confirmation response
    return NextResponse.json(
      { success: true, status: 200, data: paymentData },
      { status: 200 }
    );

  } catch (err) {
    console.error("[API] Payment Confirm Error:", err);
    return NextResponse.json(
      { success: false, status: 500, error: "Payment confirm failed." },
      { status: 500 }
    );
  }
}

