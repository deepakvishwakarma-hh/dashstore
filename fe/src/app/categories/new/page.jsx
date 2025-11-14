import Breadcrumb from "@/components/Breadcrumb";
import CreateCategoryForm from "@/components/CreateCategoryForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Create Category - Dashboard",
  description: "Create a new category",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Create Category" />

        {/* CreateCategoryForm */}
        <CreateCategoryForm />
      </MasterLayout>
    </>
  );
};

export default Page;
