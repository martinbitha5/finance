import { MoreView } from "@/components/views/more-view";

export const metadata = { title: "Plus" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <MoreView />;
}
