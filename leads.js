const express = require('express');
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');

const router = express.Router();

const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v || '');

/* ---------- PUBLIC: website contact form creates a lead ---------- */
router.post('/public', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !isEmail(email)) {
      return res.status(400).json({ message: 'Valid name and email are required' });
    }
    await Lead.create({
      name,
      email,
      message,
      source: 'website',
      notes: message && message.trim() ? [{ text: message }] : [],
    });
    res.status(201).json({ message: 'Thanks! We will contact you soon.' });
  } catch (err) {
    next(err);
  }
});

/* ---------- PROTECTED: everything below needs admin login ---------- */
router.use(auth);

// GET /api/leads?status=new&search=john
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    next(err);
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

// POST /api/leads  (admin adds a lead manually)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, source, status, notes } = req.body;
    if (!name || !isEmail(email)) {
      return res.status(400).json({ message: 'Valid name and email are required' });
    }
    const lead = await Lead.create({
      name,
      email,
      source,
      status,
      notes: notes && notes.trim() ? [{ text: notes }] : [],
    });
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leads/:id/status  { status: 'contacted' }
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'interested', 'not-interested', 'converted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/leads/:id/notes  { text }
router.post('/:id/notes', async (req, res, next) => {
  try {
    if (!req.body.text || !req.body.text.trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    lead.notes.push({ text: req.body.text });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

// POST /api/leads/:id/followups  { date, note }
router.post('/:id/followups', async (req, res, next) => {
  try {
    if (!req.body.date) return res.status(400).json({ message: 'Follow-up date is required' });
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    lead.followUps.push({ date: req.body.date, note: req.body.note });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leads/:id/followups/:fid  { done: true }
router.patch('/:id/followups/:fid', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    const fu = lead.followUps.id(req.params.fid);
    if (!fu) return res.status(404).json({ message: 'Follow-up not found' });
    fu.done = !!req.body.done;
    await lead.save();
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
