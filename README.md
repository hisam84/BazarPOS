# BazarPOS Next.js Multi-Store POS Software

Modern, full-stack Point of Sale & Inventory Management System built with Next.js 14+ (App Router), React, Tailwind CSS, and Serverless Database.

## Features Included

- 🛒 **POS Billing Counter**: Fast barcode scanner billing, hold cart drafts, split payments (Cash, bKash / Nagad MFS, Card, Credit Due).
- 🏷️ **Barcode Generator**: Batch barcode label printing for thermal label printers.
- 📦 **Inventory & Low Stock Alerts**: Product stock tracking, category management, low stock badges.
- 🚚 **Suppliers & Purchase Stock Entry**: Supplier directory, Purchase stock receiving entry (auto-updates stock count & cost prices).
- 👥 **Role-Based Staff Access**: Owner (Full Admin), Manager (Sales/Stock), Cashier (POS Terminal restricted view).
- 👑 **Super Admin SaaS Portal**: Super Admin account (`superadmin` / `superadmin@123`) to create and manage merchant stores.
- 📱 **SMS & WhatsApp Invoicing**: Direct WhatsApp invoice sharing links & customer due payment SMS reminders.
- 📊 **Profit & Loss Analytics**: Real-time Gross & Net profit calculation.
- 🖨️ **Dual Print Engine**: Thermal 80mm/58mm POS receipt layout & A4 Invoice Bill.
- 💾 **1-Click Backup & Restore**: Full JSON database export & restore import.

---

## Default Login Credentials

- **Super Admin**: `superadmin` / `superadmin@123`
- **Store Admin (Owner)**: `admin` / `superadmin@123`

---

## How to Deploy to Vercel via GitHub

### Step 1: Push Project to GitHub

```bash
git init
git add .
git commit -m "Initial commit - BazarPOS Next.js"
git branch -M main
git remote add origin https://github.com/your-username/bazarpos-next.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New... -> Project**.
3. Select your **bazarpos-next** GitHub repository.
4. Framework Preset will automatically detect **Next.js**.
5. Click **Deploy**!

Your POS software will be live in seconds with automatic CI/CD deployment on every `git push`.
