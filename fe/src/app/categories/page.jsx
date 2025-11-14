import Breadcrumb from "@/components/Breadcrumb";
import CategoriesLayer from "@/components/CategoriesLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Categories - Dashboard",
  description: "View and manage categories",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Categories" />

        {/* CategoriesLayer */}
        <CategoriesLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
