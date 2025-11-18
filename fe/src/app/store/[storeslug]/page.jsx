import StoreDashboard from "@/components/StoreDashboard";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Breadcrumb } from "react-bootstrap";

export const metadata = {
  title: "Store Dashboard - Dashboard",
  description: "Store-specific dashboard view",
};

const Page = async ({ params }) => {
  const storeSlug = decodeURIComponent(params.storeslug);

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={`Store Dashboard`} />

        {/* StoreDashboard */}
        <StoreDashboard storeSlug={storeSlug} />
      </MasterLayout>
    </>
  );
};

export default Page;
