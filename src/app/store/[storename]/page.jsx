import StoreDashboard from "@/components/StoreDashboard";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Breadcrumb } from "react-bootstrap";

export const metadata = {
  title: "Store Dashboard - Dashboard",
  description: "Store-specific dashboard view",
};

const Page = async ({ params }) => {
  const storeName = decodeURIComponent(params.storename);

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={`Store: ${storeName}`} />

        {/* StoreDashboard */}
        <StoreDashboard storeName={storeName} />
      </MasterLayout>
    </>
  );
};

export default Page;
