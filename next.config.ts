import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.130"],
  env: {
    // Always fixed at build time ("1" or ""), so the build can drop the test-only Case 99
    // code completely when the flag is off. An unset NEXT_PUBLIC_ variable would instead
    // be left as a runtime lookup, and the code it guards would ship.
    NEXT_PUBLIC_ENABLE_TEST_CASE: process.env.NEXT_PUBLIC_ENABLE_TEST_CASE === "1" ? "1" : "",
    // Same for Case 3 while it is in testing. Remove this line when Case 3 launches.
    NEXT_PUBLIC_ENABLE_CASE3: process.env.NEXT_PUBLIC_ENABLE_CASE3 === "1" ? "1" : "",
  },
};

export default nextConfig;
