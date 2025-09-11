"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import countries from "../../data/countries";
import { toast } from "react-toastify";

interface FormDataState {
  module_name: string;
  title: string;
  name: string;
  email: string;
  alt_email: string;
  phone: string;
  whatsapp_number: string;
  city: string;
  country: string;
  organization: string;
  intrested: string;
  abstract_title: string;
  message: string;
  upload_abstract_file: File | null;
}

interface CaptchaRefType {
  focusCaptcha: () => void;
}

type PossibleRef =
  | React.RefObject<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
  >
  | React.RefObject<CaptchaRefType | null>;

interface FormAutoData {
  title: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  alt_email: string;
  phone: string;
  whatsapp_number: string;
  city: string;
  country: string;
  organization: string;
  intrested: string;
  abstract_title: string;
  message: string;
  form_type: string;
  submit_status: string;
  web_token?: string;
}

// Your custom captcha ref type
interface CaptchaRefTypeFull {
  focusCaptcha: () => void;
  resetCaptchaInput: () => void;
  refreshCaptcha: () => void;
}

// FieldRef type union includes both types of refs
type FieldRef =
  | React.RefObject<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
  >
  | React.RefObject<CaptchaRefTypeFull | null>
  | null;

interface Errors {
  [key: string]: string | null;
}

interface CaptchaValue {
  text: string;
  captchaId: string;
}

import map2 from "../../../public/images/images/map.png";
import { ApiResponse } from "@/types";
import Captcha, { CaptchaRef } from "./Captcha";

interface GeneralInfoProps {
  generalInfo: ApiResponse;
}

