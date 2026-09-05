import { useAuth } from "../../../hooks/useAuth";

export const DashboardHero = () => {
  const { currentUser } = useAuth();
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary font-display">
        Welcome back, {currentUser?.name?.split(" ")[0] || "User"} 👋
      </h1>
      <p className="text-sm font-medium text-secondary">
        {todayDate} — Here is what's happening at your workshop today.
      </p>
    </div>
  );
};
