import Breadcrumb from "@/components/Breadcrumb";
import ManagersLayer from "@/components/ManagersLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Managers - Dashboard",
  description: "View and manage managers from Strapi",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Managers" />

        {/* ManagersLayer */}
        <ManagersLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
