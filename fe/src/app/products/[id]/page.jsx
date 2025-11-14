import Breadcrumb from "@/components/Breadcrumb";
import ProductViewLayer from "@/components/ProductViewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "View Product - Dashboard",
  description: "View product details",
};

const Page = ({ params }) => {
  const productId = params.id;

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="View Product" />

        {/* ProductViewLayer */}
        <ProductViewLayer productId={productId} />
      </MasterLayout>
    </>
  );
};

export default Page;
