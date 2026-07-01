const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Vui lòng nhập tên người dùng'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Vui lòng nhập email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu'],
        minlength: [6, 'Mật khẩu phải từ 6 ký tự trở lên']
    },
    avatar: { type: String, default: '' },
    skillsOffered: { type: [String], default: [] },
    skillsWanted:  { type: [String], default: [] },
    certificates: [
    {
        name:         { type: String, required: true }, 
        issuer:       { type: String, default: '' },    
        issueDate:    { type: Date },                  
        expiryDate:   { type: Date },                   
        credentialUrl:{ type: String, default: '' },    
    }
],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    searchHistory: { type: [String], default: [] },
    stats: {
        totalTaught:    { type: Number, default: 0 },
        totalLearned:   { type: Number, default: 0 },
        averageRating:  { type: Number, default: 0 },
        totalReviews:   { type: Number, default: 0 }
    },
    role:   { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);