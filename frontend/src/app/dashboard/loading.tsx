export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8F8FB] flex flex-col animate-pulse">
      <div className="h-12 bg-white border-b border-gray-100" />
      <div className="flex flex-1">
        <div className="w-[200px] bg-white border-r border-gray-100" />
        <main className="flex-1 px-8 py-6">
          <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 h-20" />
            ))}
          </div>
          <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl h-16 border border-gray-100" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
