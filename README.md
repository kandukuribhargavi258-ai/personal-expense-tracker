# Personal Expense Tracker

A full-stack personal expense tracker built with React, Node.js, Express and MongoDB.

## Features
- User registration and login
- JWT authentication
- Add, edit and delete transactions
- Income and expense tracking
- Categories
- Monthly dashboard
- Budget setting
- Spending charts
- Search/filter transactions
- Responsive UI
- REST API

## Requirements
- Node.js 18+
- MongoDB Atlas account or local MongoDB

## 1. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=change_this_to_a_long_random_secret
```

Run:

```bash
npm run dev
```

Backend: http://localhost:5000

## 2. Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend: http://localhost:5173

## Project structure

personal-expense-tracker/
  client/
  server/

## Placement talking points
- JWT authentication
- REST APIs
- MongoDB data modeling
- CRUD operations
- Protected routes
- React state management
- Data visualization
- Responsive design
