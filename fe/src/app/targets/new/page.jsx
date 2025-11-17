import Breadcrumb from "@/components/Breadcrumb";
import CreateTargetForm from "@/components/CreateTargetForm";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Create Target - Dashboard",
  description: "Create a new performance target",
};

const Page = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Create Target" />
      <CreateTargetForm />
    </MasterLayout>
  );
};

export default Page;
