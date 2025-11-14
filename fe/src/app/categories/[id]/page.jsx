import Breadcrumb from "@/components/Breadcrumb";
import CategoryViewLayer from "@/components/CategoryViewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "View Category - Dashboard",
  description: "View category details",
};

const Page = ({ params }) => {
  const categoryId = params.id;

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="View Category" />

        {/* CategoryViewLayer */}
        <CategoryViewLayer categoryId={categoryId} />
      </MasterLayout>
    </>
  );
};

export default Page;
