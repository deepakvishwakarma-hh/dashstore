"use client";
import Link from "next/link";
import { useSession } from "@/hook/useSession";
import { Icon } from "@iconify/react/dist/iconify.js";

const UserDropdown = () => {
  const { user, isLoading, logout } = useSession();

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
  };

  // Show loading state or placeholder while session is loading
  if (isLoading) {
    return (
      <div className="dropdown">
        <button
          className="d-flex justify-content-center align-items-center rounded-circle bg-secondary text-white fw-semibold"
          type="button"
          data-bs-toggle="dropdown"
          disabled
          style={{
            width: "40px",
            height: "40px",
            fontSize: "16px",
            border: "none",
          }}
        >
          ...
        </button>
        <div className="dropdown-menu to-top dropdown-menu-sm">
          <div className="py-12 px-16 radius-8 bg-primary-50 mb-16">
            <div className="text-center">
              <span className="text-secondary-light">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get user display name and type
  const displayName = user?.name || user?.username || "User";
  const userType = user?.type || "User";

  // Capitalize first letter of user type
  const displayType = userType.charAt(0).toUpperCase() + userType.slice(1);

  // Get first letter of name for avatar
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="dropdown">
      <button
        className="d-flex justify-content-center align-items-center rounded-circle bg-primary-600 text-white fw-semibold"
        type="button"
        data-bs-toggle="dropdown"
        style={{
          width: "40px",
          height: "40px",
          fontSize: "16px",
          border: "none",
        }}
      >
        {firstLetter}
      </button>
      <div className="dropdown-menu to-top dropdown-menu-sm">
        <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
          <div>
            <h6 className="text-lg text-primary-light fw-semibold mb-2">
              {displayName}
            </h6>
            <span className="text-secondary-light fw-medium text-sm">
              {displayType}
            </span>
          </div>
          <button type="button" className="hover-text-danger">
            <Icon icon="radix-icons:cross-1" className="icon text-xl" />
          </button>
        </div>
        <ul className="to-top-list">
          {/* <li>
            <Link
              className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
              href="/view-profile"
            >
              <Icon icon="solar:user-linear" className="icon text-xl" /> My
              Profile
            </Link>
          </li>
          <li>
            <Link
              className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
              href="/email"
            >
              <Icon icon="tabler:message-check" className="icon text-xl" />{" "}
              Inbox
            </Link>
          </li>
          <li>
            <Link
              className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
              href="/company"
            >
              <Icon
                icon="icon-park-outline:setting-two"
                className="icon text-xl"
              />
              Setting
            </Link>
          </li> */}
          <li>
            <button
              onClick={handleLogout}
              className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3 w-100 border-0 bg-transparent"
              style={{ textAlign: "left" }}
            >
              <Icon icon="lucide:power" className="icon text-xl" /> Log Out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UserDropdown;
