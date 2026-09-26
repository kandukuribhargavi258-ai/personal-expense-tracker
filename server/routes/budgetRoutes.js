import express from "express";
import Budget from "../models/Budget.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

router.get("/:month", async (req, res) => {
  try {
    const budget = await Budget.findOne({
      user: req.userId,
      month: req.params.month
    });

    res.json(budget || { amount: 0, month: req.params.month });
  } catch {
    res.status(500).json({ message: "Could not fetch budget" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { month, amount } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, month },
      { amount: Number(amount) },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(budget);
  } catch {
    res.status(500).json({ message: "Could not save budget" });
  }
});

export default router;