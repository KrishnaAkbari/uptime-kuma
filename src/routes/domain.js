import express from 'express';
const router = express.Router();

import Domains from '../models/domains.js'

// Add a Domain
router.post('/', async (req, res) => {
    try{
        const { domain, heartbeat_interval, retries } = req.body
        
        // Validate required field
        if(!domain){
            return res.status(400).json({message: "Domain field is required."});
        }
    
        // Check domain exists or not
        const domainExits = await Domains.findOne({domain})
        if(domainExits){
            return res.status(400).json({message: "Domain already exists."})
        }
    
        const newDomain = new Domains({domain, heartbeat_interval, retries})
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