import { Construction } from "lucide-react";

interface UnderConstructionPageProps {
  pageName: string;
}

export default function UnderConstructionPage({ pageName }: UnderConstructionPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light">
        <Construction size={40} strokeWidth={1.8} className="text-primary" />
      </div>
      <h2 className="m-0 font-alexandria text-2xl font-medium text-text-primary">
        {pageName}
      </h2>
      <p className="m-0 text-center font-inter text-sm text-text-secondary">
        Esta sección se encuentra en construcción.
        <br />
        Pronto estará disponible.
      </p>
      <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-primary-light">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}
