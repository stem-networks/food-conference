"use client";

import React, { useState, useEffect, useRef } from "react";
// import Head from "next/head";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
// import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
// import { title } from "process";
// import { toast } from "react-toastify";

// import {
//   CreateOrderData,
//   CreateOrderActions,
//   OnApproveData,
//   OnApproveActions,
// } from "@paypal/paypal-js";

interface RegistrationData {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  reg_type?: string;
  participants?: number;
  reg_price?: number;
  occupancy_price?: number;
  nights?: number;
  checkin_date?: string;
  checkout_date?: string;
  accompanying?: number;
  accompanying_price?: number;
  total_price?: number;
  web_token?: string;
  other_info?: Record<string, unknown>;
  transaction_id?: string | null;
}

interface DiscountDetails {
  checkEmail?: string;
  coupon_code?: string;
  reg_per?: number;
  acc_per?: number;
  cust_amt?: number;
  applied_with?: string;
}

interface ActualAmount {
  [key: string]: string | number;
}

interface GeneralInfo {
  csname?: string;
  year?: string;
  clname?: string;
  site_url?: string;
  cid?: string;
  cemail?: string;
}
interface RegisterDetailsClientProps {
  generalInfo: GeneralInfo; // Replace `any` with the correct type if available
}

const RegisterDetails = ({ generalInfo }: RegisterDetailsClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [details, setDetails] = useState<RegistrationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>(""); // ✅ For error message
  // const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [discountDetails, setDiscountDetails] =
    useState<DiscountDetails | null>(null);
  const [actualAmount, setActualAmount] = useState<ActualAmount | null>(null);
  const [localError, setLocalError] = useState("");
  const [checkEmail, setCheckEmail] = useState("");

  const [showModal, setShowModal] = useState<boolean>(false);
  const [couponCodeToCheck, setCouponCodeToCheck] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCoupon, setShowCoupon] = useState(false);

  const [adjustedPrice, setAdjustedPrice] = useState<number>(0);
  const [payTotal, setPayTotal] = useState<number>(0);
  //   const adjustedPriceRef = useRef<number>(adjustedPrice);
  const adjustedPriceRef = useRef<number>(0); // Initialize with 0
  const actualAmountRef = useRef<ActualAmount | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  // const [isClientReady, setIsClientReady] =  useState<string | null>(null);

  console.log(isPending);
  // console.log("adjust price", adjustedPrice);

  useEffect(() => {
    fetch("/api/paypal-client-id")
      .then((res) => res.json())
      .then((data) => setClientId(data.clientId))
      .catch((err) => console.error("Failed to fetch PayPal clientId", err));
  }, []);

  useEffect(() => {
    if (searchParams?.has("discount")) {
      setShowCoupon(true);
    } else {
      setShowCoupon(false);
    }
  }, [searchParams]);


  useEffect(() => {
    const fetchData = async () => {
      const web_token = searchParams?.get("web_token");

      // Step 0: Check if token exists
      if (!web_token) {
        setErrorMsg("token-error");
        setDetails(null);
        return;
      }

      // Extract project name from site_url
      // const rawSiteUrl = generalInfo?.site_url || "";
      // const projectName = rawSiteUrl
      //   .replace(/^https?:\/\//, "")
      //   .replace(".com", "")
      //   .trim();

      const siteUrl = generalInfo.site_url || "";
      let projectName = "default_project";

      if (siteUrl) {
        try {
          const { hostname } = new URL(siteUrl);
          const parts = hostname.split(".");

          if (parts.length > 2) {
            // Has subdomain → take only the first part
            projectName = parts[0];
          } else {
            // No subdomain → take the domain name without TLD
            projectName = parts[0];
          }
        } catch (e) {
          console.error("Invalid siteUrl:", siteUrl, e);
        }
      }

      try {
        // Step 1: Check payment confirmation
        const paymentRes = await axios.post("/api/payment/confirm", {
          projectName,
          web_token,
        });

        if (paymentRes?.data?.success) {
          // ✅ Payment confirmed — redirect
          router.replace(`/payment_success?status=success&web_token=${web_token}`);
          return; // stop here
        }
      } catch (error) {
        console.error("Payment check error:", error);
        // We continue to fetch registration details if payment check fails
      }

      // Step 2: Fetch registration details if payment is not confirmed
      try {
        const regRes = await axios.post("/api/get-registration-details", {
          projectName,
          web_token,
        });

        if (regRes.status === 200 && regRes.data) {
          setDetails(regRes.data.data);
        } else {
          setErrorMsg("token-error");
          setDetails(null);
        }
      } catch (error) {
        setErrorMsg("token-error");
        // setErrorMsg("Failed to fetch registration details");
        console.log(error)
        setDetails(null);
      }
    };

    fetchData();
  }, [searchParams, router, generalInfo]);


  const dataToShow = details;

  const totalAccommodationPrice =
    (dataToShow?.occupancy_price || 0) * (dataToShow?.nights || 0);

  let totalRegistrationPrice = 0;
  if (dataToShow?.reg_type === "customized-registration") {
    totalRegistrationPrice = dataToShow?.reg_price || 0;
  } else {
    totalRegistrationPrice =
      (dataToShow?.reg_price || 0) * (dataToShow?.participants || 0);
  }

  // const convertToDDMMYYYY = (dateStr: string) => {
  //   const [year, month, day] = dateStr.split("-");
  //   return `${day}-${month}-${year}`;
  // };

  // const formatDateWithDay = (dateStr: string) => {
  //   if (dateStr === "NA") return "NA";

  //   const [day, month, year] = dateStr.split("-");
  //   const dateObj = new Date(`${year}-${month}-${day}`);

  //   const daysOfWeek = [
  //     "Sunday",
  //     "Monday",
  //     "Tuesday",
  //     "Wednesday",
  //     "Thursday",
  //     "Friday",
  //     "Saturday",
  //   ];
  //   const months = [
  //     "Jan",
  //     "Feb",
  //     "Mar",
  //     "Apr",
  //     "May",
  //     "Jun",
  //     "Jul",
  //     "Aug",
  //     "Sep",
  //     "Oct",
  //     "Nov",
  //     "Dec",
  //   ];

  //   const dayName = daysOfWeek[dateObj.getUTCDay()];
  //   const monthName = months[parseInt(month) - 1];
  //   const formattedDay = day.padStart(2, "0");

  //   return `${monthName} ${formattedDay}, ${year} (${dayName})`;
  // };


  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr || dateStr === "NA") return "NA";

    // Expecting DD-MM-YYYY
    const [day, month, year] = dateStr.split("-");

    const dateObj = new Date(`${year}-${month}-${day}`); // YYYY-MM-DD (valid)

    if (isNaN(dateObj.getTime())) return "Invalid Date";

    const daysOfWeek = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday",
    ];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const dayName = daysOfWeek[dateObj.getUTCDay()];
    const monthName = months[parseInt(month) - 1];
    const formattedDay = day.padStart(2, "0");

    return `${monthName} ${formattedDay}, ${year} (${dayName})`;
  };


  useEffect(() => {
    if (dataToShow?.email) {
      setCheckEmail(dataToShow.email);
    }
  }, [dataToShow]);

  useEffect(() => {
    if (!checkEmail) return;
    if (actualAmountRef.current !== null) return;

    // console.log("email coupon", checkEmail);
    const fetchDiscountDetails = async () => {
      try {
        const payload = {
          email: checkEmail || "",
          coupon_code: "",
        };

        const response = await fetch("/api/register_details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        // console.log("data details", data);

        if (data.success) {
          setDiscountDetails({
            checkEmail: checkEmail || "",
            coupon_code: couponCodeToCheck || "",
            reg_per: data.reg_per || 0,
            acc_per: data.acc_per || 0,
            cust_amt: data.cust_amt || 0,
          });

          const newActualAmount = data.cust_amt
            ? {
              "Discount Applied With": data.applied_with || "",
              "Total Amount": payTotal || 0,
              "Discount Amount": payTotal - (data.cust_amt || payTotal),
              "Final Amount After Discount": data.cust_amt || 0,
            }
            : {
              "Discount Applied With": data.applied_with || "",
              "Total Amount": payTotal || 0,
              [`Registration Discount (${data?.reg_per || "0"}%) Applied:`]:
                (totalRegistrationPrice * (data?.reg_per || 0)) / 100 || 0,
              [`Accommodation Discount (${data?.acc_per || "0"}%) Applied:`]:
                (totalAccommodationPrice * (data?.acc_per || 0)) / 100 || 0,
              "Final Amount After Discount":
                payTotal -
                (totalRegistrationPrice * (data?.reg_per || 0)) / 100 -
                (totalAccommodationPrice * (data?.acc_per || 0)) / 100 || 0,
            };
          setActualAmount(newActualAmount);
          actualAmountRef.current = newActualAmount;
        } else {
          setLocalError("");
        }
      } catch (err) {
        setLocalError(
          "Error fetching discount details: " + (err as Error).message
        );
      }
    };

    fetchDiscountDetails();
  }, [
    checkEmail,
    payTotal,
    totalRegistrationPrice,
    totalAccommodationPrice,
    couponCodeToCheck,
  ]);

  const toggleModal = () => {
    setShowModal(!showModal);

    if (showModal) {
      setCouponCodeToCheck("");
      setLocalError("");
    }
  };

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  const handleApplyCoupon = async () => {
    setLocalError("");

    if (!couponCodeToCheck) {
      setLocalError("Please enter a coupon code.");
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }

    try {
      const payload: {
        coupon_code: string;
        email?: string;
      } = {
        coupon_code: couponCodeToCheck,
      };

      if (checkEmail) {
        payload.email = checkEmail;
      }

      const response = await fetch("/api/register_details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // console.log("data apply coupon", data);

      if (data.success) {
        setDiscountDetails({
          coupon_code: couponCodeToCheck || "",
          reg_per: data.reg_per || 0,
          acc_per: data.acc_per || 0,
          cust_amt: data.cust_amt || 0,
        });
        setActualAmount(dataToShow?.other_info as ActualAmount);

        let updatedActualAmount: ActualAmount = {
          "Discount Applied With": data.applied_with || "",
          "Total Amount": payTotal || 0,
          "Discount Amount": payTotal - (data.cust_amt || payTotal),
          "Final Amount After Discount": data.cust_amt || 0,
        };

        if (!data.cust_amt) {
          const regDiscount =
            (totalRegistrationPrice * (data.reg_per || 0)) / 100;
          const accDiscount =
            (totalAccommodationPrice * (data.acc_per || 0)) / 100;

          updatedActualAmount = {
            ...updatedActualAmount,
            [`Registration Discount (${data.reg_per || "0"}%) Applied:`]:
              regDiscount || 0,
            [`Accommodation Discount (${data.acc_per || "0"}%) Applied:`]:
              accDiscount || 0,
            "Discount Amount": regDiscount + accDiscount || 0,
            "Final Amount After Discount": payTotal - regDiscount - accDiscount,
          };
        }

        if (couponCodeToCheck) {
          updatedActualAmount["Coupon Code"] = couponCodeToCheck;
        }

        setActualAmount(updatedActualAmount);
        actualAmountRef.current = updatedActualAmount;
        setLocalError("");
        toggleModal();
      } else {
        setLocalError("Invalid Coupon.");
      }
    } catch (err) {
      setLocalError("Error applying coupon: " + (err as Error).message);
      console.error("Error applying coupon:", err);
    }
  };

  useEffect(() => {
    if (actualAmount !== null) {
      actualAmountRef.current = actualAmount;
    }
  }, [actualAmount]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyCoupon();
    }
  };

  useEffect(() => {
    let finalPrice = dataToShow?.total_price || 0;

    if (discountDetails?.cust_amt && discountDetails.cust_amt > 0) {
      finalPrice = discountDetails.cust_amt;
    } else if (
      (discountDetails?.reg_per && discountDetails.reg_per > 0) ||
      (discountDetails?.acc_per && discountDetails.acc_per > 0)
    ) {
      const registrationDiscount =
        (totalRegistrationPrice * (discountDetails?.reg_per || 0)) / 100 || 0;
      const accommodationDiscount =
        (totalAccommodationPrice * (discountDetails?.acc_per || 0)) / 100 || 0;
      finalPrice = Math.max(
        0,
        Math.round(
          (dataToShow?.total_price || 0) -
          registrationDiscount -
          accommodationDiscount
        )
      );
    }

    setAdjustedPrice(finalPrice);
    setPayTotal(finalPrice);
    adjustedPriceRef.current = finalPrice;
  }, [
    discountDetails,
    dataToShow,
    totalRegistrationPrice,
    totalAccommodationPrice,
  ]);

  // sendError to Telegram
  async function sendErrorToCMS({
    name,
    email,
    errorMessage,
    formBased = "PayPal Payment",
    siteName = `${generalInfo.clname || "N/A"} (${generalInfo.csname || "N/A"
    } - ${generalInfo.year || "N/A"})`,
  }: {
    name: string;
    email: string;
    errorMessage: string;
    formBased?: string;
    siteName?: string;
  }) {
    try {
      const payload = new FormData();
      payload.append("name", name);
      payload.append("email", email);
      payload.append("error_message", errorMessage);
      payload.append("form_based", formBased);
      payload.append("siteName", siteName); // added

      const res = await fetch("/api/send-to-telegram", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        console.error("❌ Failed to send error to Telegram API");
      }
    } catch (err) {
      console.error("❌ Exception while sending error to Telegram:", err);
    }
  }

  const handleRetry = () => {
    const token = searchParams?.get("web_token");
    if (!token) return;

    setErrorMsg("");
    setDetails(null);
    router.push(`/register_details?web_token=${token}`);
  };


  return (
    <div>
      <div className="brand_wrap">
        <div className="auto-container">
          <div className="row">
            <div className="col-md-12">
              <Link href="/" title="Navigate to Homepage">
                Home
              </Link>{" "}
              <i className="fa fa-angle-right"></i> <span>Payment Details</span>
            </div>
          </div>
        </div>
      </div>

      <h2
        className="abs_wrap5 wow fadeInUp"
        data-wow-delay="400ms"
        data-wow-duration="1000ms"
      >
        Payment Details
      </h2>
      {errorMsg === "token-error" && (
        <div style={styles.container}>
          <div style={styles.failureBox}>
            <h4 style={styles.headingTitle}>
              Something Went Wrong! Please Check Before Retrying
            </h4>
            <div style={styles.content1}>
              <p>Kindly verify your registration link or contact the administrator at <Link href={`mailto:${generalInfo.cemail}`} title={`mailto:${generalInfo.cemail}`}>{generalInfo.cemail}</Link>.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg === "payment-failed" && (
        // <div style={{
        //   backgroundColor: "#fff3f3",
        //   color: "#a94442",
        //   padding: "15px",
        //   borderRadius: "8px",
        //   border: "1px solid #ebccd1",
        //   marginBottom: "15px",
        //   textAlign: "center"
        // }}>
        //   <strong>Payment Failed: </strong> Something went wrong during payment.
        //   Please contact{" "}
        //   <Link href={`mailto:${generalInfo.cemail}`}>
        //     {generalInfo.cemail}
        //   </Link>{" "}
        //   for help.
        // </div>

        <div style={styles.container}>
          <div style={styles.failureBox}>
            <h4 style={styles.headingTitle}>
              Payment Failed: Something went wrong during payment
            </h4>
            <div style={styles.content1}>
              <p>
                Please contact{" "}
                <Link href={`mailto:${generalInfo.cemail}`} title={`mailto:${generalInfo.cemail}`}>
                  {generalInfo.cemail}
                </Link>{" "}.
              </p>

              <button onClick={handleRetry} style={styles.tryButton}>Try Again</button>
            </div>
          </div>
        </div>
      )
      }

      {
        details && !errorMsg && (
          <div className="auto-container">
            <div className="row clearfix payment-block">
              <div className="col-md-9">
                <div
                  className="count_total_wrap wow fadeInUp"
                  data-wow-delay="400ms"
                  data-wow-duration="1000ms"
                >
                  <div className="sup_wrap_blue">
                    <table width="100%" cellSpacing="0" cellPadding="0">
                      <tbody>
                        {dataToShow?.name && (
                          <tr>
                            <td className="re_p3">Name:</td>
                            <td className="re_p3 text-right fw-600">
                              {dataToShow.name}
                            </td>
                          </tr>
                        )}
                        {dataToShow?.email && (
                          <tr>
                            <td className="re_p3">Email:</td>
                            <td className="re_p3 text-right fw-600">
                              {dataToShow.email}
                            </td>
                          </tr>
                        )}
                        {dataToShow?.phone && (
                          <tr>
                            <td className="re_p3">Phone:</td>
                            <td className="re_p3 text-right fw-600">
                              {dataToShow.phone}
                            </td>
                          </tr>
                        )}
                        {dataToShow?.country && (
                          <tr>
                            <td className="re_p3">Country:</td>
                            <td className="re_p3 text-right fw-600">
                              {dataToShow.country}
                            </td>
                          </tr>
                        )}
                        {dataToShow?.reg_type && (
                          <tr>
                            <td className="re_p3">Registration Type:</td>
                            <td className="re_p3 text-right fw-600">
                              {dataToShow.reg_type}
                            </td>
                          </tr>
                        )}
                        {(dataToShow?.participants || 0) > 0 && (
                          <tr>
                            <td className="re_p3 brb-none">Participants:</td>
                            <td className="re_p3 brb-none text-right fw-600">
                              {dataToShow?.participants}
                            </td>
                          </tr>
                        )}

                        {(dataToShow?.reg_price || 0) > 0 &&
                          dataToShow?.reg_type !== "customized-registration" && (
                            <tr>
                              <td className="re_p3">Registration Price:</td>
                              <td className="re_p3 text-right fw-600">
                                ${dataToShow?.reg_price}
                              </td>
                            </tr>
                          )}

                        {totalRegistrationPrice >= 0 && (
                          <tr>
                            <td className="re_p3_main">
                              Total Registration Price:
                            </td>
                            <td className="re_p3_main text-right fw-600">
                              ${Math.round(totalRegistrationPrice)}
                            </td>
                          </tr>
                        )}

                        {(dataToShow?.occupancy_price || 0) > 0 &&
                          dataToShow?.reg_type !== "customized-registration" && (
                            <tr>
                              <td className="re_p3">
                                Accommodation Price Per Night:
                              </td>
                              <td className="re_p3 text-right fw-600">
                                ${dataToShow?.occupancy_price}
                              </td>
                            </tr>
                          )}

                        {(dataToShow?.nights || 0) > 0 && (
                          <tr>
                            <td className="re_p3">Total No. Nights:</td>
                            <td className="re_p3 text-right fw-600">
                              {dataToShow?.nights}
                            </td>
                          </tr>
                        )}
                        {dataToShow?.checkin_date &&
                          (dataToShow?.nights ?? 0) > 0 && (
                            <tr>
                              <td className="re_p3">Check-in Date:</td>
                              <td className="re_p3 text-right fw-600">
                                {formatDateWithDay(
                                  dataToShow.checkin_date
                                )}
                              </td>
                            </tr>
                          )}

                        {dataToShow?.checkout_date &&
                          (dataToShow?.nights ?? 0) > 0 && (
                            <tr>
                              <td className="re_p3 brb-none">Check-out Date:</td>
                              <td className="re_p3 brb-none text-right fw-600">
                                {formatDateWithDay(dataToShow.checkout_date)}
                              </td>
                            </tr>
                          )}

                        {(totalAccommodationPrice > 0 ||
                          ((dataToShow?.nights ?? 0) > 0 &&
                            dataToShow?.reg_type ===
                            "customized-registration")) && (
                            <tr>
                              <td className="re_p3_main">
                                Total Accommodation Price:
                              </td>
                              <td className="re_p3_main text-right fw-600">
                                ${Math.round(totalAccommodationPrice)}
                              </td>
                            </tr>
                          )}

                        {(dataToShow?.accompanying_price ?? 0) > 0 && (
                          <tr>
                            <td className="re_p3 brb-none">
                              No of Accompanying Persons ($
                              {(dataToShow?.accompanying ?? 0) > 0
                                ? `${Math.round(
                                  dataToShow?.accompanying_price ?? 0
                                )}`
                                : "N/A"}{" "}
                              each Person):
                            </td>
                            <td className="re_p3 brb-none text-right fw-600">
                              {dataToShow?.accompanying ?? 0}
                            </td>
                          </tr>
                        )}

                        {(dataToShow?.accompanying_price || 0) > 0 && (
                          <tr>
                            <td className="re_p3_main">
                              Total Accompanying Persons Price:
                            </td>
                            <td className="re_p3_main text-right fw-600">
                              $
                              {(dataToShow?.accompanying_price ?? 0) *
                                (dataToShow?.accompanying ?? 0)}
                            </td>
                          </tr>
                        )}

                        {(dataToShow?.total_price ?? 0) > 0 && (
                          <tr>
                            <td className="re_p4">Total Price:</td>
                            <td className="re_p4 text-right fw-600">
                              ${Math.round(dataToShow?.total_price ?? 0)}
                            </td>
                          </tr>
                        )}

                        {showCoupon && (
                          <tr>
                            <td colSpan={2}>
                              <button
                                type="button"
                                className="coupon-link"
                                onClick={toggleModal}
                              >
                                Have a discount coupon?
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <table
                      width="100%"
                      cellSpacing="0"
                      cellPadding="0"
                      className="discount-table"
                    >
                      <tbody>
                        {discountDetails?.reg_per != null &&
                          discountDetails.reg_per > 0 && (
                            <tr>
                              <td className="re_p3">
                                Registration Discount ({discountDetails.reg_per}%)
                                Applied:
                              </td>
                              <td className="re_p3 text-right fw-600 re_p3_right">
                                -$
                                {Math.round(
                                  (totalRegistrationPrice *
                                    discountDetails.reg_per) /
                                  100
                                )}
                              </td>
                            </tr>
                          )}

                        {totalAccommodationPrice > 0 &&
                          discountDetails &&
                          (discountDetails.acc_per || 0) > 0 && (
                            <tr>
                              <td className="re_p3">
                                Accommodation Discount ({discountDetails.acc_per}%)
                                Applied:
                              </td>
                              <td className="re_p3 text-right fw-600 re_p3_right">
                                -$
                                {Math.round(
                                  (totalAccommodationPrice *
                                    (discountDetails.acc_per || 0)) /
                                  100
                                )}
                              </td>
                            </tr>
                          )}

                        {((discountDetails?.reg_per || 0) > 0 ||
                          (discountDetails?.acc_per || 0) > 0) && (
                            <tr>
                              <td className="re_p3_main">
                                Final Amount After Discount:
                              </td>
                              <td className="re_p3_main text-right fw-600 re_p3_main_right">
                                ${adjustedPrice}
                              </td>
                            </tr>
                          )}

                        {(discountDetails?.cust_amt || 0) > 0 && (
                          <tr>
                            <td className="re_p3">Discount Amount:</td>
                            <td className="re_p3 text-right fw-600 re_p3_main_right">
                              -$
                              {(dataToShow?.total_price || 0) -
                                (discountDetails?.cust_amt || 0)}
                            </td>
                          </tr>
                        )}

                        {discountDetails && (discountDetails.cust_amt || 0) > 0 && (
                          <tr>
                            <td className="re_p3_main">
                              Final Amount After Discount:
                            </td>
                            <td className="re_p3_main text-right fw-600 re_p3_main_right">
                              ${discountDetails.cust_amt}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="pg-head">Payment Gateway</div>
                <div className="payment-section">
                  {clientId && adjustedPrice ? (
                    <PayPalScriptProvider
                      options={{
                        clientId: clientId,
                        currency: "USD",
                        intent: "capture",
                        // debug: true,
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: "vertical" }}
                        onClick={(data, actions) => {
                          // console.log("🔵 [PayPal] onClick Triggered");
                          console.log("🟡 Click Payload:", { data, actions });
                        }}

                        createOrder={async () => {
                          // console.log("🟢 [PayPal] createOrder Triggered");
                          setIsPending(true);

                          try {
                            const payload = {
                              totalAmount: adjustedPriceRef.current,
                              description: `Registration for ${dataToShow?.name}`,
                            };
                            // console.log(
                            //   "📦 Sending to /api/paypal/create-order:",
                            //   payload
                            // );

                            const res = await fetch("/api/paypal/create-order", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify(payload),
                            });

                            const data = await res.json();
                            // console.log("✅ create-order Response:", data);

                            if (!res.ok)
                              throw new Error(
                                data?.message || "Failed to create order"
                              );

                            return data.orderID;
                          } catch (error) {
                            console.error("❌ Error in createOrder:", error);
                            await sendErrorToCMS({
                              name: dataToShow?.name || "Unknown User",
                              email: dataToShow?.email || "Unknown Email",
                              errorMessage: `Something went wrong while creating the PayPal order: ${(error as Error).message ||
                                "Unknown error in createOrder"
                                }`,
                            });
                            setIsPending(false);
                          }
                        }}

                        onApprove={async (data) => {
                          try {
                            const capturePayload = { orderID: data.orderID };

                            const res = await fetch("/api/paypal/capture-order", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify(capturePayload),
                            });

                            const captureData = await res.json();
                            if (!res.ok) throw new Error("Failed to capture order");

                            const savePaymentPayload = {
                              payment_ref_id: captureData.id,
                              web_token: dataToShow?.web_token,
                              total_price: adjustedPriceRef.current,
                              other_info: actualAmountRef.current,
                              payment_method: "PayPal",
                              status: "success",
                              discount_amt: 0,
                            };

                            // 1️⃣ Keep existing CMS save-payment call
                            const saveRes = await fetch(
                              "/api/paypal/save-payment",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify(savePaymentPayload),
                              }
                            );

                            const saveResult = await saveRes.json();
                            console.log("✅ save-payment Response:", saveResult);

                            // 2️⃣ Also save to /api/save-payment-user (Blob storage)
                            const paymentUserPayload = {
                              transaction_id: captureData.id,
                              payment_method: "PayPal",
                              paymentstatus: "success",
                              total_price: adjustedPriceRef.current,
                              discount_amt: "0",
                              other_info: actualAmountRef.current,
                              status: "1",
                              created_dt: new Date().toISOString(),
                              updated_dt: new Date().toISOString(),
                              web_token: dataToShow?.web_token,
                              cid: generalInfo?.cid,
                              site_url: generalInfo?.site_url || "",
                              attempt: "1",
                            };

                            // ✅ Ensure blob is saved successfully
                            const blobRes = await fetch("/api/save-payment-user", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(paymentUserPayload),
                            });

                            const blobResult = await blobRes.json();
                            if (!blobRes.ok || !blobResult.success) {
                              throw new Error("Failed to save payment in blob storage");
                            }

                            // 3️⃣ Redirect to success page
                            const encryptedData = btoa(
                              JSON.stringify(savePaymentPayload)
                            );
                            const query = new URLSearchParams({
                              status: "success",
                              web_token: dataToShow?.web_token || "",
                              orderID: data.orderID || "",
                              other_info: encryptedData || "",
                            }).toString();

                            router.push(`/payment_success?${query}`);
                          } catch (error) {
                            console.error("❌ Error in onApprove:", error);
                            await sendErrorToCMS({
                              name: dataToShow?.name || "Unknown User",
                              email: dataToShow?.email || "Unknown Email",
                              errorMessage: `Something went wrong while approving the PayPal transaction (capture/save step): ${(error as Error).message ||
                                "Unknown error in onApprove"
                                }`,
                            });
                            // You can optionally set payment error here if you want a special message
                            setErrorMsg("payment-failed");
                            // toast.error(
                            //   "Your payment could not be processed at this time. Please try again or contact support."
                            // );
                            router.push(
                              `/register_details?status=failure&web_token=${dataToShow?.web_token}`
                            );
                          } finally {
                            setIsPending(false);
                          }
                        }}

                        onCancel={async (data) => {
                          console.warn("🟠 [PayPal] onCancel Triggered");
                          // console.log("❗ Cancel Payload:", data);

                          // Construct a readable cancel message
                          const cancelMessage = `User canceled the PayPal payment. Order ID: ${data?.orderID || "N/A"
                            }`;

                          await sendErrorToCMS({
                            name: dataToShow?.name || "Unknown User",
                            email: dataToShow?.email || "Unknown Email",
                            errorMessage: cancelMessage,
                          });

                          setShowCancelModal(true);
                        }}

                        onError={async (err) => {
                          console.error("🔴 [PayPal] onError Triggered");
                          console.error("💥 Error Payload:", err);
                          await sendErrorToCMS({
                            name: dataToShow?.name || "Unknown User",
                            email: dataToShow?.email || "Unknown Email",
                            errorMessage: `An unexpected error occurred during the PayPal flow: ${JSON.stringify(err) || "No error in PayPal error"
                              }`,
                          });
                          setErrorMsg("payment-failed");
                          router.push(
                            `/register_details?status=failure&web_token=${dataToShow?.web_token}`
                          );
                        }}
                      />
                    </PayPalScriptProvider>
                  ) : (
                    <p>Loading payment information...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        !details && !errorMsg && (
          <p style={{ textAlign: "center" }}>Loading...</p>
        )
      }
      {/* {showCancelModal && <CancelModal />} */}

      {
        showModal && (
          <div
            className="modal2 brochure-form-modal"
            id="myModal"
            tabIndex={-1}
            role="dialog"
          >
            <div className="modal-dialog2 modal-confirm fade-in" role="document">
              <div className="modal-content2">
                <div className="modal-header">
                  <div className="icon-box">
                    <i
                      className="bx bx-gift"
                      style={{ marginBottom: "35px" }}
                    ></i>
                  </div>
                  <h4 className="modal-title w-100">Discount Coupon</h4>
                  <button
                    type="button"
                    className="close"
                    onClick={toggleModal}
                    style={{ fontSize: "30px" }}
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="row">
                      <div className="d-flex name-info">
                        <div className="col-12 test">
                          <label>Enter Discount Coupon:*</label>
                          <input
                            ref={inputRef}
                            type="text"
                            className="form-control discount-input"
                            placeholder="Enter coupon code"
                            value={couponCodeToCheck}
                            onChange={(e) => setCouponCodeToCheck(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                          {localError && (
                            <div
                              className="error-message"
                              style={{ color: "red", fontSize: "14px" }}
                            >
                              {localError}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-success btn-block"
                        onClick={handleApplyCoupon}
                      >
                        Apply Coupon
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showCancelModal && (
          <div className="modal" id="myModal" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-confirm fade-in" role="document">
              <div className="modal-content">
                <p className="" style={{ fontSize: "18px" }}>
                  You clicked cancel. Do you want to try again?
                </p>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-success btn-block"
                    onClick={() => setShowCancelModal(false)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    textAlign: "center",
  },
  failureBox: {
    maxWidth: "800px",
    width: "90%",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    textAlign: "left",
  },
  content1: {
    marginTop: "10px",
    marginBottom: "0px",
    textAlign: "center",
  },
  headingTitle: {
    color: "#737373",
    fontWeight: 600,
    fontSize: "24px",
    textAlign: "center",
  },
  tryButton: {
    display: "inline-block",
    borderRadius: "7px",
    color: "#fff",
    margin: "7px 0 0",
    letterSpacing: ".5px",
    fontSize: "20px",
    padding: "8px 28px",
    backgroundColor: "#029bb4", // Default background
  },
  tryButtonHover: {
    backgroundColor: "#029bb4", // Hover background
  },

};

export default RegisterDetails;
