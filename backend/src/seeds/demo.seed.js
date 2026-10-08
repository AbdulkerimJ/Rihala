/**
 * demo.seed.js
 *
 * Populates the database with ~1 month of realistic operational data
 * (from roughly 30 days ago up to today) that exercises every module
 * in the Rihala system.
 *
 * Run:  node src/seeds/demo.seed.js
 *   or: npm run seed:demo   (after adding the script to package.json)
 *
 * The seed is IDEMPOTENT for master data (customers, suppliers, etc.)
 * but will insert fresh transactional data on every run, so wipe first
 * if you want a clean slate:  npm run db:wipe && node src/seeds/demo.seed.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../core/database/mongodb.js";

// ── Models ─────────────────────────────────────────────────────────────────
import User                from "../modules/users/user.model.js";
import Counter             from "../core/models/counter.model.js";
import Customer            from "../modules/customers/customer.model.js";
import Order               from "../modules/orders/order.model.js";
import CustomerPayment     from "../modules/customerPayments/customerPayment.model.js";
import Employee            from "../modules/employees/employee.model.js";
import Attendance          from "../modules/attendances/attendance.model.js";
import Overtime            from "../modules/overtimes/overtime.model.js";
import WeeklyPayroll       from "../modules/weeklyPayrolls/weeklyPayroll.model.js";
import EmployeePayment     from "../modules/employeePayments/employeePayment.model.js";
import Supplier            from "../modules/suppliers/supplier.model.js";
import Material            from "../modules/materials/material.model.js";
import Purchase            from "../modules/purchases/purchase.model.js";
import SupplierPayment     from "../modules/supplierPayments/supplierPayment.model.js";
import Expense             from "../modules/expenses/expense.model.js";
import TaskType            from "../modules/taskTypes/taskType.model.js";
import Task                from "../modules/tasks/task.model.js";
import Contractor          from "../modules/contractors/contractor.model.js";
import Contract            from "../modules/contracts/contract.model.js";
import ContractCompletion  from "../modules/contractCompletions/contractCompletion.model.js";
import ContractorPayment   from "../modules/contractorPayments/contractorPayment.model.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a Date that is `daysAgo` days before today, at the given hour */
const daysBack = (daysAgo, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/** Random integer in [min, max] */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Pick a random element from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Atomically get-and-increment a counter, returning the formatted string */
const nextSeq = async (counterId, prefix) => {
  const doc = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${String(doc.seq).padStart(4, "0")}`;
};

// ── Seed weekday attendance helpers ─────────────────────────────────────────

/**
 * For a given week (Mon–Sat), build attendance + optional overtime records.
 * Returns { normalEarnings, overtimeEarnings } for the payroll.
 */
const seedWeek = async (employee, weekStartMonday) => {
  let normalEarnings   = 0;
  let overtimeEarnings = 0;
  const dailyBreakdown   = [];
  const overtimeBreakdown = [];

  const MULTIPLIER = 1.5; // overtime rate

  for (let d = 0; d < 6; d++) {        // Mon … Sat (6-day workshop)
    const date = new Date(weekStartMonday);
    date.setDate(date.getDate() + d);
    if (date > new Date()) break;       // don't seed future dates

    const morningStatus   = Math.random() < 0.88 ? "PRESENT" : (Math.random() < 0.5 ? "ABSENT" : "PERMISSION");
    const afternoonStatus = Math.random() < 0.88 ? "PRESENT" : (Math.random() < 0.5 ? "ABSENT" : "PERMISSION");

    // Skip inserting if attendance already exists (idempotency guard)
    const exists = await Attendance.findOne({ employee: employee._id, workDate: date });
    if (!exists) {
      await Attendance.create({ employee: employee._id, workDate: date, morningStatus, afternoonStatus });
    }

    const portion =
      (morningStatus   === "PRESENT" ? 0.5 : 0) +
      (afternoonStatus === "PRESENT" ? 0.5 : 0);
    const dayEarnings = portion * employee.dailyRate;
    normalEarnings += dayEarnings;

    dailyBreakdown.push({
      workDate: date, morningStatus, afternoonStatus,
      portion, dailyRate: employee.dailyRate, earnings: dayEarnings,
    });

    // ~20% chance of overtime
    if (Math.random() < 0.20 && morningStatus === "PRESENT" && afternoonStatus === "PRESENT") {
      const duration = Math.random() < 0.5 ? "HALF_DAY" : "FULL_DAY";
      const otExists = await Overtime.findOne({ employee: employee._id, workDate: date });
      if (!otExists) {
        await Overtime.create({ employee: employee._id, workDate: date, duration });
      }
      const otEarnings = (duration === "HALF_DAY" ? 0.5 : 1) * employee.dailyRate * MULTIPLIER;
      overtimeEarnings += otEarnings;
      overtimeBreakdown.push({
        workDate: date, duration, multiplier: MULTIPLIER,
        dailyRate: employee.dailyRate, earnings: otEarnings,
      });
    }
  }

  return { normalEarnings, overtimeEarnings, dailyBreakdown, overtimeBreakdown };
};

// ════════════════════════════════════════════════════════════════════════════
//  MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════
const seedDemo = async () => {
  try {
    console.log("🚀  Rihala Demo Seed — starting...\n");
    await connectDatabase();

    // ── 0. Ensure counters exist ────────────────────────────────────────────
    for (const id of ["orderNumber", "purchaseNumber", "paymentReference", "contractNumber"]) {
      await Counter.findOneAndUpdate(
        { _id: id }, { $setOnInsert: { seq: 0 } }, { upsert: true, new: true }
      );
    }

    // ── 1. Grab the admin user (must run seed:admin first) ──────────────────
    const adminEmail = (process.env.ADMIN_EMAIL || "kerimewa@gmail.com").toLowerCase();
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) throw new Error("Admin user not found — run `npm run seed:admin` first.");
    console.log(`✔  Admin user found: ${admin.email}`);

    // ════════════════════════════════════════════════════════════════════════
    //  MASTER DATA
    // ════════════════════════════════════════════════════════════════════════

    // ── 2. Customers ────────────────────────────────────────────────────────
    console.log("\n── Seeding customers...");
    const customerData = [
      { name: "Abebe Bekele",       phone: "0911100001", address: "Addis Ababa, Bole",          notes: "VIP client, prefers morning calls" },
      { name: "Fatuma Mohammed",    phone: "0911100002", address: "Addis Ababa, Piassa",        notes: "Usually requests custom fabric" },
      { name: "Dawit Mekonnen",     phone: "0911100003", address: "Hawassa, Piassa",            notes: "" },
      { name: "Kedir Jemal",        phone: "0911100004", address: "Adama, Posta Bet",           notes: "Referral from Abebe" },
      { name: "Yosef Hailu",        phone: "0911100005", address: "Dire Dawa, Kezira",          notes: "Bulk orders" },
      { name: "Zeyneba Hassen",     phone: "0911100006", address: "Addis Ababa, Haya Hulet",    notes: "" },
      { name: "Bereket Tesfaye",    phone: "0911100007", address: "Bahir Dar, Kebele 04",       notes: "Long-distance, deliver via agent" },
      { name: "Kemal Seid",         phone: "0911100008", address: "Addis Ababa, Megenagna",     notes: "" },
    ];
    const customers = [];
    for (const data of customerData) {
      const c = await Customer.findOneAndUpdate(
        { phone: data.phone },
        { ...data, status: "active" },
        { upsert: true, new: true }
      );
      customers.push(c);
    }
    console.log(`   ✔  ${customers.length} customers`);

    // ── 3. Employees ────────────────────────────────────────────────────────
    console.log("── Seeding employees...");
    const employeeData = [
      { name: "Ephrem Tilahun",  phone: "0922200001", dailyRate: 3500 },
      { name: "Ahmed Ali",       phone: "0922200002", dailyRate: 3000 },
      { name: "Henok Desta",     phone: "0922200003", dailyRate: 3200 },
      { name: "Seid Mustafa",    phone: "0922200004", dailyRate: 2800 },
      { name: "Samuel Tsegaye",  phone: "0922200005", dailyRate: 3000 },
      { name: "Hussein Ibrahim", phone: "0922200006", dailyRate: 2600 },
    ];
    const employees = [];
    for (const data of employeeData) {
      const emp = await Employee.findOneAndUpdate(
        { phone: data.phone },
        { ...data, employmentStartDate: daysBack(60), status: "active" },
        { upsert: true, new: true }
      );
      employees.push(emp);
    }
    console.log(`   ✔  ${employees.length} employees`);

    // ── 4. Suppliers ────────────────────────────────────────────────────────
    console.log("── Seeding suppliers...");
    const supplierData = [
      { name: "Ethio Wood Co.",       phone: "0933300001", address: "Gurd Shola Industrial Zone" },
      { name: "Abyssinia MDF Trading", phone: "0933300002", address: "Kality Industrial Zone" },
      { name: "Shewa Fabric House",   phone: "0933300003", address: "Mercato" },
      { name: "Lucy Hardware",        phone: "0933300004", address: "Megenagna" },
      { name: "Bole Foam Import",     phone: "0933300005", address: "Bole" },
    ];
    const suppliers = [];
    for (const data of supplierData) {
      const s = await Supplier.findOneAndUpdate(
        { phone: data.phone },
        { ...data, status: "active", balance: 0 },
        { upsert: true, new: true }
      );
      suppliers.push(s);
    }
    console.log(`   ✔  ${suppliers.length} suppliers`);

    // ── 5. Materials ────────────────────────────────────────────────────────
    console.log("── Seeding materials...");
    const materialData = [
      { name: "MDF Board 18mm",   category: "MDF",       unit: "piece" },
      { name: "MDF Board 12mm",   category: "MDF",       unit: "piece" },
      { name: "Plywood Sheet",    category: "Wood",      unit: "piece" },
      { name: "Oak Wood Strip",   category: "Wood",      unit: "meter" },
      { name: "Velvet Fabric",    category: "Fabric",    unit: "meter" },
      { name: "Linen Fabric",     category: "Fabric",    unit: "meter" },
      { name: "Polyfoam 10cm",    category: "Foam",      unit: "piece" },
      { name: "Polyfoam 5cm",     category: "Foam",      unit: "piece" },
      { name: "Safarian Sheet",   category: "Safarian",  unit: "meter" },
      { name: "Box Nails 3inch",  category: "Nails",     unit: "kg"    },
      { name: "Staple Nails",     category: "Nails",     unit: "kg"    },
      { name: "White Paint",      category: "Paint",     unit: "liter" },
      { name: "Wood Glue",        category: "Adhesives", unit: "liter" },
      { name: "Corner Brackets",  category: "Hardware",  unit: "piece" },
      { name: "Drawer Slides",    category: "Hardware",  unit: "piece" },
      { name: "Wood Varnish",     category: "Chemicals", unit: "liter" },
    ];
    const materials = [];
    for (const data of materialData) {
      const m = await Material.findOneAndUpdate(
        { name: data.name },
        { ...data, status: "active" },
        { upsert: true, new: true }
      );
      materials.push(m);
    }
    console.log(`   ✔  ${materials.length} materials`);

    // ── 6. Task Types & Tasks ───────────────────────────────────────────────
    console.log("── Seeding task types & tasks...");
    const taskTypeData = [
      { name: "Upholstery" },
      { name: "Carpentry" },
      { name: "Painting" },
      { name: "Assembly" },
    ];
    const taskTypes = [];
    for (const data of taskTypeData) {
      const tt = await TaskType.findOneAndUpdate(
        { name: data.name }, { ...data, isActive: true }, { upsert: true, new: true }
      );
      taskTypes.push(tt);
    }

    const taskData = [
      { name: "Modern Majlis Re-upholstery", taskType: taskTypes[0]._id, defaultUnitPrice: 15000 },
      { name: "Mejlis 101 Foam Replacement", taskType: taskTypes[0]._id, defaultUnitPrice:  8000 },
      { name: "Moroccan Majlis Cover Making", taskType: taskTypes[0]._id, defaultUnitPrice: 12000 },
      { name: "Majlis Wooden Base Carpentry", taskType: taskTypes[1]._id, defaultUnitPrice: 25000 },
      { name: "Majlis Corner Table Build",    taskType: taskTypes[1]._id, defaultUnitPrice: 10000 },
      { name: "Majlis Armrest Carpentry",     taskType: taskTypes[1]._id, defaultUnitPrice:  6000 },
      { name: "Majlis Base Painting",         taskType: taskTypes[2]._id, defaultUnitPrice:  5000 },
      { name: "Majlis Full Assembly",         taskType: taskTypes[3]._id, defaultUnitPrice:  4500 },
    ];
    const tasks = [];
    for (const data of taskData) {
      const t = await Task.findOneAndUpdate(
        { name: data.name }, { ...data, isActive: true }, { upsert: true, new: true }
      );
      tasks.push(t);
    }
    console.log(`   ✔  ${taskTypes.length} task types, ${tasks.length} tasks`);

    // ── 7. Contractors ──────────────────────────────────────────────────────
    console.log("── Seeding contractors...");
    const contractorData = [
      { name: "Anteneh Worku",      phone: "0944400001" },
      { name: "Muktar Nuru",        phone: "0944400002" },
      { name: "Nahom Demeke",       phone: "0944400003" },
      { name: "Abdurahman Yassin",  phone: "0944400004" },
    ];
    const contractors = [];
    for (const data of contractorData) {
      const c = await Contractor.findOneAndUpdate(
        { phone: data.phone }, { ...data, status: "active" }, { upsert: true, new: true }
      );
      contractors.push(c);
    }
    console.log(`   ✔  ${contractors.length} contractors`);

    // ════════════════════════════════════════════════════════════════════════
    //  TRANSACTIONAL DATA  (last 30 days)
    // ════════════════════════════════════════════════════════════════════════

    // ── 8. Orders (customer jobs) ────────────────────────────────────────────
    console.log("\n── Seeding orders...");
    const orderDescriptions = [
      "Modern majlis seating - U-shape",
      "Mejlis 101 custom design setup",
      "Moroccan Majlis complete set",
      "Arabic Majlis with corner tables",
      "Classic Majlis seating replacement",
      "Modern majlis cushions and covers",
      "Mejlis 101 floor seating arrangement",
      "Moroccan Majlis corner sofa",
      "Premium Majlis full room installation",
      "Custom L-shape Modern majlis",
      "Traditional Ethiopian Majlis design",
      "Mejlis 101 VIP seating set",
    ];

    const orderStatuses = ["pending", "in_progress", "ready", "completed", "completed", "completed"];
    const createdOrders = [];
    for (let i = 0; i < 12; i++) {
      const daysAgo   = randInt(1, 30);
      const orderDate = daysBack(daysAgo, randInt(8, 14));
      const completion = new Date(orderDate);
      completion.setDate(completion.getDate() + randInt(7, 21));
      const customer  = pick(customers);
      const agreedAmt = randInt(15, 120) * 1000;
      const status    = i < 4 ? orderStatuses[i] : pick(orderStatuses);

      const orderNumber = await nextSeq("orderNumber", "ORD");
      const order = await Order.create({
        orderNumber,
        customer: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        createdBy: admin._id,
        date: orderDate,
        description: orderDescriptions[i % orderDescriptions.length],
        agreedAmount: agreedAmt,
        totalPaid: 0,
        expectedCompletionDate: completion,
        status,
        statusHistory: [{ status, changedAt: orderDate, changedBy: admin._id }],
        notes: Math.random() < 0.4 ? "Client requested priority handling" : null,
      });
      createdOrders.push({ order, agreedAmt, daysAgo });
    }
    console.log(`   ✔  ${createdOrders.length} orders`);

    // ── 9. Customer Payments ─────────────────────────────────────────────────
    console.log("── Seeding customer payments...");
    let cpCount = 0;
    for (const { order, agreedAmt, daysAgo } of createdOrders) {
      const numPayments = order.status === "completed"
        ? randInt(1, 3)
        : (Math.random() < 0.6 ? 1 : 0);
      let totalPaid = 0;
      for (let p = 0; p < numPayments; p++) {
        const payDaysAgo = Math.max(1, daysAgo - randInt(0, 5) - p * 3);
        const portion = p === numPayments - 1 && order.status === "completed"
          ? agreedAmt - totalPaid
          : Math.round(agreedAmt * (Math.random() * 0.4 + 0.2));
        if (portion <= 0) continue;
        await CustomerPayment.create({
          order: order._id,
          amount: portion,
          paymentDate: daysBack(payDaysAgo, randInt(9, 17)),
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          note: p === 0 ? "Deposit payment" : "Partial payment",
          status: "active",
          createdBy: admin._id,
        });
        totalPaid += portion;
        cpCount++;
      }
      // Update order's totalPaid
      await Order.findByIdAndUpdate(order._id, { totalPaid });
    }
    console.log(`   ✔  ${cpCount} customer payments`);

    // ── 10. Purchases (from suppliers) ───────────────────────────────────────
    console.log("── Seeding purchases...");
    const unitPrices = {
      "MDF Board 18mm": 4500, "MDF Board 12mm": 3200, "Plywood Sheet": 3800,
      "Oak Wood Strip":  1200, "Velvet Fabric":  2800, "Linen Fabric":  1800,
      "Polyfoam 10cm":  3500, "Polyfoam 5cm":   2000, "Safarian Sheet":  950,
      "Box Nails 3inch": 600, "Staple Nails":    450, "White Paint":    1800,
      "Wood Glue":      1200, "Corner Brackets":  250, "Drawer Slides":   800,
      "Wood Varnish":   2200,
    };

    const createdPurchases = [];
    for (let i = 0; i < 10; i++) {
      const daysAgo  = randInt(1, 28);
      const supplier = pick(suppliers);
      const numItems = randInt(2, 5);
      const selectedMats = [...materials].sort(() => Math.random() - 0.5).slice(0, numItems);
      const items = selectedMats.map(mat => {
        const qty = randInt(2, 20);
        const up  = unitPrices[mat.name] || 1000;
        return {
          material: mat._id, materialName: mat.name, materialCategory: mat.category,
          quantity: qty, unit: mat.unit, unitPrice: up, subtotal: qty * up,
        };
      });
      const totalAmount = items.reduce((s, it) => s + it.subtotal, 0);
      const purchaseNumber = await nextSeq("purchaseNumber", "PUR");
      const purchase = await Purchase.create({
        purchaseNumber, supplier: supplier._id,
        date: daysBack(daysAgo, randInt(8, 12)),
        items, totalAmount, allocatedAmount: 0,
        paymentStatus: "UNPAID",
        createdBy: admin._id, createdByName: admin.name,
        note: null,
      });
      createdPurchases.push({ purchase, supplier, totalAmount, daysAgo });
    }
    console.log(`   ✔  ${createdPurchases.length} purchases`);

    // ── 11. Supplier Payments ─────────────────────────────────────────────────
    console.log("── Seeding supplier payments...");
    let spCount = 0;
    for (const { purchase, supplier, totalAmount, daysAgo } of createdPurchases) {
      if (Math.random() < 0.3) continue; // ~30% left unpaid
      const payDaysAgo = Math.max(1, daysAgo - randInt(1, 5));
      const isPaid = Math.random() < 0.6;
      const amount = isPaid
        ? totalAmount
        : Math.round(totalAmount * (Math.random() * 0.4 + 0.3));
      const ref = await nextSeq("paymentReference", "PAY");
      await SupplierPayment.create({
        paymentReference: ref,
        type: "SPECIFIC",
        supplier: supplier._id,
        purchaseId: purchase._id,
        amount,
        unallocatedAmount: 0,
        allocations: [{ purchase: purchase._id, amount }],
        paymentDate: daysBack(payDaysAgo, randInt(9, 16)),
        status: "active",
        note: isPaid ? "Full settlement" : "Partial payment",
      });
      const paymentStatus = isPaid ? "PAID" : "PARTIALLY_PAID";
      await Purchase.findByIdAndUpdate(purchase._id, { allocatedAmount: amount, paymentStatus });
      spCount++;
    }
    console.log(`   ✔  ${spCount} supplier payments`);

    // ── 12. Contracts (with contractors) ─────────────────────────────────────
    console.log("── Seeding contracts...");
    const contractStatuses = ["ACTIVE", "ACTIVE", "COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED"];
    const createdContracts = [];
    for (let i = 0; i < 10; i++) {
      const daysAgo    = randInt(3, 28);
      const contractor = pick(contractors);
      const task       = pick(tasks);
      const taskType   = taskTypes.find(tt => tt._id.equals(task.taskType));
      const qty        = randInt(1, 10);
      const unitPrice  = Math.round(task.defaultUnitPrice * (0.9 + Math.random() * 0.2));
      const status     = pick(contractStatuses);
      const contractDate = daysBack(daysAgo, randInt(8, 14));
      const expCompletion = new Date(contractDate);
      expCompletion.setDate(expCompletion.getDate() + randInt(5, 20));

      const contractNumber = await nextSeq("contractNumber", "CON");
      const contract = await Contract.create({
        contractNumber,
        contractor: contractor._id,
        contractorName: contractor.name,
        task: task._id,
        taskName: task.name,
        taskTypeName: taskType?.name || "General",
        quantity: qty,
        unitPrice,
        contractDate,
        expectedCompletionDate: expCompletion,
        status,
        ...(status === "CANCELLED" ? {
          cancellationReason: "Client cancelled the order",
          cancelledAt: daysBack(daysAgo - 2),
          cancelledBy: admin._id,
        } : {}),
        createdBy: admin._id,
        note: null,
      });
      createdContracts.push({ contract, contractor, qty, unitPrice, status, daysAgo });
    }
    console.log(`   ✔  ${createdContracts.length} contracts`);

    // ── 13. Contract Completions ──────────────────────────────────────────────
    console.log("── Seeding contract completions...");
    let ccCount = 0;
    for (const { contract, qty, daysAgo, status } of createdContracts) {
      if (status === "CANCELLED") continue;
      const numCompletions = status === "COMPLETED"
        ? randInt(1, 3)
        : (Math.random() < 0.5 ? 1 : 0);
      let remaining = qty;
      for (let c = 0; c < numCompletions && remaining > 0; c++) {
        const completedQty = c === numCompletions - 1
          ? remaining
          : randInt(1, Math.max(1, Math.floor(remaining / 2)));
        remaining -= completedQty;
        await ContractCompletion.create({
          contract: contract._id,
          quantity: completedQty,
          recordedAt: daysBack(Math.max(1, daysAgo - c * 3 - 1), randInt(9, 16)),
          status: "ACTIVE",
          createdBy: admin._id,
          note: null,
        });
        ccCount++;
      }
    }
    console.log(`   ✔  ${ccCount} contract completions`);

    // ── 14. Contractor Payments ───────────────────────────────────────────────
    console.log("── Seeding contractor payments...");
    let ctpCount = 0;
    for (const { contract, qty, unitPrice, status, daysAgo, contractor } of createdContracts) {
      if (status !== "COMPLETED" || Math.random() < 0.2) continue;
      const totalDue = qty * unitPrice;
      const numPay   = randInt(1, 2);
      let paid = 0;
      for (let p = 0; p < numPay; p++) {
        const amount = p === numPay - 1 ? totalDue - paid : Math.round(totalDue * 0.5);
        if (amount <= 0) continue;
        const ref = await nextSeq("paymentReference", "PAY");
        await ContractorPayment.create({
          paymentReference: ref,
          contract: contract._id,
          contractNumber: contract.contractNumber,
          contractorName: contractor.name,
          amount,
          paymentDate: daysBack(Math.max(1, daysAgo - p * 3 - 1), randInt(9, 16)),
          status: "active",
          createdBy: admin._id,
          note: p === 0 ? "Advance payment" : "Final settlement",
        });
        paid += amount;
        ctpCount++;
      }
    }
    console.log(`   ✔  ${ctpCount} contractor payments`);

    // ── 15. Attendance + Overtime (last 4 weeks) ──────────────────────────────
    console.log("── Seeding attendance & overtime (last 4 weeks)...");
    let attCount = 0, otCount = 0;

    // Find the Monday of the current week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0=Sun
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysToLastMonday);

    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      const weekStart = new Date(thisMonday);
      weekStart.setDate(thisMonday.getDate() - weekOffset * 7);

      for (const emp of employees) {
        const { normalEarnings, overtimeEarnings, dailyBreakdown, overtimeBreakdown } =
          await seedWeek(emp, weekStart);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 5);

        // Close payroll for past weeks (not the current one)
        if (weekOffset > 0 && dailyBreakdown.length > 0) {
          const payrollExists = await WeeklyPayroll.findOne({
            employee: emp._id, startDate: weekStart, endDate: weekEnd,
          });
          if (!payrollExists) {
            await WeeklyPayroll.create({
              employee: emp._id, startDate: weekStart, endDate: weekEnd,
              normalEarnings, overtimeEarnings,
              totalEarnings: normalEarnings + overtimeEarnings,
              closedAt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000),
              dailyBreakdown, overtimeBreakdown,
            });
          }
        }
        attCount += dailyBreakdown.length;
        otCount  += overtimeBreakdown.length;
      }
    }
    console.log(`   ✔  ~${attCount} attendance records, ~${otCount} overtime records, weekly payrolls closed`);

    // ── 16. Employee Payments ─────────────────────────────────────────────────
    console.log("── Seeding employee payments...");
    let empPayCount = 0;
    for (const emp of employees) {
      // Regular payment around mid-month
      const ref1 = await nextSeq("paymentReference", "PAY");
      await EmployeePayment.create({
        employee: emp._id, employeeName: emp.name,
        paymentReference: ref1,
        amount: emp.dailyRate * 13, // roughly half-month advance
        paymentDate: daysBack(15, randInt(9, 16)),
        type: "regular", status: "active",
        createdBy: admin._id,
        note: "Mid-month payment",
      });
      empPayCount++;

      // Advance for ~40% of employees
      if (Math.random() < 0.4) {
        const ref2 = await nextSeq("paymentReference", "PAY");
        await EmployeePayment.create({
          employee: emp._id, employeeName: emp.name,
          paymentReference: ref2,
          amount: randInt(5, 15) * 1000,
          paymentDate: daysBack(randInt(5, 20), randInt(9, 16)),
          type: "advance", status: "active",
          createdBy: admin._id,
          note: "Advance request approved",
        });
        empPayCount++;
      }
    }
    console.log(`   ✔  ${empPayCount} employee payments`);

    // ── 17. Expenses ──────────────────────────────────────────────────────────
    console.log("── Seeding expenses...");
    const expenseTemplates = [
      { category: "Rent",              amount: 250000, description: "Monthly workshop rent" },
      { category: "Electricity",       amount:  45000, description: "Monthly electricity bill" },
      { category: "Water",             amount:   8000, description: "Monthly water bill" },
      { category: "Internet",          amount:  15000, description: "Monthly internet subscription" },
      { category: "Transport",         amount:  20000, description: "Delivery and pickup transport" },
      { category: "Maintenance",       amount:  30000, description: "Workshop machinery maintenance" },
      { category: "Tools & Equipment", amount:  55000, description: "New cutting tools purchase" },
      { category: "Office Supplies",   amount:   7500, description: "Stationery and printing" },
      { category: "Marketing",         amount:  18000, description: "Social media ads" },
      { category: "Transport",         amount:  12000, description: "Fuel and driver fees" },
      { category: "Other",             amount:  10000, description: "Miscellaneous workshop expenses" },
      { category: "Taxes & Fees",      amount:  25000, description: "Monthly government fees" },
    ];
    let expCount = 0;
    for (let i = 0; i < expenseTemplates.length; i++) {
      const tmpl    = expenseTemplates[i];
      const daysAgo = randInt(1, 28);
      const isVoided = i === 10 && Math.random() < 0.3;
      await Expense.create({
        category: tmpl.category,
        amount: tmpl.amount,
        description: tmpl.description,
        date: daysBack(daysAgo, randInt(8, 17)),
        createdBy: admin._id,
        createdByName: admin.name,
        status: isVoided ? "voided" : "active",
        ...(isVoided ? {
          voidReason: "Entered in error",
          voidedAt: daysBack(daysAgo - 1),
          voidedBy: admin._id,
          voidedByName: admin.name,
        } : {}),
      });
      expCount++;
    }
    console.log(`   ✔  ${expCount} expenses`);

    // ── Done ──────────────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════");
    console.log("✅  Demo seed completed successfully!");
    console.log("══════════════════════════════════════════════");
    console.log(`  • ${customers.length} customers`);
    console.log(`  • ${createdOrders.length} orders  +  ${cpCount} customer payments`);
    console.log(`  • ${employees.length} employees  +  ~${attCount} attendance  +  ~${otCount} overtime`);
    console.log(`  • ${suppliers.length} suppliers  +  ${createdPurchases.length} purchases  +  ${spCount} supplier payments`);
    console.log(`  • ${createdContracts.length} contracts  +  ${ccCount} completions  +  ${ctpCount} contractor payments`);
    console.log(`  • ${expCount} expenses`);
    console.log(`  • ${empPayCount} employee payments`);
    console.log(`  • ${tasks.length} tasks across ${taskTypes.length} task types`);

  } catch (err) {
    console.error("\n❌  Demo seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
  }
};

seedDemo();
