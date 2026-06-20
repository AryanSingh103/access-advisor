export default function ScanLoading() {
  return (
    <div className="min-h-screen bg-[#F8F8FB] animate-pulse">
      <div className="h-12 bg-white border-b border-gray-100" />
      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="h-7 w-36 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-80 bg-gray-200 rounded mb-8" />
        <div className="flex gap-3 mb-8">
          <div className="flex-1 h-12 bg-white rounded-xl border border-gray-100" />
          <div className="w-24 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
