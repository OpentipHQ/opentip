import { Loader } from "@/components/motion/loader";

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader variant="spinner" size={24} />
    </div>
  );
}
