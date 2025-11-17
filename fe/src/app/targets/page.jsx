import Breadcrumb from "@/components/Breadcrumb";
import TargetsLayer from "@/components/TargetsLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Targets - Dashboard",
  description: "View and manage performance targets",
};

const Page = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Targets" />
      <TargetsLayer />
    </MasterLayout>
  );
};

export default Page;
