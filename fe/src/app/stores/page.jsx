import Breadcrumb from "@/components/Breadcrumb";
import StoresLayer from "@/components/StoresLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Stores - Dashboard",
  description: "View and manage stores",
};

const Page = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Stores" />
      <StoresLayer />
    </MasterLayout>
  );
};

export default Page;
