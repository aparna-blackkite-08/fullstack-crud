import React from "react";
import {
  Navbar,
  Nav,
  NavItem,
  NavbarBrand,
  DropdownItem,
  Container,
  Button,
  UncontrolledDropdown,
} from "components/compat/bootstrap";
import AnimateHeight from "react-animate-height";
import ActiveLink from "components/admin/ActiveLink/ActiveLink";
import Link from "components/compat/Link";
import s from "./Header.module.scss";
import menuImg from "public/images/e-commerce/header/menu.svg";
import { useRouter, type CompatRouter } from "components/compat/router";
import { connect } from "react-redux";
import {
  changeActiveSidebarItem,
  closeSidebar,
  openSidebar,
} from "@/redux/actions/navigation";
import axios from "axios";
import type { RootState } from "@/redux/store";
import type { User } from "types/domain";
import type { Dispatch, UnknownAction } from "redux";
import { isAuthenticated, logoutUser } from "../../../src/utils/auth";
import { toast, ToastContainer } from "react-toastify";


interface NotificationItem {
  _id: string;
  sender: {
    _id: string;
    name?: string;
  } | string;
  photo: {
    _id: string;
    title?: string;
    imageUrl?: string;
  } | string;
  type: "like";
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  currentUser: User | null;
  dispatch: Dispatch<UnknownAction>;
  router: CompatRouter;
  sidebarOpened: boolean;
}

interface HeaderState {
  count: number;
  heightOne: number | "auto";
  heightTwo: number | "auto";
  heightThree: number | "auto";
  heightFour: number | "auto";
  innerWidth: number;
  isLoggedIn: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  showNotifications: boolean;
}

class Header extends React.Component<HeaderProps, HeaderState> {
  // Timer used to refresh notifications every 30 seconds
  notificationTimer?: ReturnType<typeof setInterval>;

  constructor(props: HeaderProps) {
    super(props);
    this.switchSidebar = this.switchSidebar.bind(this);

    this.state = {
      heightOne: 0,
      heightTwo: 0,
      heightThree: 0,
      heightFour: 0,
      // Keep the server and the first client render identical; sync after mount.
      innerWidth: 1024,
      count: 0,
      isLoggedIn: false,
      notifications: [],
      unreadCount: 0,
      showNotifications: false,
    };
  }

  switchSidebar() {
    if (this.props.sidebarOpened) {
      this.props.dispatch(closeSidebar());
      this.props.dispatch(changeActiveSidebarItem(null));
    } else {
      const paths = this.props.router.pathname.split("/");
      paths.pop();
      this.props.dispatch(openSidebar());
      this.props.dispatch(changeActiveSidebarItem(paths.join("/")));
    }
  }
  
  fetchNotifications = async () => {
    const token = localStorage.getItem("token");

    if (!token || !isAuthenticated()) {
      this.setState({
        notifications: [],
        unreadCount: 0,
      });
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:8080/api/photos/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      this.setState({
        notifications: response.data.notifications ?? [],
        unreadCount: response.data.unreadCount ?? 0,
      });
    } catch (error) {
      console.error("Could not fetch notifications:", error);
    }
  };

  toggleNotifications = () => {
    const willOpen = !this.state.showNotifications;

    this.setState({
      showNotifications: willOpen,
    });

    if (willOpen) {
      void this.fetchNotifications();
    }
  };

