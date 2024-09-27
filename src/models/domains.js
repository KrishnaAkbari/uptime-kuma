import mongoose from "mongoose";

const domainSchema = mongoose.Schema({
    domain: {
        type: String,
        unique: true,
        required: true
    },
    heartbeat_interval: {
        type: Number,
        default: 60
    },
    retries: {
        type: Number,
        default: 0
    },
    notification_type: {
        type: String,
        enum: ['email', 'slack'],
        required: true
    },
    email: {
        type: String,
        required: false
    },
    slack_webhook_url: {
        type: String,
        required: false,
    },
    last_checked: {
        type: Number,
        default: 0
    }
})

const Domains = new mongoose.model("Domain", domainSchema);

export default Domains;