import Breadcrumb from "@/components/Breadcrumb";
import EditCategoryForm from "@/components/EditCategoryForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Edit Category - Dashboard",
  description: "Edit category details",
};

const Page = ({ params }) => {
  const categoryId = params.id;

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Edit Category" />

        {/* EditCategoryForm */}
        <EditCategoryForm categoryId={categoryId} />
      </MasterLayout>
    </>
  );
};

export default Page;
