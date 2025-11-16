import Breadcrumb from "@/components/Breadcrumb";
import SheetUploadLayer from "@/components/SheetUploadLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Sheet Upload - Dashboard",
  description: "Upload and process Excel/CSV sheets",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Sheet Upload" />

        {/* SheetUploadLayer */}
        <SheetUploadLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
