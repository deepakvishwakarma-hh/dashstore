import Breadcrumb from "@/components/Breadcrumb";
import CreateStoreForm from "@/components/CreateStoreForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Create Store - Dashboard",
  description: "Create a new store",
};

const Page = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Create Store" />
      <CreateStoreForm />
    </MasterLayout>
  );
};

export default Page;
