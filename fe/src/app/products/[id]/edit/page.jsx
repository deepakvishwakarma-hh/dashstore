import Breadcrumb from "@/components/Breadcrumb";
import EditProductForm from "@/components/EditProductForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Edit Product - Dashboard",
  description: "Edit product details",
};

const Page = ({ params }) => {
  const productId = params.id;

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Edit Product" />

        {/* EditProductForm */}
        <EditProductForm productId={productId} />
      </MasterLayout>
    </>
  );
};

export default Page;
