// src/utils/groupByCategory.ts
type Item = {
  category: string;
  [key: string]: any;
};

const groupByCategory = (items: Item[]) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, Item[]>);
};

export default groupByCategory;
