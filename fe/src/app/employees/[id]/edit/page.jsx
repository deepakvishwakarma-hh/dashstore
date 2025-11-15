import Breadcrumb from "@/components/Breadcrumb";
import EditEmployeeForm from "@/components/EditEmployeeForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Edit Employee - Dashboard",
  description: "Edit employee details",
};

const Page = ({ params }) => {
  const employeeId = params.id;

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Edit Employee" />

        {/* EditEmployeeForm */}
        <EditEmployeeForm employeeId={employeeId} />
      </MasterLayout>
    </>
  );
};

export default Page;
