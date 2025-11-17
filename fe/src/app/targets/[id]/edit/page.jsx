import Breadcrumb from "@/components/Breadcrumb";
import EditTargetForm from "@/components/EditTargetForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Edit Target - Dashboard",
  description: "Edit target details",
};

const Page = ({ params }) => {
  const targetId = decodeURIComponent(params.id);

  return (
    <MasterLayout>
      <Breadcrumb title="Edit Target" />
      <EditTargetForm targetId={targetId} />
    </MasterLayout>
  );
};

export default Page;
