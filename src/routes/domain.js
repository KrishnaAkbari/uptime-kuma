import express from 'express';
const router = express.Router();

import Domains from '../models/domains.js'

// Add a Domain
router.post('/', async (req, res) => {
    try{
        const { domain, heartbeat_interval, retries, notification_type, slack_webhook_url, email } = req.body
        
        // Validate required field
        if(!domain){
            return res.status(400).json({message: "Domain field is required."});
        }

        if(notification_type == 'slack' && !slack_webhook_url){
            return res.status(400).json({message: "Webhook Url field is required when notification type is Slack."})
        }

        if(notification_type == 'email' && !email){
            return res.status(400).json({message: "Email field is required when notification type is Email."})
        }
    
        // Check domain exists or not
        const domainExits = await Domains.findOne({domain})
        if(domainExits){
            return res.status(400).json({message: "Domain already exists."})
        }
    
        const newDomain = new Domains({domain, heartbeat_interval, retries, notification_type, slack_webhook_url, email})
        const savedDomain = await newDomain.save()
    
        res.status(201).json({
            message: "Domain added successfully.",
            savedDomain
        })
    }catch(error){
        res.status(500).json({message: error})
    }

})

export default router;