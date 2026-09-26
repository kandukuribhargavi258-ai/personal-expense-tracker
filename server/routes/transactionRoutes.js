import express from "express";
import Transaction from "../models/Transaction.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch {
    res.status(500).json({ message: "Could not fetch transactions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: "Type, amount and category are required" });
    }

    const transaction = await Transaction.create({
      user: req.userId,
      type,
      amount: Number(amount),
      category,
      description,
      date: date || new Date()
    });

    res.status(201).json(transaction);
  } catch {
    res.status(500).json({ message: "Could not create transaction" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch {
    res.status(500).json({ message: "Could not update transaction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch {
    res.status(500).json({ message: "Could not delete transaction" });
  }
});

export default router;