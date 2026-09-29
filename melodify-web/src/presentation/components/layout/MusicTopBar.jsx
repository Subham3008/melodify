"use client";

import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/presentation/stores/auth.store";

export default function MusicTopBar() {
  const [profileOpen, setProfileOpen] = useState(false);

  const dropdownRef = useRef(null);

  const user = useAuthStore((state) => state.user);

  const logout = useAuthStore((state) => state.logout);

  /*
  |--------------------------------------------------------------------------
  | User profile image
  |--------------------------------------------------------------------------
  |
  | Different auth providers / backend schemas may use different property
  | names. Whichever exists first will be used.
  |
  */

  const profileImage =
    user?.avatarUrl ||
    user?.avatar ||
    user?.profilePicture ||
    user?.picture ||
    user?.image ||
    null;

  /*
  |--------------------------------------------------------------------------
  | Fallback initial
  |--------------------------------------------------------------------------
  |
  | Rohit Pokhariya
  | ↓
  | R
  |
  */

  const initial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  /*
  |--------------------------------------------------------------------------
  | Close dropdown when clicking outside
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Close dropdown with Escape
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setProfileOpen(false);

    await logout();
  };

  return (
    <header
      className="
        sticky
        top-0
        z-40
        flex
        h-20
        items-center
        justify-between
        border-b
        border-neutral-800
        bg-[#121212]/95
        px-6
        backdrop-blur
      "
    >
      {/* LEFT */}

      <div>
        <p
          className="
            text-xs
            font-medium
            text-neutral-500
          "
        >
          Welcome back
        </p>

        <h2
          className="
            mt-1
            text-base
            font-bold
            text-white
          "
        >
          {user.name}
        </h2>
      </div>

      {/* PROFILE */}

      <div
        ref={dropdownRef}
        className="
          relative
        "
      >
        {/* PROFILE BUTTON */}

        <button
          type="button"
          onClick={() => setProfileOpen((current) => !current)}
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            overflow-hidden
            rounded-full
            bg-[#282828]
            font-bold
            text-white
            ring-2
            ring-transparent
            transition
            hover:scale-105
            hover:ring-neutral-600
            focus:outline-none
            focus:ring-neutral-500
          "
          aria-label="Open profile menu"
          aria-expanded={profileOpen}
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={user.name || "Profile"}
              className="
                h-full
                w-full
                object-cover
              "
              onError={(event) => {
                event.currentTarget.style.display = "none";

                event.currentTarget.nextElementSibling?.classList.remove(
                  "hidden",
                );
              }}
            />
          ) : null}

          <span
            className={`
              flex
              h-full
              w-full
              items-center
              justify-center
              bg-[#1ed760]
              text-base
              font-black
              text-black

              ${profileImage ? "hidden" : ""}
            `}
          >
            {initial}
          </span>
        </button>

        {/* DROPDOWN */}

        {profileOpen && (
          <div
            className="
              absolute
              top-[calc(100%+10px)]
              right-0
              z-50
              w-70
              overflow-hidden
              rounded-xl
              border
              border-neutral-700
              bg-[#282828]
              shadow-2xl
            "
          >
            {/* USER DETAILS */}

            <div
              className="
                flex
                items-center
                gap-3
                px-4
                py-4
              "
            >
              {/* SMALL AVATAR */}

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  bg-[#1ed760]
                  font-black
                  text-black
                "
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={user.name || "Profile"}
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                    onError={(event) => {
                      event.currentTarget.style.display = "none";

                      event.currentTarget.nextElementSibling?.classList.remove(
                        "hidden",
                      );
                    }}
                  />
                ) : null}

                <span className={profileImage ? "hidden" : ""}>{initial}</span>
              </div>

              {/* NAME + EMAIL */}

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    truncate
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  {user.name || "User"}
                </p>

                <p
                  className="
                    mt-1
                    truncate
                    text-xs
                    text-neutral-400
                  "
                >
                  {user.email}
                </p>
              </div>
            </div>

            {/* SEPARATOR */}

            <div
              className="
                mx-3
                border-t
                border-neutral-700
              "
            />

            {/* LOGOUT */}

            <div className="p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex
                  w-full
                  items-center
                  rounded-lg
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#3e3e3e]
                "
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
