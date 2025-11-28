export interface MenuItem {
  id?: string;
  path: string | null;
  label: string;
  icon: string;
  name: string;
  parentId?: string | null;
  orderIndex?: number;
  children?: MenuItem[];
}

export interface APIMenu {
  id: string;
  path: string;
  display_name: string;
  icon?: string;
  name: string;
  parent_id?: string | null;
  order_index?: number;
}
