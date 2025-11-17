import Breadcrumb from "@/components/Breadcrumb";
import StoreViewLayer from "@/components/StoreViewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "View Store - Dashboard",
  description: "View store details",
};

const Page = ({ params }) => {
  const storeId = decodeURIComponent(params.id);

  return (
    <MasterLayout>
      <Breadcrumb title="View Store" />
      <StoreViewLayer storeId={storeId} />
    </MasterLayout>
  );
};

export default Page;
