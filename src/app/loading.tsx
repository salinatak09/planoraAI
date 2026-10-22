export default function Loading() {
  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
