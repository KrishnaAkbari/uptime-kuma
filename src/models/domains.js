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
    lastChecked: {
        type: Number,
        default: 0
    }
})

const Domains = new mongoose.model("Domain", domainSchema);

export default Domains;