import type { Metadata } from "next";
import { AttemptMapView } from "./attempt-map-view";

export const metadata: Metadata = { title: "Attempt map" };

export default function Page() {
  return <AttemptMapView />;
}
