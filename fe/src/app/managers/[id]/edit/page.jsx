import Breadcrumb from "@/components/Breadcrumb";
import EditManagerForm from "@/components/EditManagerForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Edit Manager - Dashboard",
  description: "Edit manager details",
};

const Page = ({ params }) => {
  const managerId = params.id;

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Edit Manager" />

        {/* EditManagerForm */}
        <EditManagerForm managerId={managerId} />
      </MasterLayout>
    </>
  );
};

export default Page;
