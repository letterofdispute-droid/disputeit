import { SubcategoryInfo } from '@/data/subcategoryMappings';
import { cn } from '@/lib/utils';

interface SubcategoryFilterProps {
  subcategories: SubcategoryInfo[];
  activeSubcategory: string | null;
  onSubcategoryChange: (slug: string | null) => void;
  templateCounts: Record<string, number>;
}

const SubcategoryFilter = ({ 
  subcategories, 
  activeSubcategory, 
  onSubcategoryChange,
  templateCounts 
}: SubcategoryFilterProps) => {
  if (subcategories.length === 0) return null;

  const totalCount = Object.values(templateCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap gap-2">
      {/* All chip */}
      <button
        onClick={() => onSubcategoryChange(null)}
        className={cn(
          'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          activeSubcategory === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        )}
      >
        All
      </button>

      {/* Subcategory chips */}
      {subcategories.map((sub) => {
        const count = templateCounts[sub.slug] || 0;
        if (count === 0) return null;
        
        return (
          <button
            key={sub.slug}
            onClick={() => onSubcategoryChange(sub.slug)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeSubcategory === sub.slug
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {sub.name}
          </button>
        );
      })}
    </div>
  );
};

export default SubcategoryFilter;
