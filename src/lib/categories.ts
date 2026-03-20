import { CatItem } from "./api";

/** 将扁平分类列表组织为树状结构 */
export interface MainCategory {
  id: string;
  name: string;
  sub: { id: string; name: string }[];
}

export function buildCategoryTree(cats: CatItem[]): MainCategory[] {
  const roots = cats.filter(c => c.type_pid === 0);
  return roots.map(root => ({
    id: String(root.type_id),
    name: root.type_name,
    sub: cats
      .filter(c => c.type_pid === root.type_id)
      .map(c => ({ id: String(c.type_id), name: c.type_name })),
  }));
}

/** 获取某个分类 ID 对应的名称和父分类 */
export function findCatById(cats: CatItem[], id: string) {
  const item = cats.find(c => String(c.type_id) === id);
  if (!item) return null;
  const parent = item.type_pid !== 0
    ? cats.find(c => c.type_id === item.type_pid)
    : null;
  return { item, parent };
}

export function getCategoryTitle(cats: CatItem[], id?: string): string {
  if (!id) return '最近更新';
  const found = findCatById(cats, id);
  if (!found) return '最近更新';
  const { item, parent } = found;
  return parent ? `${parent.type_name} · ${item.type_name}` : item.type_name;
}
