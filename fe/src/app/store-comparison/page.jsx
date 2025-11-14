import StoreComparison from "@/components/StoreComparison";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Breadcrumb } from "react-bootstrap";

export const metadata = {
  title: "Store Comparison - Dashboard",
  description: "Compare performance across different stores",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Store Comparison" />

        {/* StoreComparison */}
        <StoreComparison />
      </MasterLayout>
    </>
  );
};

export default Page;
