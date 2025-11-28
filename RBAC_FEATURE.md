# ✅ Role-Based Access Control (RBAC) Feature

## 🎯 Overview

Sistem RBAC lengkap telah ditambahkan dengan:
- **Role Management** untuk admin/superadmin
- **Menu Management** untuk konfigurasi navigasi dinamis
- **Permission Management** terintegrasi dengan role
- **Dynamic Navigation** berdasarkan role dan API response

## 📦 Fitur yang Ditambahkan

### 1. **Roles Management** (`/roles`)

Hanya terlihat untuk **admin** dan **superadmin**.

#### Role List Page
- View semua roles (system & custom)
- Indikator untuk system roles (tidak bisa dihapus)
- Search functionality
- Create, Edit, Delete roles

#### Role Form Page (3 Tabs)
1. **Basic Information**
   - Role name (e.g., `vendor_manager`)
   - Display name (e.g., "Vendor Manager")
   - Description

2. **Permissions** 
   - Checkbox list semua permissions
   - Grouped by resource (events, vendors, users, dll)
   - Multi-select permissions
   - Count selected permissions di tab

3. **Menus**
   - Checkbox list semua menu items
   - Assign menus yang bisa diakses role
   - Count selected menus di tab

### 2. **Menus Management** (`/menus`)

Hanya terlihat untuk **admin** dan **superadmin**.

#### Menu List Page
- View semua menu items
- Sort by order_index
- Toggle active/inactive status
- Create, Edit, Delete menus

#### Menu Form Page
- Menu name (technical name)
- Display name (shown in UI)
- URL path
- Icon name (Lucide React icons)
- Order index (untuk sorting)
- Active status
- Description

### 3. **Dynamic Navigation**

Sidebar navigation sekarang **dynamic**:

**Default Behavior (Jika API tidak return menus):**
```
Dashboard
Events
Vendors
Payments
Evaluations
Users
```

**Role-Based Behavior:**
- User role `user`: Hanya melihat menus yang di-assign ke role mereka
- User role `admin/superadmin`: Melihat menus + tambahan:
  - ⚙️ **Roles** (management)
  - 📋 **Menus** (management)

**Menus dari API:**
Jika backend return user menus, sidebar akan render menus tersebut:
- Filtered by `is_active = true`
- Sorted by `order_index`
- Icon dari field `menu.icon`
- URL dari field `menu.url`

### 4. **Updated AuthContext**

Context sekarang menyediakan:

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  userMenus: Menu[];  // ✨ NEW!
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;  // ✨ NEW!
  hasPermission: (permission: string) => boolean;  // ✨ NEW!
}
```

**Helper Functions:**
```typescript
// Check if user has specific role(s)
hasRole(['admin', 'superadmin'])

// Check if user has specific permission
hasPermission('events:create')
```

**User Menus:**
- Fetched saat login dari endpoint `/api/user/menus`
- Stored di localStorage
- Auto-loaded on app init

## 🔄 API Integration

### New API Endpoints Used:

#### Roles API (`src/api/roles.ts`)
```typescript
rolesApi.getAll()                           // GET /api/roles
rolesApi.getById(id)                        // GET /api/role/:id
rolesApi.create(data)                       // POST /api/role
rolesApi.update(id, data)                   // PUT /api/role/:id
rolesApi.delete(id)                         // DELETE /api/role/:id
rolesApi.getPermissions(roleId)             // GET /api/role/:id/permissions
rolesApi.assignPermissions(roleId, permIds) // POST /api/role/:id/permissions
rolesApi.getMenus(roleId)                   // GET /api/role/:id/menus
rolesApi.assignMenus(roleId, menuIds)       // POST /api/role/:id/menus
```

#### Menus API (`src/api/menus.ts`)
```typescript
menusApi.getAll()         // GET /api/menus
menusApi.getById(id)      // GET /api/menu/:id
menusApi.create(data)     // POST /api/menu
menusApi.update(id, data) // PUT /api/menu/:id
menusApi.delete(id)       // DELETE /api/menu/:id
menusApi.getMyMenus()     // GET /api/user/menus ✨
```

#### Permissions API (`src/api/permissions.ts`)
```typescript
permissionsApi.getAll()  // GET /api/permissions
```

### Types Added:

```typescript
interface Menu {
  id: string;
  name: string;
  display_name: string;
  url?: string;
  icon?: string;
  parent_id?: string;
  order_index: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at?: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  permission?: Permission;
}

interface RoleMenu {
  role_id: string;
  menu_id: string;
  menu?: Menu;
}
```

## 🎨 UI/UX Features

### Role List
- **Table view** dengan kolom: Name, Display Name, Description, Type, Actions
- **System roles** ditandai dengan badge biru + lock icon
- **Custom roles** dengan badge abu-abu
- **Actions**: View, Edit, Delete (delete disabled untuk system roles)

### Role Form
- **Tab navigation** untuk organize form sections
- **Permission grouping** by resource untuk kemudahan
- **Real-time counter** di tab labels (e.g., "Permissions (15)")
- **Checkbox grid** untuk easy selection
- **Validation** untuk required fields

### Menu List
- **Table view** dengan order, name, display name, URL, status
- **Active/Inactive badges** dengan toggle icons
- **Sort by order_index** automatically
- **Quick actions** untuk edit & delete

### Menu Form
- **Simple form** dengan semua fields
- **Checkbox untuk active status**
- **Helper text** untuk icon names & order
- **Number input** untuk order index

### Dynamic Sidebar
- **Icon mapping** untuk Lucide React icons
- **Highlight active** menu dengan warna biru
- **Smooth transitions** untuk hover states
- **Admin-only items** separated di bottom (jika tidak dari API)

## 🔐 Security & Access Control

### Frontend Guards
```typescript
// Di Layout.tsx
const isAdminOrSuperAdmin = hasRole(['admin', 'superadmin']);

