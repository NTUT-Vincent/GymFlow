# GymFlow 零成本 MVP

GymFlow 是健身房會員預約、器材即時狀態與人員排程後台的 PWA。專案預設連接 Firebase 專案 `gymflow-a7664`，未設定 Firebase Web App 參數時會自動進入可操作的本機示範模式。

## 已完成

- 會員前台：首頁、器材預約、即時狀態、個人排程與取消。
- 人員後台：新增健身房、新增器材、維修狀態、預約佇列。
- 瀏覽器端最佳化：Web Worker 中執行限時 branch-and-bound，遵守器材類型、維修、使用中與時段不重疊限制。
- Firebase：Authentication、Firestore 規則、複合索引、Hosting 與 PWA 設定。
- 無 Firebase 參數時使用 localStorage 示範資料，不會產生費用。

## 本機啟動

```bash
npm install
npm run dev
```

## 連接 Firebase

1. 在 Firebase Console 開啟專案 `gymflow-a7664`。
2. 專案設定 → 一般 → 新增「網頁應用程式」。
3. 複製 `.env.example` 為 `.env`，填入 Firebase 顯示的 Web App 設定值。
4. Authentication → Sign-in method → 啟用 Google。
5. Firestore Database → 建立資料庫，地區建議選擇鄰近使用者的位置。
6. 第一位管理員登入後，在 Firestore 的 `users/{uid}` 將 `role` 從 `member` 改為 `admin`。

Firebase Web App 的 `apiKey` 是用戶端識別設定，不是管理員私鑰；仍應搭配本專案的 Firestore Security Rules 與網域限制。

## 驗證與部署

```bash
npm test
npm run build
npx firebase login
npm run deploy
```

部署指令會將 Hosting、Firestore Rules 與 Indexes 發佈到 `gymflow-a7664`。請保持 Firebase Spark 方案，不要連結 Cloud Billing，即可維持無信用卡的零成本模式。

## 權限模型

- `member`：建立、查看及取消自己的預約。
- `staff`：管理器材狀態、會員預約與排程。
- `admin`：包含 staff 權限，並可管理場館與帳號角色。

初始管理員必須由 Firebase Console 手動設定；前端不允許使用者自行提升權限。
