import Breadcrumb from "@/components/Breadcrumb";
import CreateManagerForm from "@/components/CreateManagerForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Create Manager - Dashboard",
  description: "Create a new manager",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Create Manager" />

        {/* CreateManagerForm */}
        <CreateManagerForm />
      </MasterLayout>
    </>
  );
};

export default Page;
