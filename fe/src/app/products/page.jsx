import Breadcrumb from "@/components/Breadcrumb";
import ProductsLayer from "@/components/ProductsLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Products - Dashboard",
  description: "View and manage products from Strapi",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Products" />

        {/* ProductsLayer */}
        <ProductsLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
