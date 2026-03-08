import Note from '../models/Note.js';
import { createAuditLog } from '../utils/audit.js';

// Get all notes for a parent entity
export const getNotes = async (req, res, next) => {
  try {
    const { parentType, parentId } = req.query;

    if (!parentType || !parentId) {
      return res.status(400).json({
        success: false,
        error: 'parentType and parentId are required',
      });
    }

    const notes = await Note.find({
      parentType,
      parentId,
      organization: req.user.organization,
    })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

// Get single note
export const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate('owner', 'name email');

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

// Create note
export const createNote = async (req, res, next) => {
  try {
    const { title, content, parentType, parentId } = req.body;

    const note = await Note.create({
      title,
      content,
      parentType,
      parentId,
      owner: req.user.id,
      organization: req.user.organization,
    });

    // Create audit log
    await createAuditLog({
      entityType: parentType,
      entityId: parentId,
      action: 'update',
      changes: [{ field: 'notes', oldValue: null, newValue: `Added note: ${title}` }],
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

// Update note
export const updateNote = async (req, res, next) => {
  try {
    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    if (note.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this note',
      });
    }

    note = await Note.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title, content: req.body.content },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

// Delete note
export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    if (note.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this note',
      });
    }

    await note.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};