  handleNotificationClick = async (
    notification: NotificationItem
  ) => {
    const token = localStorage.getItem("token");

    try {
      if (!notification.isRead && token) {
        await axios.patch(
          `http://localhost:8080/api/photos/notifications/${notification._id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        this.setState((prevState) => ({
          notifications: prevState.notifications.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true }
              : item
          ),
          unreadCount: Math.max(0, prevState.unreadCount - 1),
        }));
      }

      this.setState({ showNotifications: false });

      // Open the photos page
      this.props.router.push("/photos");
    } catch (error) {
      console.error("Could not update notification:", error);
      toast.error("Could not open notification.");
    }
  };

  override componentDidMount() {
    void this.fetchNotifications();

    this.notificationTimer = setInterval(() => {
      void this.fetchNotifications();
    }, 30000);

    this.setState({ innerWidth: window.innerWidth, isLoggedIn: isAuthenticated(), });
    window.addEventListener("resize", this.handleResize);
    if (this.props.currentUser) {
      axios
        .get(`/orders?user=${this.props.currentUser.id}&status=in+cart`)
        .then((res) => {
          this.setState({
            count: res.data.count,
          });
        })
        .catch(() => undefined);
      return;
    } else if (localStorage.getItem("products") && !this.props.currentUser) {
      this.setState({
        count: JSON.parse(localStorage.getItem("products") ?? "[]").length,
      });
    }
  }

  override componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);

    if (this.notificationTimer) {
      clearInterval(this.notificationTimer);
    }
  }

  handleResize = () => this.setState({ innerWidth: window.innerWidth });

  handleProtectedClick = (
  event: React.MouseEvent<HTMLAnchorElement>
) => {
  const token = localStorage.getItem("token");

  if (!token || !isAuthenticated()) {
    event.preventDefault();

    this.setState({ isLoggedIn: false });

    toast.warning("Please login first to access this page.");
    return;
  }

  this.setState({ isLoggedIn: true });
}

  handleLogout = () => {
    logoutUser();
  };

  toggleHeightOne = () => {
    this.setState({
      heightOne: "auto",
      heightTwo: 0,
      heightThree: 0,
      heightFour: 0,
    });
  };

  toggleHeightTwo = () => {
    this.setState({
      heightOne: 0,
      heightTwo: "auto",
      heightThree: 0,
      heightFour: 0,
    });
  };

  toggleHeightThree = () => {
    this.setState({
      heightOne: 0,
      heightTwo: 0,
      heightThree: "auto",
      heightFour: 0,
    });
  };

  toggleHeightFour = () => {
    this.setState({
      heightOne: 0,
      heightTwo: 0,
      heightThree: 0,
      heightFour: "auto",
    });
  };

  override render() {
    const { heightTwo, heightThree, heightFour } = this.state;
    return (
      <Navbar className={s.header}>
        <Container>
        <ToastContainer />
          {this.state.innerWidth <= 768 && (
            <Button
              className={"bg-transparent border-0 p-0"}
              onClick={() => this.switchSidebar()}
            >
              <img src={menuImg} alt={"menu"} />
            </Button>
          )}

          <NavbarBrand>
            <Link href={"/"}>
              <span className={s.logoStyle}>Flatlogic</span>
            </Link>
          </NavbarBrand>

          {this.state.innerWidth >= 768 && (
            <nav className={s.nav}>
              <ul className={s.nav__menu}>
                <li className={s.nav__menuItem} style={{ width: 90 }}>
                  <ActiveLink
                    className={s.navLink}
                    onMouseOver={this.toggleHeightOne}
                    href={"/"}
                  >
                    <span className={s.dropdownItem}>Home</span>
                  </ActiveLink>
                </li>
                <li className={s.nav__menuItem}>
                  <span
                    className={s.dropdownItem}
                    onMouseOver={this.toggleHeightTwo}
                  >
                    Pages <div className={s.dropdownItemImg} />
                  </span>
                  <AnimateHeight
                    duration={500}
                    className={`${s.nav__submenu}`}
                    height={heightTwo}
                  >
                    <UncontrolledDropdown>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/about"}>
                          <a>About Us</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/about-team"}>
                          <a>About Team</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/photo-upload"}>
                          <a>Photo Upload</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/contact"}>
                          <a>Contact Us</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/faq"}>
                          <a>FAQ</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/error"}>
                          <a>404</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/wishlist"}>
                          <a>Wishlist</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/login"}>
                          <a>Login</a>
                        </ActiveLink>
                      </DropdownItem>
                    </UncontrolledDropdown>
                  </AnimateHeight>
                </li>
                <li className={s.nav__menuItem}>
                  <span
                    className={s.dropdownItem}
                    onMouseOver={this.toggleHeightThree}
                  >
                    Shop <div className={s.dropdownItemImg} />
                  </span>
                  <AnimateHeight
                    duration={500}
                    className={`${s.nav__submenu}`}
                    height={heightThree}
                  >
                    <UncontrolledDropdown>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/shop"}>
                          <a>Shop</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/categories"}>
                          <a>Categories</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/account"}>
                          <a>Account</a>
                        </ActiveLink>
                      </DropdownItem>
                    </UncontrolledDropdown>
                  </AnimateHeight>
                </li>
                <li className={s.nav__menuItem}>
                  <span
                    className={s.dropdownItem}
                    onMouseOver={this.toggleHeightFour}
                  >
                    Blog <div className={s.dropdownItemImg} />
                  </span>
                  <AnimateHeight
                    duration={500}
                    className={`${s.nav__submenu}`}
                    height={heightFour}
                  >
                    <UncontrolledDropdown>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/blog"}>
                          <a>Blog</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/blog/article"}>
                          <a>Blog Article</a>
                        </ActiveLink>
                      </DropdownItem>
                    </UncontrolledDropdown>
                  </AnimateHeight>
                </li>
                <li className={s.nav__menuItem}>
                  <span
                    className={s.dropdownItem}
                    onMouseOver={this.toggleHeightFour}
                  >
                    Photo <div className={s.dropdownItemImg} />
                  </span>
                  <AnimateHeight
                    duration={500}
                    className={`${s.nav__submenu}`}
                    height={heightFour}
                  >
                    <UncontrolledDropdown>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/photo-upload"}>
                          <a onClick={this.handleProtectedClick}>Photo Upload</a>
                        </ActiveLink>
                      </DropdownItem>
                      <DropdownItem className={s.dropdownMenuItem}>
                        <ActiveLink href={"/photos"}>
                          <a onClick={this.handleProtectedClick}>Photos</a>
                        </ActiveLink>
                      </DropdownItem>
                    </UncontrolledDropdown>
                  </AnimateHeight>
                </li>
              </ul>
            </nav>
          )}

          <Nav>
            
            <NavItem className={"d-flex align-items-center"}>
              {this.state.innerWidth >= 768 && (
                <>
                  <Link href={"/search"}>
                    <a>
                      <Button className={`bg-transparent border-0 p-3`}>
                        {this.props.router.pathname.includes("search") ? (
                          <div className={s.headerSearchIconActive} />
                        ) : (
                          <div className={s.headerSearchIcon} />
                        )}
                      </Button>
                    </a>
                  </Link>
                 
                  {/* <Link href={"/login"}>
                    <a>
                      <Button className={`bg-transparent border-0 p-3`}>
                        {this.props.router.pathname.includes("account") ? (
                          <div className={s.headerLoginIconActive} />
                        ) : (
                          <div className={s.headerLoginIcon} />
                        )}
                      </Button>
                    </a>
                  </Link> */}
                  <nav className={s.nav}>
                    <ul className={s.nav__menu}>                              
                      <li className={s.nav__menuItem}>
                        <span
                          className={s.dropdownItem}
                          onMouseOver={this.toggleHeightFour}
                        >
                          {this.props.router.pathname.includes("account") ? (
                                <div className={`${s.headerLoginIconActive} mt-3`} />
                              ) : (
                              <div className={`${s.headerLoginIcon} mt-3`} />
                              )}
                        </span>
                        <AnimateHeight
                          duration={500}
                          className={`${s.nav__submenu}`}
                          height={heightFour}
                        >
                          <UncontrolledDropdown>
                            <DropdownItem className={s.dropdownMenuItem}>
                              <ActiveLink href={"/profile"}>
                                <a onClick={this.handleProtectedClick}>Profile</a>
                              </ActiveLink>
                            </DropdownItem>

                            {this.state.isLoggedIn && (
                              <DropdownItem
                                className={s.dropdownMenuItem}
                                onClick={this.handleLogout}
                              >
                                Logout
                              </DropdownItem>
                            )}
                          </UncontrolledDropdown>
                        </AnimateHeight>
                      </li>
                    </ul>
                  </nav>
                </>
              )}
              
              {/* Notification bell */}
              {this.state.isLoggedIn && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginRight: 8,
                  }}
                >
                  <Button
                    className="bg-transparent border-0 p-3"
                    onClick={this.toggleNotifications}
                    aria-label="Notifications"
                    style={{ position: "relative" }}
                  >
                    <span style={{ fontSize: 13 }}>🔔</span>

                    {this.state.unreadCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "#dc3545",
                          color: "#fff",
                          borderRadius: "50%",
                          minWidth: 18,
                          height: 18,
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 4px",
                        }}
                      >
                        {this.state.unreadCount > 99
                          ? "99+"
                          : this.state.unreadCount}
                      </span>
                    )}
                  </Button>

                  {this.state.showNotifications && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        width: 320,
                        maxWidth: "85vw",
                        maxHeight: 350,
                        overflowY: "auto",
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 2000,
                        color: "#222",
                      }}
                    >
                      <div
                        style={{
                          padding: 12,
                          fontWeight: "bold",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        Notifications
                        <span style={{ float: "right", color: "#dc3545" }}>
                          {this.state.unreadCount} unread
                        </span>
                      </div>

                      {this.state.notifications.length === 0 ? (
                        <p style={{ padding: 16, margin: 0 }}>
                          No notifications yet.
                        </p>
                      ) : (
                        this.state.notifications.map((notification) => {
                          const senderName =
                            typeof notification.sender === "object"
                              ? notification.sender?.name || "User"
                              : "User";

                          return (
                            <button
                              key={notification._id}
                              type="button"
                              onClick={() =>
                                void this.handleNotificationClick(notification)
                              }
                              style={{
                                display: "block",
                                width: "100%",
                                padding: 12,
                                textAlign: "left",
                                border: "none",
                                borderBottom: "1px solid #eee",
                                backgroundColor: notification.isRead
                                  ? "#fff"
                                  : "#eef5ff",
                                cursor: "pointer",
                                color: "#222",
                              }}
                            >
                              <div>
                                <strong>{senderName}</strong>{" "}
                                liked your photo
                                {!notification.isRead && (
                                  <span
                                    style={{
                                      color: "#0d6efd",
                                      fontSize: 12,
                                      marginLeft: 5,
                                    }}
                                  >
                                    • Unread
                                  </span>
                                )}
                              </div>

                              <small style={{ color: "#777" }}>
                                {new Date(
                                  notification.createdAt
                                ).toLocaleString()}
                              </small>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
              <Link href={"/cart"}>
                <a>
                  {this.state.count ? (
                    <p
                      style={{ fontSize: 9, marginTop: 10, marginLeft: 30 }}
                      className={`mb-0 text-dark fw-bold`}
                    >
                      {this.state.count}
                    </p>
                  ) : null}
                  <Button
                    className={`${s.headerSvgIcon} bg-transparent border-0 p-3`}
                    style={{ marginTop: this.state.count ? -22 : 0 }}
                  >
                    {this.props.router.pathname.includes("cart") ? (
                      <div className={s.headerCartIconActive} />
                    ) : (
                      <div className={s.headerCartIcon} />
                    )}
                  </Button>
                </a>
              </Link>
            </NavItem>
          </Nav>
        </Container>
      </Navbar>
    );
  }
}

function mapStateToProps(store: RootState) {
  return {
    sidebarOpened: store.navigation.sidebarOpened,
    currentUser: store.auth.currentUser,
  };
}

const ConnectedHeader = connect(mapStateToProps)(Header);

export default function HeaderWithRouter() {
  return <ConnectedHeader router={useRouter()} />;
}