// Conditional rendering
{isAdminOrSuperAdmin && (
  <MenuItem path="/roles" label="Roles" />
)}
```

### Route Protection
Semua routes sudah wrapped dengan `<ProtectedRoute>`:
```typescript
<Route path="/roles" element={
  <ProtectedRoute>
    <Layout><RoleList /></Layout>
  </ProtectedRoute>
} />
```

**Note:** Frontend guards hanya untuk UX. Backend HARUS validate permissions!

## 📁 New Files Structure

```
frontend/src/
├── api/
│   ├── roles.ts        ✨ NEW
│   ├── menus.ts        ✨ NEW
│   └── permissions.ts  ✨ NEW
│
├── context/
│   └── AuthContext.tsx  ✅ UPDATED (userMenus, hasRole, hasPermission)
│
├── components/
│   └── Layout.tsx       ✅ UPDATED (dynamic menus, role-based visibility)
│
├── pages/
│   ├── roles/          ✨ NEW
│   │   ├── RoleList.tsx
│   │   ├── RoleForm.tsx
│   │   └── index.ts
│   │
│   └── menus/          ✨ NEW
│       ├── MenuList.tsx
│       ├── MenuForm.tsx
│       └── index.ts
│
├── types/
│   └── index.ts         ✅ UPDATED (Menu, RolePermission, RoleMenu)
│
└── App.tsx              ✅ UPDATED (new routes)
```

## 🚀 Usage Examples

### 1. Check User Role
```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { hasRole } = useAuth();
  
  if (hasRole(['admin', 'superadmin'])) {
    return <AdminPanel />;
  }
  
  return <UserDashboard />;
}
```

### 2. Check Permission
```typescript
const { hasPermission } = useAuth();

{hasPermission('events:create') && (
  <button>Create Event</button>
)}
```

### 3. Access User Menus
```typescript
const { userMenus } = useAuth();

userMenus.map(menu => (
  <MenuItem key={menu.id} {...menu} />
))
```

### 4. Assign Permissions to Role
```typescript
// In RoleForm.tsx
await rolesApi.assignPermissions(roleId, [
  'permission-id-1',
  'permission-id-2',
  'permission-id-3',
]);
```

### 5. Assign Menus to Role
```typescript
await rolesApi.assignMenus(roleId, [
  'menu-id-dashboard',
  'menu-id-events',
  'menu-id-vendors',
]);
```

## 🧪 Testing Checklist

### As Admin/Superadmin:
- [ ] Login dan lihat "Roles" & "Menus" di sidebar
- [ ] Buka `/roles` - lihat list semua roles
- [ ] Create new role dengan permissions & menus
- [ ] Edit role dan update permissions
- [ ] Assign menus ke role
- [ ] Delete custom role (system role tidak bisa)
- [ ] Buka `/menus` - lihat list semua menus
- [ ] Create new menu dengan order & icon
- [ ] Edit menu dan ubah status active/inactive
- [ ] Delete menu

### As Regular User:
- [ ] Login dan **TIDAK** lihat "Roles" & "Menus" di sidebar
- [ ] Hanya lihat menus yang di-assign ke role mereka
- [ ] Try akses `/roles` manually - should be accessible (frontend tidak block, backend harus validate)

### Menu Dynamics:
- [ ] Jika API return menus: Sidebar show menus dari API
- [ ] Jika API tidak return: Sidebar show default menus
- [ ] Menu ordering berdasarkan `order_index`
- [ ] Inactive menus tidak muncul di sidebar

## 🎓 Key Learnings

1. **Role-based UI** controlled di frontend untuk UX
2. **Backend validation** still REQUIRED untuk security
3. **Dynamic menus** flexible dengan fallback to defaults
4. **Tab navigation** di form untuk organize complex data
5. **Grouped permissions** by resource untuk kemudahan
6. **Icon mapping** untuk dynamic icon rendering
7. **LocalStorage** untuk persist user menus across sessions

## 🔄 Flow Diagram

```
Login
  ↓
Fetch User Profile
  ↓
Fetch User Menus (/api/user/menus)
  ↓
Store in Context + localStorage
  ↓
Render Sidebar dengan:
  - User menus (if available)
  - Default menus (if not)
  - +Admin menus (if admin/superadmin)
  ↓
User navigates
  ↓
Frontend checks: hasRole() / hasPermission()
Backend validates: Actual permissions
```

## 💡 Best Practices

1. **Always validate on backend** - Frontend checks are for UX only
2. **Use hasRole() sparingly** - Prefer permission-based checks
3. **Keep menu names lowercase** - For consistency (e.g., `dashboard`, `events`)
4. **Order menus logically** - Dashboard first (0), then by usage frequency
5. **Test with different roles** - Ensure proper visibility

## 🎉 Result

RBAC system lengkap dengan:
- ✅ Role management UI
- ✅ Menu management UI
- ✅ Permission assignment
- ✅ Dynamic navigation
- ✅ Role-based visibility
- ✅ API integration
- ✅ Type-safe implementation

Frontend siap untuk production! 🚀
