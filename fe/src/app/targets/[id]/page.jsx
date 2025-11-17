import Breadcrumb from "@/components/Breadcrumb";
import TargetViewLayer from "@/components/TargetViewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "View Target - Dashboard",
  description: "View target details",
};

const Page = ({ params }) => {
  const targetId = decodeURIComponent(params.id);

  return (
    <MasterLayout>
      <Breadcrumb title="View Target" />
      <TargetViewLayer targetId={targetId} />
    </MasterLayout>
  );
};

export default Page;
