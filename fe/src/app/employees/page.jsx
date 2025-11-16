import Breadcrumb from "@/components/Breadcrumb";
import EmployeesLayer from "@/components/EmployeesLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Employees - Dashboard",
  description: "View and manage employees from Strapi",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Employees" />
        {/* EmployeesLayer */}
        <EmployeesLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
