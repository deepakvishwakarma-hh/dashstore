import Breadcrumb from "@/components/Breadcrumb";
import CreateProductForm from "@/components/CreateProductForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Create Product - Dashboard",
  description: "Create a new product",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Create Product" />

        {/* CreateProductForm */}
        <CreateProductForm />
      </MasterLayout>
    </>
  );
};

export default Page;
