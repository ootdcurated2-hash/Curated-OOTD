import OutfitCard, { Outfit } from "./OutfitCard";

interface OutfitGridProps {
  outfits?: Outfit[];
  isLoggedIn?: boolean;
  onSelectTag?: (tag: string) => void;
}

export default function OutfitGrid({ outfits = [], isLoggedIn = false, onSelectTag }: OutfitGridProps) {
  if (outfits.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center bg-white/40 backdrop-blur-sm">
        <p className="text-muted-foreground font-semibold">Belum ada outfit yang di-curate.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {outfits.map((outfit) => (
        <OutfitCard
          key={outfit.id}
          outfit={outfit}
          isLoggedIn={isLoggedIn}
          onSelectTag={onSelectTag}
        />
      ))}
    </div>
  );
}
