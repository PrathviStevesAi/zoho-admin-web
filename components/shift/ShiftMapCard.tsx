import { DynamicShiftMap } from "@/components/map/DynamicShiftMap";
import { Shift } from "./types";

interface ShiftMapCardProps {
  shift: Shift | null;
  trackingPath: [number, number][];
  mapCenter: [number, number] | undefined;
}

export function ShiftMapCard({
  shift,
  trackingPath,
  mapCenter,
}: ShiftMapCardProps) {
  const shiftLocation =
    shift?.shipping_location?.latitude !== undefined && shift?.shipping_location?.longitude !== undefined
      ? ([Number(shift.shipping_location.latitude), Number(shift.shipping_location.longitude)] as [number, number])
      : mapCenter;

  return (
    <DynamicShiftMap
      center={trackingPath.length > 0 ? trackingPath[trackingPath.length - 1] : mapCenter}
      checkpoints={trackingPath}
      shiftLocation={shiftLocation}
    />
  );
}
