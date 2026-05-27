export function AdPlaceholder({
  type = "rectangle",
}: {
  type?: "leaderboard" | "rectangle" | "mobile-banner" | "sticky-sidebar";
}) {
  const dimensions = {
    leaderboard: "w-full max-w-[728px] h-[90px]",
    rectangle: "w-[300px] h-[250px]",
    "mobile-banner": "w-full max-w-[320px] h-[50px]",
    "sticky-sidebar": "w-[300px] h-[600px]",
  };

  return (
    <div
      className={`${dimensions[type]} mx-auto bg-white border border-border/50 border-dashed rounded-lg flex items-center justify-center`}
    >
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Ad Space ({type})
      </span>
    </div>
  );
}
