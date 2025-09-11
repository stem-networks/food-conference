"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "../styles/bootstrap.css";
import "../styles/animate.css";
import "../styles/common.css";
import "../styles/flaticon.css";
import "../styles/style.css";
import "../styles/theme.css";
import "../styles/style-header.css";
import "../styles/boxicons.min.css";
import "../styles/responsive.css";
import "../styles/revolution-slider.css";
import "../styles/owl.css";
import { ApiResponse, RegistrationInfo } from "@/types";

interface SubItem {
  title: string;
  link: string;
}
interface HeaderProps {
  generalData: ApiResponse;
  registerData: RegistrationInfo
}

const Header: React.FC<HeaderProps> = ({ generalData, registerData }) => {

  const general = generalData?.data || {};
  const navItems = generalData?.display_features || {}


  // const presenterFee = registerData?.increment_price["Presenter (In-Person)"]?.total || "0";
  const [presenterFee, setPresenterFee] = useState<string | null>(null);

  useEffect(() => {
    const fee = registerData?.increment_price["Presenter (In-Person)"]?.total || null;
    setPresenterFee(fee);
  }, [registerData])

  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(true);
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>(
    {}
  );

  const pathname = usePathname();



  useEffect(() => {
    const handleScroll = () => {
      const mainHeader = document.querySelector(".main-header") as HTMLElement;
      const scrollToTop = document.querySelector(
        ".scroll-to-top"
      ) as HTMLElement;
      const windowPos = window.scrollY;

      if (mainHeader) {
        if (windowPos >= 250) {
          mainHeader.classList.add("fixed-header");
          if (scrollToTop) scrollToTop.style.display = "block";
        } else {
          mainHeader.classList.remove("fixed-header");
          if (scrollToTop) scrollToTop.style.display = "none";
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleNavbar = () => setIsNavbarCollapsed(!isNavbarCollapsed);

  const toggleDropdown = (key: string) => {
    setDropdownStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="main-header">
        {/* Header Top */}
        <div className="header-top">
          <div className="auto-container clearfix">
            <div className="topbar w-100">
              <ul className="links-nav clearfix">
                <li className="message_wrap">
                  <Link
                    href={`mailto:${general.cemail || ""}`}
                    title={general.cemail || ""}
                  >
                    <i className="bx bx-envelope"></i> {general.cemail || ""}
                  </Link>
                </li>
                <li className="text-center">
                  <Link
                    href={`tel:${general.phone || ""}`}
                    title={general.phone || ""}
                  >
                    <i className="bx bxs-phone-call"></i> {general.phone || ""}
                  </Link>
                </li>
                <li className="regs_wrap text-right">
                  <Link
                    href="/register"
                    title="Register"
                    className={isActive("/register") ? "active" : ""}
                  >
                    Register Now
                  </Link>
                  {presenterFee && <span> For Only ${presenterFee}</span>}
                </li>
                <li className="text-right">{general.venue_p1 || ""}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Header Upper */}
        <div className="header-upper">
          <div className="auto-container">
            <div style={{ justifyContent: "space-between", display: "flex" }}>
              <div className="logo-main-block">
                <Link
                  href="/"
                  className="max_wrap156"
                  title={general.clname || ""}
                >
                  <Image
                    src="/images/images/logo-hd-1.svg"
                    alt={general.clname || ""}
                    className="logo"
                    title={general.clname || ""}
                    width={200}
                    height={80}
                  />
                </Link>
              </div>

              {/* <div className="venue-header-block">
                {general.venue_p1 ? (
                  <div className="map_wrap156" style={{ textAlign: 'start' }}>
                    <Image
                      src="/images/images/map.jpg"
                      alt={general.clname || ""}
                      width={100}
                      height={70}
                      className="map"
                      title={general.clname || ""}
                    />

                    {(() => {
                      const addressParts = [
                        general.v1,
                        general.v2,
                      ].filter(Boolean) as string[];

                      return addressParts.length > 0 ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: addressParts.join("<br />"),
                          }}
                        />
                      ) : null;
                    })()}
                  </div>
                ) : null}
              </div>

              <div className='approved-provider-block'>
                <Image src="/images/images/cpd.jpg" alt="CPD Accredited Conference" className='approved-prov-img' title="CPD Accredited Conference" width={360} height={130} />
              </div> */}

              <div className="img_text5">
                <Link href="/register" title={general.clname}>
                  <div className="june_wrap55">
                    <h1>{general.clname}-{general.csname} {general.year}</h1>
                    <span className="main-head-box"></span>
                    <span>Book Your Slot!</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Header Lower */}
        <div className="header-lower">
          <div className="auto-container">
            <div className="nav-outer clearfix">
              <nav className="main-menu">
                <div className="navbar-header">
                  <Link
                    href="/"
                    className="mobil_lo5"
                    title={general.clname || ""}
                  >
                    <Image
                      src="/images/images/logo-hd-1.svg"
                      alt={general.clname || ""}
                      width={150}
                      height={50}
                      title={general.clname || ""}
                    />
                  </Link>
                  <button
                    type="button"
                    className="navbar-toggle"
                    onClick={toggleNavbar}
                  >
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                  </button>
                </div>
                <div
                  className={`navbar-collapse collapse clearfix ${isNavbarCollapsed ? "" : "in"
                    }`}
                >
                  <ul className="navigation clearfix">
                    {navItems.map((item, index) => (
                      <li
                        key={index}
                        className={item.subItems ? "dropdown" : ""}
                      >
                        {item.subItems ? (
                          <>
                            <Link
                              href={item.link}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleDropdown(
                                  item.title.toLowerCase().replace(" ", "")
                                );
                              }}
                              title={item.title}
                              className={isActive(item.link) ? "active" : ""}
                            >
                              {item.title}{" "}
                              {dropdownStates[
                                item.title.toLowerCase().replace(" ", "")
                              ] ? (
                                <i className="fa fa-angle-up"></i>
                              ) : (
                                <i className="fa fa-angle-down"></i>
                              )}
                            </Link>
                            <ul
                              className={`dropdown-menu ${dropdownStates[
                                item.title.toLowerCase().replace(" ", "")
                              ]
                                ? "show"
                                : ""
                                }`}
                            >
                              {item.subItems.map(
                                (subItem: SubItem, subIndex: number) => (
                                  <li key={subIndex}>
                                    <Link
                                      href={subItem.link}
                                      title={subItem.title}
                                      className={
                                        isActive(subItem.link) ? "active" : ""
                                      }
                                    >
                                      {subItem.title}
                                    </Link>
                                  </li>
                                )
                              )}
                            </ul>
                          </>
                        ) : (
                          <Link
                            href={item.link}
                            title={item.title}
                            className={isActive(item.link) ? "active" : ""}
                          >
                            {item.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* Sticky Header */}
        <div className="sticky-header">
          <div className="auto-container clearfix">
            <div className="logo pull-left">
              <Link
                href="/"
                className="img-responsive"
                title={general.clname || ""}
              >
                <Image
                  src="/images/images/logo-hd-1.svg"
                  alt={general.clname || ""}
                  className="sti-logo"
                  title={general.clname || ""}
                  width={150}
                  height={50}
                />
              </Link>
            </div>
            <div className="right-col pull-right">
              <nav className="main-menu">
                <div className="navbar-header">
                  <button
                    type="button"
                    className="navbar-toggle"
                    onClick={toggleNavbar}
                  >
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                  </button>
                </div>
                <div
                  className={`navbar-collapse collapse clearfix ${isNavbarCollapsed ? "" : "in"
                    }`}
                >
                  <ul className="navigation clearfix">
                    {navItems.map((item, index) => (
                      <li
                        key={index}
                        className={item.subItems ? "dropdown" : ""}
                      >
                        {item.subItems ? (
                          <>
                            <Link
                              href={item.link}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleDropdown(
                                  item.title.toLowerCase().replace(" ", "")
                                );
                              }}
                              title={item.title}
                              className={isActive(item.link) ? "active" : ""}
                            >
                              {item.title}{" "}
                              {dropdownStates[
                                item.title.toLowerCase().replace(" ", "")
                              ] ? (
                                <i className="fa fa-angle-up"></i>
                              ) : (
                                <i className="fa fa-angle-down"></i>
                              )}
                            </Link>
                            <ul
                              className={`dropdown-menu ${dropdownStates[
                                item.title.toLowerCase().replace(" ", "")
                              ]
                                ? "show"
                                : ""
                                }`}
                            >
                              {item.subItems.map(
                                (subItem: SubItem, subIndex: number) => (
                                  <li key={subIndex}>
                                    <Link
                                      href={subItem.link}
                                      title={subItem.title}
                                      className={
                                        isActive(subItem.link) ? "active" : ""
                                      }
                                    >
                                      {subItem.title}
                                    </Link>
                                  </li>
                                )
                              )}
                            </ul>
                          </>
                        ) : (
                          <Link
                            href={item.link}
                            title={item.title}
                            className={isActive(item.link) ? "active" : ""}
                          >
                            {item.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}


export default Header;