import { Gamepad2, Layers, TrendingUp, Trophy } from "lucide-react";
import { ConditionDonutChart } from "@/components/dashboard/ConditionDonutChart";
import { GenrePieChart } from "@/components/dashboard/GenrePieChart";
import { PlatformBarChart } from "@/components/dashboard/PlatformBarChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { Top5ConsolesChart } from "@/components/dashboard/Top5ConsolesChart";
import { getDashboardStats } from "@/lib/dashboard";

export default async function Home() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Dashboard unavailable
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading your collection. Try refreshing the page.
        </p>
      </div>
    );
  }

  const isEmpty = stats.totalGames === 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Collection overview and statistics
        </p>
      </div>

      {isEmpty && (
        <p className="text-sm text-muted-foreground">
          No games in your collection yet. Add one from the Admin area to see
          stats here.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Games"
          value={stats.totalGames.toString()}
          icon={Gamepad2}
        />
        <StatCard
          label="Completed"
          value={stats.completedGames.toString()}
          subtext={`${stats.completedPercent}% of total`}
          icon={Trophy}
        />
        <StatCard
          label="Now Playing"
          value={stats.nowPlayingGames.toString()}
          icon={TrendingUp}
        />
        <StatCard
          label="Brands / Consoles"
          value={`${stats.totalBrands} / ${stats.totalConsoles}`}
          icon={Layers}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GenrePieChart data={stats.genreBreakdown} />
        <PlatformBarChart data={stats.platformBreakdown} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConditionDonutChart data={stats.conditionBreakdown} />
        <Top5ConsolesChart data={stats.top5Consoles} />
      </div>
    </div>
  );
}
