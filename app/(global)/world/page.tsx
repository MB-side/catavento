import { Forward } from "@/components/layout/Forward";
import { visitingPath } from "@/lib/visiting";

// "Flying elsewhere" became Destinations (D93). The old address forwards there.
export default function OldWorldPage() {
  return <Forward to={`${visitingPath()}/`} />;
}
