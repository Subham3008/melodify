"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function TrackSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";

  const [value, setValue] = useState(urlSearch);

  /*
  |--------------------------------------------------------------------------
  | Prevent initial empty input from redirecting
  |--------------------------------------------------------------------------
  */

  const userTypedRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Sync input with URL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setValue(urlSearch);
  }, [urlSearch]);

  /*
  |--------------------------------------------------------------------------
  | Navigate to search results
  |--------------------------------------------------------------------------
  */

  const navigateToSearch = (searchValue) => {
    const query = searchValue.trim();

    const target = query ? `/?search=${encodeURIComponent(query)}` : "/";

    /*
    |--------------------------------------------------------------------------
    | Already on same search
    |--------------------------------------------------------------------------
    */

    if (pathname === "/" && query === urlSearch.trim()) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Same page → replace
    | Other page → push to Home
    |--------------------------------------------------------------------------
    */

    if (pathname === "/") {
      router.replace(target, {
        scroll: false,
      });

      return;
    }

    router.push(target);
  };

  /*
  |--------------------------------------------------------------------------
  | Debounced search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!userTypedRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      navigateToSearch(value);

      userTypedRef.current = false;
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  /*
  |--------------------------------------------------------------------------
  | Input
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    userTypedRef.current = true;

    setValue(event.target.value);
  };

  /*
  |--------------------------------------------------------------------------
  | Enter search
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (event) => {
    event.preventDefault();

    userTypedRef.current = false;

    navigateToSearch(value, true);
  };

  /*
  |--------------------------------------------------------------------------
  | Clear
  |--------------------------------------------------------------------------
  */

  const handleClear = () => {
    userTypedRef.current = false;

    setValue("");

    /*
    |--------------------------------------------------------------------------
    | Clear search → Home catalog
    |--------------------------------------------------------------------------
    */

    if (pathname === "/") {
      router.replace("/", {
        scroll: false,
      });
    } else {
      router.push("/");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        relative
        w-full
        max-w-xl
      "
    >
      {/* SEARCH ICON */}

      <span
        className="
          pointer-events-none
          absolute
          top-1/2
          left-4
          -translate-y-1/2
          text-sm
          text-neutral-400
        "
      >
        🔍
      </span>

      {/* INPUT */}

      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search songs, artists or albums"
        className="
          h-11
          w-full
          rounded-full
          border
          border-neutral-700
          bg-[#242424]
          pr-11
          pl-11
          text-sm
          text-white
          outline-none
          transition

          placeholder:text-neutral-500

          hover:border-neutral-500

          focus:border-white
          focus:bg-[#2a2a2a]
        "
      />

      {/* CLEAR */}

      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="
            absolute
            top-1/2
            right-4
            -translate-y-1/2
            text-lg
            text-neutral-400
            transition
            hover:text-white
          "
        >
          ×
        </button>
      )}
    </form>
  );
}
