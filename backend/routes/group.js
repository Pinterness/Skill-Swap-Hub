const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const Match = require("../models/Match");
const Notification = require("../models/Notification");
const auth = require("../middlewares/authMiddleware");

// Lấy danh sách nhóm mình đang tham gia (là giáo viên hoặc thành viên đã accepted)
router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { teacher: req.user.id },
        { members: { $elemMatch: { user: req.user.id, status: "accepted" } } },
      ],
      status: { $ne: "closed" },
    })
      .populate("teacher", "username avatar")
      .populate("members.user", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Lấy các lời mời nhóm đang chờ MÌNH xác nhận
// LƯU Ý: route này phải đặt TRƯỚC "/:groupId" bên dưới, nếu không Express sẽ
// hiểu nhầm "invites" là 1 giá trị :groupId và gây lỗi cast ObjectId thất bại.
router.get("/invites", auth, async (req, res) => {
  try {
    const groups = await Group.find({
      members: { $elemMatch: { user: req.user.id, status: "pending" } },
      status: { $ne: "closed" },
    })
      .populate("teacher", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Tạo nhóm mới - chỉ được gộp những người đã có match "accepted" với mình
router.post("/", auth, async (req, res) => {
  try {
    const { studentIds, title } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cần chọn ít nhất 1 học viên" });
    }

    const matches = await Match.find({
      status: "accepted",
      $or: [
        { sender: req.user.id, receiver: { $in: studentIds } },
        { receiver: req.user.id, sender: { $in: studentIds } },
      ],
    });

    const validIds = new Set();
    matches.forEach((m) => {
      const otherId =
        m.sender.toString() === req.user.id
          ? m.receiver.toString()
          : m.sender.toString();
      validIds.add(otherId);
    });

    const invalidIds = studentIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Một số người được chọn chưa kết nối (match) với bạn",
      });
    }

    const roomName = `group-${crypto.randomBytes(6).toString("hex")}`;

    const group = await Group.create({
      teacher: req.user.id,
      title: title || "Buổi học nhóm",
      roomName,
      members: studentIds.map((id) => ({ user: id, status: "pending" })),
      status: "pending",
    });

    const io = req.app.get("io");
    for (const studentId of studentIds) {
      await Notification.create({
        userId: studentId,
        type: "group_invite",
        content: `Bạn được mời tham gia buổi học nhóm: ${group.title}`,
        refId: group._id,
      });
      if (io) {
        io.to(studentId.toString()).emit("group_invite", {
          groupId: group._id.toString(),
          title: group.title,
          teacherName: req.user.username,
        });
        io.to(studentId.toString()).emit("new_notification");
      }
    }

    res.status(201).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Học viên chấp nhận / từ chối lời mời vào nhóm
router.put("/:groupId/respond", auth, async (req, res) => {
  try {
    const { accept } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhóm" });

    const member = group.members.find((m) => m.user.toString() === req.user.id);
    if (!member)
      return res
        .status(403)
        .json({ success: false, message: "Bạn không được mời vào nhóm này" });

    member.status = accept ? "accepted" : "declined";
    await group.save();

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Xem chi tiết 1 nhóm (chỉ giáo viên hoặc thành viên đã accepted)
router.get("/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("teacher", "username avatar")
      .populate("members.user", "username avatar");
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhóm" });

    const isTeacher = group.teacher._id.toString() === req.user.id;
    const isAcceptedMember = group.members.some(
      (m) => m.user._id.toString() === req.user.id && m.status === "accepted",
    );
    if (!isTeacher && !isAcceptedMember) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền xem nhóm này" });
    }

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Lấy tin nhắn nhóm
router.get("/:groupId/messages", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhóm" });

    const isTeacher = group.teacher.toString() === req.user.id;
    const isAcceptedMember = group.members.some(
      (m) => m.user.toString() === req.user.id && m.status === "accepted",
    );
    if (!isTeacher && !isAcceptedMember) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem tin nhắn nhóm này",
      });
    }

    const messages = await GroupMessage.find({ groupId: req.params.groupId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Gửi tin nhắn nhóm
router.post("/:groupId/messages", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhóm" });

    const isTeacher = group.teacher.toString() === req.user.id;
    const isAcceptedMember = group.members.some(
      (m) => m.user.toString() === req.user.id && m.status === "accepted",
    );
    if (!isTeacher && !isAcceptedMember) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền nhắn tin trong nhóm này",
      });
    }

    const message = await GroupMessage.create({
      groupId: group._id,
      sender: req.user.id,
      content: req.body.content,
    });
    const populated = await message.populate("sender", "username avatar");

    const io = req.app.get("io");
    if (io) {
      const recipientIds = new Set([
        group.teacher.toString(),
        ...group.members
          .filter((m) => m.status === "accepted")
          .map((m) => m.user.toString()),
      ]);
      recipientIds.forEach((id) => {
        io.to(id).emit("new_group_message", populated);
      });
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Kết thúc buổi học nhóm (chỉ giáo viên)
router.put("/:groupId/close", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhóm" });
    if (group.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Chỉ giáo viên mới có thể kết thúc buổi học",
      });
    }
    group.status = "closed";
    await group.save();
    res.json({ success: true, message: "Đã kết thúc buổi học nhóm" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
