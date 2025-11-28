TECH Stack:
Golang
Gin
Gorm
Redis
PostgreSql
JWT
MinIO
ReactJS+Vite
CSS

Latar Belakang
Proses manajemen vendor saat ini membutuhkan sistem digital yang terstruktur untuk meningkatkan efisiensi, kecepatan verifikasi, serta transparansi dalam pengelolaan vendor. Beberapa kebutuhan utama mencakup:
- Pendaftaran Vendor Baru
- Maintain Data Vendor lama
- Aktivasi Pitching Vendor
- Status Payment Vendor
- Evaluasi Performa Vendor (vendor yang telah menyelesaikan event melakukan upload foto kegiatan yang bisa di review oleh management & user)
  
- Type user & kebutuhan user yang akan menggunakan web ini:
  User admin
  Tambah / Edit / Nonaktifkan user
  Kontrol master data vendor
  Melihat daftar vendor aktif
  Validasi dokumen yang mendekati masa expired
  Monitoring kelengkapan dokumen vendor
  Review & verifikasi data vendor
  Approval / Revisi / Reject
  Monitoring kelengkapan dokumen vendor
  Validasi dokumen yang mendekati masa expired
- 
  User Client (Manager/SPV)
  Monitoring performa vendor
  Memberikan evaluasi vendor setelah event/proyek
  Melihat vendor peserta event dan shortlist
- 
  User Vendor
  Melakukan pendaftaran dengan akses password & email masing-masing calon vendor
  Mengisi data perusahaan
  Uplaod document legal change data vendor

Isi halaman pada web
Pendaftaran vendor baru
Dilakukan oleh Calon Vendor, dengan menggunakan email & password yang mereka buat, kemudian mengisi form” dan upload document legal
Maintain data Vendor Lama
Bisa dilakukan oleh admin/super admin/vendor apabilan ingin merubah data” mereka seperti (alamat,no hp, no rekening/update pembaharuan legalitas)
Pitching Vendor : Modul ini digunakan saat Astra mengadakan event, tender, atau kompetisi vendor.
Pembuatan Event oleh Astra (user manajer/SPV)
Judul event
Deskripsi
Timeline
Kategori
Upload syarat & ketentuan

Partisipasi Vendor (User Vendor)
Submit pitch deck
Mengisi detail proposal
Upload materi tambahan
Penilaian & Seleksi (User manajer/SPV)
Panel evaluasi internal
Rating, komentar, dan scoring
Shortlist vendor
Evaluasi Vendor
Rating & feedback dari tim internal
Rekap skor performa vendor
History penilaian per event / proyek
Update Payment
User Admin Upload Bukti TF atas invoice yang sudah dibayarkan
User Vendor hanya dapat melihat bukti tf dan pembayaran


Type Vendor = Perusahaan dan Perorangan

Role:


Activasi Pitching Vendor:
Ada tombol selengkapnya: upload penawaran Vendor (PPT/pdf) max 20Mb
Berdasarkan upload penawaran dipilih pemenang oleh client (pasti 1 vendor)
Hasil Pitching dan yg bisa liat cuma vendor pemenang

Module Status Payment Vendor
Vendor: hanya view
Admin: bisa update
Form:
No Invoice
Nama Vendor
Nominal (rupiah)
Status : On Progress / Done
Tanggal Payment
Upload Bukti Trf berupa image
Deskripsi

Module Evaluasi Performa Vendor
Upload max 5 Foto, max 2Mb

Role: client bisa memberi review per-gambar dan bisa memberikan rating
Role client yg menentukan pemenang vendor