const AbstractSubmission: React.FC<GeneralInfoProps> = ({ generalInfo }) => {
  // general's structure is not fully typed; safely access with optional chaining
  const general = (generalInfo?.data ?? {}) as {
    site_url?: string;
    clname?: string;
    csname?: string;
    year?: string;
    clogotext?: string;
    full_length_dates?: string;
    venue_p1?: string;
  };

  const [formData, setFormData] = useState<FormDataState>({
    module_name: "abstract_save",
    title: "",
    name: "",
    email: "",
    alt_email: "",
    phone: "",
    whatsapp_number: "",
    city: "",
    country: "",
    organization: "",
    intrested: "",
    abstract_title: "",
    message: "",
    upload_abstract_file: null,
  });

  const [formAutoData, setFormAutoData] = useState<FormAutoData>({
    title: "",
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    alt_email: "",
    phone: "",
    whatsapp_number: "",
    city: "",
    country: "",
    organization: "",
    intrested: "",
    abstract_title: "",
    message: "",
    form_type: "abstract",
    submit_status: "0",
  });

  const [selectedFileName, setSelectedFileName] =
    useState<string>("No File Chosen");
  const [errors, setErrors] = useState<Errors>({});
  const [showModal, setShowModal] = useState<boolean>(false);
  const [captchaValue, setCaptchaValue] = useState<CaptchaValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Refs for input fields
  const titleRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const altEmailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLSelectElement>(null);
  const organizationRef = useRef<HTMLInputElement>(null);
  const intrestedRef = useRef<HTMLSelectElement>(null);
  const abstractTitleRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captchaRef = useRef<CaptchaRef>(null);
  const [isCaptchaValid, setIsCaptchaValid] = useState<boolean>(false);

  const [formErrors, setFormErrors] = useState<{
    [key: string]: string | undefined;
  }>({});

  // Extract dynamic project name from general.site_url, sanitize, and keep it safe for server path segments
  // const rawSiteUrl = general?.site_url || "";
  // const siteHostname = rawSiteUrl
  //   .replace(/^https?:\/\//, "")
  //   .replace(/\/.*$/, "") // trim path
  //   .replace(/\.[a-z]+$/i, ""); // drop TLD like .com
  // const sanitizedProject =
  //   (siteHostname || "uploads").replace(/[^a-zA-Z0-9-_]/g, "") || "uploads";

  // Extract dynamic project name from general.site_url, sanitize, and keep it safe for server path segments
  const rawSiteUrl = general?.site_url || "";

  const sanitizedProject = (() => {
    try {
      if (!rawSiteUrl) return "uploads";

      // Use URL to reliably get hostname
      const { hostname } = new URL(rawSiteUrl);

      // Split by dot
      const parts = hostname.split(".");

      // Take the first part (subdomain if exists, else domain)
      let projectName = parts[0] || "uploads";

      // Sanitize: only allow letters, numbers, dash, underscore
      projectName = projectName.replace(/[^a-zA-Z0-9-_]/g, "");

      return projectName || "uploads";
    } catch {
      return "uploads";
    }
  })();

  // Upload File to CMS (server route expects multipart with "file" and "project")
  async function uploadFile(
    file: File | null,
    projectName: string
  ): Promise<string> {
    if (!file) return "";

    const fd = new FormData();
    fd.append("file", file);
    fd.append("project", projectName); // used in the server route for path prefix

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    });

    // Improved error extraction: try JSON, fallback to text
    if (!uploadRes.ok) {
      let message = "File upload failed";
      try {
        const data: unknown = await uploadRes.json();
        if (
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
        ) {
          message = (data as { error: string }).error;
        }
      } catch {
        try {
          const text = await uploadRes.text();
          if (text) message = text;
        } catch {
          // ignore
        }
      }
      throw new Error(message);
    }

    // Expecting { fileUrl }
    try {
      const data: unknown = await uploadRes.json();
      if (
        data &&
        typeof data === "object" &&
        "fileUrl" in data &&
        typeof (data as { fileUrl?: unknown }).fileUrl === "string"
      ) {
        return (data as { fileUrl: string }).fileUrl;
      }
    } catch {
      // If server returned blob JSON directly, try to parse url field
      try {
        const text = await uploadRes.text();
        // last-resort naive parsing
        const urlMatch = text.match(/https?:\/\/[^\s"]+/);
        if (urlMatch) return urlMatch[0];
      } catch {
        // ignore
      }
    }

    throw new Error("Upload succeeded but no file URL returned");
  }

  function validateAbstractFile(file: File | null): string | null {
    if (!file) return "Abstract file is required";

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/rtf",
      "application/rtf",
    ] as const;

    if (!allowedTypes.includes(file.type as (typeof allowedTypes)[number])) {
      return "Invalid file type. Please upload a PDF, DOC, DOCX, or RTF file.";
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB
      return "File size should be less than 2MB.";
    }

    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement & { files?: FileList | null };
    const files = target.files ?? null;

    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));

    if (name === "upload_abstract_file" && files && files.length > 0) {
      const file = files[0];
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/rtf",
        "application/rtf",
      ] as const;

      if (!allowedTypes.includes(file.type as (typeof allowedTypes)[number])) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          upload_abstract_file: "Please select a PDF, DOC, DOCX, or RTF file.",
        }));
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          upload_abstract_file: "File size should be less than 2MB.",
        }));
        return;
      }

      setFormData((prevData) => ({
        ...prevData,
        [name]: file,
      }));

      setSelectedFileName(file.name);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      setFormAutoData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    fieldName: string,
    nextFieldRef?: PossibleRef
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newErrors: Errors = {};
      let fieldValid = true;

      if (fieldName === "title" && !formData.title) {
        newErrors.title = "Title is required";
        fieldValid = false;
      } else if (fieldName === "name" && !formData.name) {
        newErrors.name = "Name is required";
        fieldValid = false;
      } else if (fieldName === "email") {
        if (!formData.email) {
          newErrors.email = "Email is required";
          fieldValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Email is Invalid";
          fieldValid = false;
        }
      } else if (
        fieldName === "alt_email" &&
        formData.alt_email &&
        !/\S+@\S+\.\S+/.test(formData.alt_email)
      ) {
        newErrors.alt_email = "Alternative Email is Invalid";
        fieldValid = false;
      } else if (fieldName === "phone" && !formData.phone) {
        newErrors.phone = "Phone number is required";
        fieldValid = false;
      } else if (fieldName === "city" && !formData.city) {
        newErrors.city = "City is required";
        fieldValid = false;
      } else if (fieldName === "country" && !formData.country) {
        newErrors.country = "Country is required";
        fieldValid = false;
      } else if (fieldName === "organization" && !formData.organization) {
        newErrors.organization = "Organization is required";
        fieldValid = false;
      } else if (fieldName === "intrested" && !formData.intrested) {
        newErrors.intrested = "Intrested In is required";
        fieldValid = false;
      } else if (fieldName === "abstract_title" && !formData.abstract_title) {
        newErrors.abstract_title = "Abstract Title is required";
        fieldValid = false;
      } else if (
        fieldName === "upload_abstract_file" &&
        !formData.upload_abstract_file
      ) {
        const fileError = validateAbstractFile(formData.upload_abstract_file);
        if (fileError) {
          newErrors.upload_abstract_file = fileError;
          fieldValid = false;
        }
      }

      if (!fieldValid) {
        setErrors(newErrors);
        const msg = newErrors[fieldName] ?? "Validation error";
        toast.error(msg);

        switch (fieldName) {
          case "title":
            titleRef.current?.focus();
            break;
          case "name":
            nameRef.current?.focus();
            break;
          case "email":
            emailRef.current?.focus();
            break;
          case "alt_email":
            altEmailRef.current?.focus();
            break;
          case "phone":
            phoneRef.current?.focus();
            break;
          case "city":
            cityRef.current?.focus();
            break;
          case "country":
            countryRef.current?.focus();
            break;
          case "organization":
            organizationRef.current?.focus();
            break;
          case "abstract_title":
            abstractTitleRef.current?.focus();
            break;
          case "upload_abstract_file":
            fileRef.current?.focus();
            break;
          case "captcha":
            captchaRef.current?.focusCaptcha();
            break;
        }
        return;
      }

      setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: "" }));

      if (nextFieldRef?.current) {
        // Narrow to either CaptchaRef or a focusable form element
        const nextObj = nextFieldRef.current;
        const maybeCaptcha = nextObj as unknown as {
          focusCaptcha?: () => void;
        };
        const maybeFocusable = nextObj as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement
          | null;

        if (maybeCaptcha && typeof maybeCaptcha.focusCaptcha === "function") {
          maybeCaptcha.focusCaptcha();
        } else if (
          maybeFocusable &&
          typeof maybeFocusable.focus === "function"
        ) {
          maybeFocusable.focus();
        }
      } else if (fieldName === "upload_abstract_file" && !isCaptchaValid) {
        captchaRef.current?.focusCaptcha();
      }
    }
  };

  const handleCaptchaInputChange = () => {
    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors.captcha;
      return newErrors;
    });
  };

  const closeModal = () => {
    setShowModal(false);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setShowModal(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  const handleDownloadAbstract = () => {
    const link = document.createElement("a");
    link.href = "/Sample Abstract.docx";
    link.setAttribute("download", "Sample Abstract.docx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendFullFormData = async (
    updatedData: FormAutoData,
    submitStatus?: string
  ) => {
    try {
      // First validate the email
      if (!updatedData.email || !isValidEmail(String(updatedData.email))) {
        console.error("Cannot send form data - invalid or missing email");
        return null;
      }

      const fd = new FormData();

      Object.entries(updatedData).forEach(([key, value]) => {
        const trimmedValue =
          typeof value === "string" ? value.trim() : value ?? "";
        fd.append(key, String(trimmedValue));
      });

      if (submitStatus) {
        fd.append("submit_status", submitStatus);
      }

      const response = await axios.post("/api/send-to-cms", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data as unknown;
    } catch (error) {
      console.error("Error sending form data:", error);
      await sendErrorToCMS({
        name: String(updatedData.name || "Unknown User"),
        email: String(updatedData.email || "Unknown Email"),
        errorMessage:
          "An unexpected error occurred while saving your Abstract: " +
          (error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : JSON.stringify(error)),
        formBased: "CMS Abstract Form Submission",
      });
      return null;
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    const updatedData = {
      ...formAutoData,
      [name]: value,
      submit_status: formAutoData.submit_status || "0",
    } as FormAutoData;

    setFormAutoData(updatedData);

    // Validate email only if it exists
    const emailValue = name === "email" ? value : updatedData.email;

    if (!emailValue) {
      if (name === "email") {
        setErrors((prev) => ({ ...prev, email: "Email is required." }));
      }
      return; // Don't send API if email is missing
    }

    if (!isValidEmail(emailValue)) {
      if (name === "email") {
        setErrors((prev) => ({ ...prev, email: "Invalid email format." }));
      }
      return; // Don't send API if email is invalid
    }

    // Clear email error and send form data
    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: "" }));
    }

    // The email is valid at this point, so we can send the data
    void sendFullFormData(updatedData);
  };

  // UTF-8 safe Base64 encoder
  function utf8ToBase64(str: string) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});
    const nextErrors: Errors = {};
    let firstErrorField: FieldRef = null;

    // ====== VALIDATION ======
    if (!formData.title) {
      nextErrors.title = "Title is required";
      firstErrorField = titleRef;
    } else if (!formData.name) {
      nextErrors.name = "Name is required";
      firstErrorField = nameRef;
    } else if (!formData.email) {
      nextErrors.email = "Email is required";
      firstErrorField = emailRef;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Email is Invalid";
      firstErrorField = emailRef;
    } else if (formData.alt_email && !/\S+@\S+\.\S+/.test(formData.alt_email)) {
      nextErrors.alt_email = "Alternative Email is Invalid";
      firstErrorField = altEmailRef;
    } else if (!formData.phone) {
      nextErrors.phone = "Phone number is required";
      firstErrorField = phoneRef;
    } else if (!formData.city) {
      nextErrors.city = "City is required";
      firstErrorField = cityRef;
    } else if (!formData.country) {
      nextErrors.country = "Country is required";
      firstErrorField = countryRef;
    } else if (!formData.organization) {
      nextErrors.organization = "Organization is required";
      firstErrorField = organizationRef;
    } else if (!formData.intrested) {
      nextErrors.intrested = "Interested In is required";
      firstErrorField = intrestedRef;
    } else if (!formData.abstract_title) {
      nextErrors.abstract_title = "Abstract Title is required";
      firstErrorField = abstractTitleRef;
    } else if (!formData.upload_abstract_file) {
      nextErrors.upload_abstract_file = "Abstract file is required";
      firstErrorField = fileRef;
    }

    // ====== CAPTCHA CHECK ======
    if (
      !nextErrors.title &&
      !nextErrors.name &&
      !nextErrors.email &&
      !nextErrors.alt_email &&
      !nextErrors.phone &&
      !nextErrors.city &&
      !nextErrors.country &&
      !nextErrors.organization &&
      !nextErrors.intrested &&
      !nextErrors.abstract_title &&
      !nextErrors.upload_abstract_file
    ) {
      if (
        !captchaValue ||
        !captchaValue.text ||
        captchaValue.text.trim() === ""
      ) {
        nextErrors.captcha = "CAPTCHA is required";
        setErrors(nextErrors);
        toast.error(nextErrors.captcha);
        captchaRef.current?.focusCaptcha?.();
        return;
      } else if (!isCaptchaValid) {
        nextErrors.captcha = "Invalid CAPTCHA";
        setErrors(nextErrors);
        toast.error(nextErrors.captcha);
        captchaRef.current?.focusCaptcha?.();
        return;
      } else {
        const fileError = validateAbstractFile(formData.upload_abstract_file);
        if (fileError) {
          nextErrors.upload_abstract_file = fileError;
          firstErrorField = fileRef;
        }
      }
    }

    // ====== SHOW VALIDATION ERRORS ======
    if (Object.keys(nextErrors).length > 0) {
      setErrors({ ...nextErrors });

      const firstErrorMessage = Object.values(nextErrors)[0];
      toast.error(firstErrorMessage ?? "Validation Error");

      const focusable =
        firstErrorField && "current" in firstErrorField
          ? firstErrorField.current
          : null;

      if (
        focusable &&
        typeof (
          focusable as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement
        ).focus === "function"
      ) {
        (
          focusable as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement
        ).focus();
      }

      return;
    }

    // ====== SUBMIT FORM ======
    setIsSubmitting(true);

    try {
      // Upload file and get URL using sanitized project name
      const fileUrl = await uploadFile(
        formData.upload_abstract_file,
        sanitizedProject
      );

      // Construct other_info field
      const otherInfo = {
        whatsapp_number: formData.whatsapp_number.trim(),
        city: formData.city.trim(),
        organization: formData.organization.trim(),
        message: formData.message.trim(),
      };

      // Final payload with other_info field (base64-encoded fields)
      const payload = {
        abstract_title: utf8ToBase64(formData.abstract_title.trim()),
        title: utf8ToBase64(formData.title.trim()),
        name: utf8ToBase64(formData.name.trim()),
        country: utf8ToBase64(formData.country.trim()),
        email: utf8ToBase64(formData.email.trim()),
        alt_email: utf8ToBase64(formData.alt_email.trim()),
        phone: utf8ToBase64(formData.phone.trim()),
        intrested: utf8ToBase64(formData.intrested.trim()),
        upload_abstract_file: utf8ToBase64(fileUrl.trim()),
        other_info: utf8ToBase64(JSON.stringify(otherInfo)),
      };

      const response = await fetch("/api/abstract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {

        // -----------------------------
        // Trigger send-to-cms with submit_status = "1"
        // -----------------------------
        try {
          // Build the plain-text auto data (same shape as used by handleBlur autosave)
          const updatedAutoData: FormAutoData = {
            title: formData.title || "",
            name: formData.name || "",
            first_name: "",
            last_name: "",
            email: formData.email || "",
            alt_email: formData.alt_email || "",
            phone: formData.phone || "",
            whatsapp_number: formData.whatsapp_number || "",
            city: formData.city || "",
            country: formData.country || "",
            organization: formData.organization || "",
            intrested: formData.intrested || "",
            abstract_title: formData.abstract_title || "",
            message: formData.message || "",
            form_type: "abstract",
            submit_status: "1", // <-- mark as submitted
          };

          const cmsResult = await sendFullFormData(updatedAutoData);
          if (!cmsResult) {
            console.warn("send-to-cms returned no data or failed. Check server logs.");
          }
        } catch (cmsErr) {
          console.error("Error while calling send-to-cms after submit:", cmsErr);
        }

        setShowModal(true);

        setFormData({
          module_name: "abstract_save",
          title: "",
          name: "",
          email: "",
          alt_email: "",
          phone: "",
          whatsapp_number: "",
          city: "",
          country: "",
          organization: "",
          intrested: "",
          abstract_title: "",
          message: "",
          upload_abstract_file: null,
        });
        captchaRef.current?.refreshCaptcha();
      } else {
        let message = "Failed to submit the form";
        try {
          const errorAbs: unknown = await response.json();
          if (
            errorAbs &&
            typeof errorAbs === "object" &&
            "error" in errorAbs &&
            typeof (errorAbs as { error?: unknown }).error === "string"
          ) {
            message = (errorAbs as { error: string }).error;
          }
        } catch {
          try {
            const text = await response.text();
            if (text) message = text;
          } catch {
            // ignore
          }
        }
        toast.error(message);
        await sendErrorToCMS({
          name: formData?.name || "Unknown User",
          email: formData?.email || "Unknown Email",
          errorMessage: `Form submission failed with server response: ${message}`,
        });
      }
    } catch (error) {
      console.error("Form submission failed:", error);
      const message =
        error instanceof Error ? error.message : "Unknown upload error";
      toast.error(
        message || "There was an error submitting the form. Please try again."
      );
      await sendErrorToCMS({
        name: formData?.name || "Unknown User",
        email: formData?.email || "Unknown Email",
        errorMessage: `Failed to submit Abstract form: ${message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // sendError to Telegram
  async function sendErrorToCMS({
    name,
    email,
    errorMessage,
    formBased = "Abstract Form",
    siteName = `${general.clname || "N/A"} (${general.csname || "N/A"} - ${general.year || "N/A"
    })`,
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
      payload.append("siteName", siteName);

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

  return (
    <div>
      <div className="brand_wrap">
        <div className="auto-container">
          <div className="row">
            <div className="col-md-12">
              <Link href="/" title="Navigate to Homepage">
                Home
              </Link>{" "}
              <i className="fa fa-angle-right"></i>
              <span>Abstract Submission</span>
            </div>
          </div>
        </div>
      </div>
      <h2
        className="abs_wrap5 wow fadeInUp"
        data-wow-delay="400ms"
        data-wow-duration="1000ms"
      >
        Abstract Submission
      </h2>
      <div className="bg_add_form15">
        <div className="auto-container">
          <div className="row clearfix">
            <form
              id="abstractform"
              ref={formRef}
              onSubmit={handleSubmit}
              method="POST"
            >
              <div
                className="col-md-8 wow fadeInUp"
                data-wow-delay="400ms"
                data-wow-duration="1000ms"
              >
                <div className="row clearfix">
                  <div className="col-md-6 left15">
                    <select
                      name="title"
                      className="set157"
                      id="title"
                      onChange={handleChange}
                      ref={titleRef}
                      onKeyDown={(e) => handleKeyDown(e, "title", nameRef)}
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.title}
                      onBlur={handleBlur}
                    >
                      <option value="">Select</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Miss.">Miss.</option>
                      <option value="Mrs.">Mrs.</option>
                    </select>
                    {errors.title && (
                      <div className="error">{errors.title}</div>
                    )}
                  </div>
                  <div className="col-md-6 left16">
                    <input
                      name="name"
                      id="name"
                      className="set157"
                      placeholder="Name"
                      type="text"
                      onChange={handleChange}
                      ref={nameRef}
                      onKeyDown={(e) => handleKeyDown(e, "name", emailRef)}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      value={formData.name}
                      onBlur={handleBlur}
                    />
                    {errors.name && <div className="error">{errors.name}</div>}
                  </div>
                </div>
                <div className="row clearfix">
                  <div className="col-md-6 left15">
                    <input
                      name="email"
                      id="email"
                      className="set157"
                      placeholder="Email"
                      type="text"
                      onChange={handleChange}
                      ref={emailRef}
                      onKeyDown={(e) => handleKeyDown(e, "email", altEmailRef)}
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.email}
                      onBlur={handleBlur}
                    />
                    {errors.email && (
                      <div className="error">{errors.email}</div>
                    )}
                  </div>
                  <div className="col-md-6 left16">
                    <input
                      name="alt_email"
                      id="alt_email"
                      className="set157"
                      placeholder="Alternative Email"
                      type="text"
                      onChange={handleChange}
                      ref={altEmailRef}
                      onKeyDown={(e) => handleKeyDown(e, "alt_email", phoneRef)}
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.alt_email}
                      onBlur={handleBlur}
                    />
                    {errors.alt_email && (
                      <div className="error">{errors.alt_email}</div>
                    )}
                  </div>
                </div>
                <div className="row clearfix">
                  <div className="col-md-6 left15">
                    <input
                      name="phone"
                      id="phone"
                      className="set157"
                      placeholder="Phone"
                      type="text"
                      onChange={handleChange}
                      ref={phoneRef}
                      onKeyDown={(e) => handleKeyDown(e, "phone", whatsappRef)}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      value={formData.phone}
                      onBlur={handleBlur}
                    />
                    {errors.phone && (
                      <div className="error">{errors.phone}</div>
                    )}
                  </div>
                  <div className="col-md-6 left16">
                    <input
                      name="whatsapp_number"
                      id="whatsapp_number"
                      className="set157"
                      placeholder="WhatsApp Number"
                      type="text"
                      onChange={handleChange}
                      ref={whatsappRef}
                      onKeyDown={(e) =>
                        handleKeyDown(e, "whatsapp_number", cityRef)
                      }
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.whatsapp_number}
                      onBlur={handleBlur}
                    />
                    {errors.whatsapp_number && (
                      <div className="error">{errors.whatsapp_number}</div>
                    )}
                  </div>
                </div>
                <div className="row clearfix">
                  <div className="col-md-6 left15">
                    <input
                      name="city"
                      id="city"
                      className="set157"
                      placeholder="City"
                      type="text"
                      onChange={handleChange}
                      ref={cityRef}
                      onKeyDown={(e) => handleKeyDown(e, "city", countryRef)}
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.city}
                      onBlur={handleBlur}
                    />
                    {errors.city && <div className="error">{errors.city}</div>}
                  </div>
                  <div className="col-md-6 left16">
                    <select
                      name="country"
                      className="set156"
                      id="country"
                      onChange={handleChange}
                      ref={countryRef}
                      onKeyDown={(e) =>
                        handleKeyDown(e, "country", organizationRef)
                      }
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.country}
                    >
                      <option value="">Select Country</option>
                      {countries.map((country: string) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <div className="error">{errors.country}</div>
                    )}
                  </div>
                </div>
                <div className="row clearfix">
                  <div className="col-md-6 left15">
                    <input
                      name="organization"
                      id="organization"
                      className="set157"
                      placeholder="Organization"
                      type="text"
                      onChange={handleChange}
                      ref={organizationRef}
                      onKeyDown={(e) =>
                        handleKeyDown(e, "organization", intrestedRef)
                      }
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.organization}
                      onBlur={handleBlur}
                    />
                    {errors.organization && (
                      <div className="error">{errors.organization}</div>
                    )}
                  </div>
                  <div className="col-md-6 left16">
                    <select
                      name="intrested"
                      className="set156"
                      id="intrested"
                      onChange={handleChange}
                      ref={intrestedRef}
                      onKeyDown={(e) =>
                        handleKeyDown(e, "intrested", abstractTitleRef)
                      }
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.intrested}
                    >
                      <option value="">Interested In</option>
                      <option value="Oral Presentation">
                        Oral Presentation
                      </option>
                      <option value="Poster Presentation">
                        Poster Presentation
                      </option>
                      <option value="Delegate">Delegate</option>
                    </select>
                    {errors.intrested && (
                      <div className="error">{errors.intrested}</div>
                    )}
                  </div>
                </div>
                <div className="row clearfix">
                  <div className="col-md-12">
                    <input
                      name="abstract_title"
                      id="abstract_title"
                      className="set157"
                      placeholder="Abstract Title"
                      type="text"
                      onChange={handleChange}
                      ref={abstractTitleRef}
                      onKeyDown={(e) =>
                        handleKeyDown(e, "abstract_title", messageRef)
                      }
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.abstract_title}
                      onBlur={handleBlur}
                    />
                    {errors.abstract_title && (
                      <div className="error">{errors.abstract_title}</div>
                    )}
                  </div>
                </div>
                <div className="row clearfix">
                  <div className="col-md-12">
                    <textarea
                      name="message"
                      id="message"
                      className="set158"
                      placeholder="Message"
                      onChange={handleChange}
                      ref={messageRef}
                      onKeyDown={(e) => handleKeyDown(e, "message", fileRef)}
                      disabled={isSubmitting}
                      autoComplete="off"
                      value={formData.message}
                      onBlur={handleBlur}
                    ></textarea>
                    {errors.message && (
                      <div className="error">{errors.message}</div>
                    )}
                  </div>
                </div>

                <div className="row clearfix">
                  <div className="col-md-12 mar_lk55">
                    <div className="upload_wrap15 col-lg-6 pd0">
                      <div className="upload_wrat55">
                        <span>Upload Your Abstract File* :</span>
                        <span>
                          <button
                            type="button"
                            className="ab-dbtn"
                            onClick={handleDownloadAbstract}
                            title="Download Sample Abstract File"
                          >
                            Download Sample Abstract File
                          </button>
                        </span>
                      </div>
                      <span className="back_wrapblue">
                        <input
                          name="upload_abstract_file"
                          className="abck155"
                          type="file"
                          id="upload_abstract_file"
                          onChange={handleChange}
                          ref={fileRef}
                          onKeyDown={(e) =>
                            handleKeyDown(e, "upload_abstract_file", captchaRef)
                          }
                          disabled={isSubmitting}
                        />
                        <b>Choose file</b>
                        <span id="selected_file">{selectedFileName}</span>
                      </span>

                      <span className="selct_wrap_pdf">
                        Select PDF, DOC, DOCX or rtf File
                      </span>
                      {errors.upload_abstract_file && (
                        <div className="error">
                          {errors.upload_abstract_file}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row clearfix">
                  <div className="col-md-12" style={{ marginTop: "20px" }}>
                    <Captcha
                      ref={captchaRef}
                      onValidate={setIsCaptchaValid}
                      onInputChange={handleCaptchaInputChange}
                      setCaptchaValue={setCaptchaValue}
                      isSubmitting={isSubmitting}
                    />
                    {formErrors.captcha && (
                      <p className="error">{formErrors.captcha}</p>
                    )}
                  </div>
                </div>
                <hr />
                <div className="row">
                  <div className="col-lg-6">
                    <button
                      type="submit"
                      name="submit"
                      className="bt_nmk5"
                      title="Submit Abstract"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Please Wait..." : "Submit Abstract"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div
              className="col-md-4 wow fadeInUp"
              data-wow-delay="400ms"
              data-wow-duration="1500ms"
            >
              <div className="sq_abmainbox">
                <div className="sq_abbox1"></div>
                <div className="sq_abbox2"></div>
                <span className="nur_wrap11">{general?.clogotext ?? ""}</span>
                <span className="nur_wrap22">CONFERENCE</span>
                <span className="nur_wrap33">
                  {general?.full_length_dates ?? ""}
                </span>
                <span className="map_l55 sq_map">
                  <Image
                    src={map2}
                    alt={general?.clname ?? ""}
                    title={general?.clname ?? ""}
                  />
                  {general?.venue_p1 ?? ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal" id="myModal" tabIndex={-1} role="dialog">
          <div
            className="modal-dialog modal-confirm fade-in"
            role="document"
            ref={modalRef}
          >
            <div className="modal-content">
              <div className="modal-header">
                <div className="icon-box">
                  <i
                    className="material-icons"
                    style={{ marginBottom: "35px" }}
                  >
                    &#10003;
                  </i>
                </div>
                <h4 className="modal-title w-100">
                  Abstract Submitted Successfully!
                </h4>
                <p>We will get in touch with you shortly.</p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success btn-block"
                  onClick={closeModal}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbstractSubmission;
