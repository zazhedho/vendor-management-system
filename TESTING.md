# Testing Guide - Vendor Management System

## ✅ Frontend sudah FIX dengan Tailwind CSS!

Masalahnya adalah Tailwind CSS tidak terkonfigurasi dengan benar. Sekarang sudah diperbaiki!

## 🚀 Cara Menjalankan

### 1. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka browser: **http://localhost:5173**

### 2. Start Backend (Go)

Di terminal lain:

```bash
cd /path/to/project
go run main.go
```

Backend akan jalan di: **http://localhost:8080**

## 🎨 Yang Sudah Diperbaiki

✅ **Tailwind CSS v3.4** terinstall dengan benar
✅ **PostCSS** dikonfigurasi dengan benar
✅ **tailwind.config.js** dengan color scheme biru
✅ **Custom components** (.btn, .card, .input, .label)
✅ **Build berhasil** dengan CSS 21KB

## 📱 Preview UI

Sekarang Anda akan melihat:
- **Gradien biru** di login/register page
- **Sidebar** dengan navigasi smooth
- **Cards** dengan shadow dan border
- **Buttons** dengan hover effects
- **Tables** dengan styling yang rapi
- **Forms** dengan input fields yang cantik
- **Loading spinners** animasi
- **Status badges** berwarna

## 🧪 Testing Checklist

### Login Page (http://localhost:5173/login)
- [ ] Background gradient biru terlihat
- [ ] Card putih di tengah dengan shadow
- [ ] Input fields dengan border dan focus ring biru
- [ ] Button biru dengan hover effect
- [ ] Link "Sign up" berwarna biru

### Dashboard (http://localhost:5173/dashboard)
- [ ] Sidebar kiri dengan menu items
- [ ] Stats cards dengan icon dan warna
- [ ] Recent events cards
- [ ] Responsive untuk mobile

### Events List (http://localhost:5173/events)
- [ ] Search bar dengan icon
- [ ] Event cards dalam grid
- [ ] Status badges (Active/Completed/Cancelled)
- [ ] Action buttons (View/Edit/Delete)
- [ ] Pagination di bawah

### Event Form (http://localhost:5173/events/new)
- [ ] Form fields dengan label
- [ ] Date pickers
- [ ] Dropdown untuk status
- [ ] Cancel & Save buttons
- [ ] Validation messages (jika error)

### Vendors List (http://localhost:5173/vendors)
- [ ] Vendor cards dengan icon
- [ ] Status badges berwarna
- [ ] Search functionality
- [ ] Pagination

### Payments List (http://localhost:5173/payments)
- [ ] Table dengan striped rows
- [ ] Currency formatting (IDR)
- [ ] Status colors (Paid=green, Pending=yellow)
- [ ] Sortable columns

## 🔧 Troubleshooting

### Jika masih terlihat plain HTML:

1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows/Linux) atau `Cmd+Shift+R` (Mac)
2. **Clear cache**:
   - Chrome: F12 → Network tab → Disable cache
   - Firefox: F12 → Settings → Advanced → Disable cache
3. **Check console**: Buka DevTools (F12) dan lihat error di Console tab
4. **Restart dev server**:
   ```bash
   # Stop dengan Ctrl+C
   npm run dev
   ```

### Jika build error:

```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Jika port 5173 sudah digunakan:

```bash
# Gunakan port lain
npm run dev -- --port 3000
```

## 📂 File Penting

- `frontend/src/index.css` - Tailwind directives & custom classes
- `frontend/tailwind.config.js` - Tailwind configuration
- `frontend/postcss.config.js` - PostCSS configuration
- `frontend/vite.config.ts` - Vite configuration

## 🎯 Testing dengan Backend

Ketika backend Go running:

1. **Register user baru** → Akan hit API `/api/user/register`
2. **Login** → Akan hit API `/api/user/login` dan dapat JWT token
3. **View events** → Akan fetch dari API `/api/events`
4. **Create event** → POST ke `/api/event`

JWT token disimpan di localStorage dan otomatis dikirim di setiap request.

## 💡 Tips

- Gunakan Chrome DevTools untuk inspect element dan lihat class Tailwind
- Network tab untuk lihat API calls
- Console tab untuk error messages
- React DevTools extension untuk debug React components

Selamat testing! 🚀
