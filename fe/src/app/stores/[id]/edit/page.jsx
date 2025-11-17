import Breadcrumb from "@/components/Breadcrumb";
import EditStoreForm from "@/components/EditStoreForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Edit Store - Dashboard",
  description: "Edit store details",
};

const Page = ({ params }) => {
  const storeId = decodeURIComponent(params.id);

  return (
    <MasterLayout>
      <Breadcrumb title="Edit Store" />
      <EditStoreForm storeId={storeId} />
    </MasterLayout>
  );
};

export default Page;
