import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import api from "./api";

const categories = [
  "Food", "Travel", "Shopping", "Education",
  "Bills", "Health", "Entertainment", "Other"
];

function Protected({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

function Layout({ children, user, onLogout }) {
  return (
    <>
      <nav className="nav">
        <Link className="brand" to="/">💰 ExpenseTrack</Link>
        <div className="navlinks">
          <Link to="/">Dashboard</Link>
          <Link to="/transactions">Transactions</Link>
          <span className="hello">Hi, {user?.name}</span>
          <button className="logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>
      <main className="container">{children}</main>
    </>
  );
}

function Auth({ mode, onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <div className="logo">💰</div>
        <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
        <p className="muted">
          {mode === "login" ? "Track your money smarter." : "Start managing your expenses."}
        </p>

        {mode === "register" && (
          <input
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          minLength="6"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <div className="error">{error}</div>}

        <button className="primary">{mode === "login" ? "Login" : "Register"}</button>

        <p className="switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Register" : "Login"}
          </Link>
        </p>
      </form>
    </div>
  );
}

function Dashboard({ transactions, budget, setBudget }) {
  const month = new Date().toISOString().slice(0, 7);

  const current = useMemo(
    () => transactions.filter(t => new Date(t.date).toISOString().slice(0, 7) === month),
    [transactions, month]
  );

  const income = current.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = current.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  const categoryMap = {};
  current.filter(t => t.type === "expense").forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  const barData = [
    { name: "Income", amount: income },
    { name: "Expenses", amount: expenses },
    { name: "Balance", amount: Math.max(balance, 0) }
  ];

  const budgetUsed = budget ? Math.min((expenses / budget) * 100, 100) : 0;

  async function saveBudget() {
    const amount = prompt("Enter monthly budget:", budget || "");
    if (amount === null || Number(amount) <= 0) return;
    await api.post("/budgets", { month, amount: Number(amount) });
    setBudget(Number(amount));
  }

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Your Money Dashboard</h1>
          <p>Understand where your money goes and stay within your budget.</p>
        </div>
        <button className="primary" onClick={saveBudget}>Set Monthly Budget</button>
      </section>

      <section className="stats">
        <div className="stat-card"><span>Income</span><strong>₹{income.toLocaleString()}</strong></div>
        <div className="stat-card"><span>Expenses</span><strong>₹{expenses.toLocaleString()}</strong></div>
        <div className="stat-card"><span>Balance</span><strong>₹{balance.toLocaleString()}</strong></div>
        <div className="stat-card"><span>Budget</span><strong>₹{Number(budget || 0).toLocaleString()}</strong></div>
      </section>

      <section className="grid">
        <div className="card chart-card">
          <h2>Spending by Category</h2>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={105} label>
                  {pieData.map((_, i) => <Cell key={i} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty">No expenses this month.</div>}
        </div>

        <div className="card chart-card">
          <h2>Monthly Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              <Bar dataKey="amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card budget-card">
        <div className="budget-head">
          <div>
            <h2>Monthly Budget</h2>
            <p className="muted">₹{expenses.toLocaleString()} spent of ₹{Number(budget || 0).toLocaleString()}</p>
          </div>
          <strong>{budget ? `${Math.round(budgetUsed)}%` : "Not set"}</strong>
        </div>
        <div className="progress"><div style={{ width: `${budgetUsed}%` }} /></div>
        {budget && expenses > budget && <p className="warning">⚠️ You have exceeded your monthly budget.</p>}
      </section>
    </>
  );
}

function Transactions({ transactions, refresh }) {
  const [form, setForm] = useState({
    type: "expense", amount: "", category: "Food", description: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const filtered = transactions.filter(t => {
    const searchMatch =
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());

    const typeMatch = typeFilter === "all" || t.type === typeFilter;
    return searchMatch && typeMatch;
  });

  function startEdit(t) {
    setEditing(t._id);
    setForm({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description || "",
      date: new Date(t.date).toISOString().slice(0, 10)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      if (editing) {
        await api.put(`/transactions/${editing}`, form);
      } else {
        await api.post("/transactions", form);
      }

      setEditing(null);
      setForm({
        type: "expense", amount: "", category: "Food",
        description: "", date: new Date().toISOString().slice(0, 10)
      });
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save transaction");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this transaction?")) return;
    await api.delete(`/transactions/${id}`);
    refresh();
  }

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">TRANSACTIONS</p>
          <h1>{editing ? "Edit Transaction" : "Add Transaction"}</h1>
          <p>Keep every income and expense organized.</p>
        </div>
      </section>

      <form className="card transaction-form" onSubmit={submit}>
        <div className="form-grid">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            required
          />

          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            required
          />

          <input
            className="wide"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button className="primary">{editing ? "Update" : "Add Transaction"}</button>
          {editing && (
            <button type="button" className="secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="card">
        <div className="table-head">
          <h2>Transaction History</h2>
          <div className="filters">
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">No transactions found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Category</th>
                  <th>Description</th><th>Amount</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t._id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td><span className={`pill ${t.type}`}>{t.type}</span></td>
                    <td>{t.category}</td>
                    <td>{t.description || "—"}</td>
                    <td className={t.type === "income" ? "income-text" : "expense-text"}>
                      {t.type === "income" ? "+" : "-"}₹{Number(t.amount).toLocaleString()}
                    </td>
                    <td>
                      <button className="small" onClick={() => startEdit(t)}>Edit</button>
                      <button className="small danger" onClick={() => remove(t._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(0);

  const loggedIn = Boolean(localStorage.getItem("token"));
  const month = new Date().toISOString().slice(0, 7);

  async function refresh() {
    if (!localStorage.getItem("token")) return;
    try {
      const { data } = await api.get("/transactions");
      setTransactions(data);
      const budgetRes = await api.get(`/budgets/${month}`);
      setBudget(budgetRes.data.amount || 0);
    } catch {
      logout();
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setTransactions([]);
  }

  useEffect(() => {
    refresh();
  }, [loggedIn]);

  return (
    <Routes>
      <Route path="/login" element={
        loggedIn ? <Navigate to="/" /> : <Auth mode="login" onLogin={setUser} />
      } />
      <Route path="/register" element={
        loggedIn ? <Navigate to="/" /> : <Auth mode="register" onLogin={setUser} />
      } />

      <Route path="/" element={
        <Protected>
          <Layout user={user} onLogout={logout}>
            <Dashboard transactions={transactions} budget={budget} setBudget={setBudget} />
          </Layout>
        </Protected>
      } />

      <Route path="/transactions" element={
        <Protected>
          <Layout user={user} onLogout={logout}>
            <Transactions transactions={transactions} refresh={refresh} />
          </Layout>
        </Protected>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;