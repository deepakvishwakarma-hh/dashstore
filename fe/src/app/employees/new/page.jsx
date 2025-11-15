import Breadcrumb from "@/components/Breadcrumb";
import CreateEmployeeForm from "@/components/CreateEmployeeForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Create Employee - Dashboard",
  description: "Create a new employee",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Create Employee" />

        {/* CreateEmployeeForm */}
        <CreateEmployeeForm />
      </MasterLayout>
    </>
  );
};

export default Page;
