import { CategoriesView } from "@/components/views/categories-view";

export const metadata = { title: "Catégories" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <CategoriesView />;
}
