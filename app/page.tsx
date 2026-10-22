import { redirect } from "next/navigation";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";

// Signed-out visitors are sent on to /login by the proxy.
export default function HomePage() {
  redirect(DEFAULT_AUTHENTICATED_PATH);
}
