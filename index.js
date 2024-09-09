import 'dotenv/config'
import express from 'express';
import cron from 'node-cron';
import axios from 'axios';
import Bull from 'bull';

import './src/db/connection.js'
import Domains from './src/models/domains.js'

const app = express();
const port = process.env.PORT || 3000

// Middleware to parse JSON bodies
app.use(express.json())

const checkDomainQueue = new Bull('check-domain', {
    redis: {
      host: '127.0.0.1',
      port: 6379,
      password: process.env.REDIS_PASSWORD
    },
  })

checkDomainQueue.process(async (job, done) => {
    const { domain } = job.data

    try{
        await axios.get(`${domain.domain}`, {timeout: 2000})
        console.log(`${domain.domain} site is up`)
    }catch(error){
        console.log(`${domain.domain} site is down`)
    }
    
    const now = Math.floor(Date.now() / 1000);
    await Domains.findOneAndUpdate(
        { _id: domain._id},
        { lastChecked: now }
    )

    done();
})

cron.schedule('* * * * * *', async () => {
    try{
        const domains = await Domains.find()
        const now = Math.floor(Date.now() / 1000);

        domains.forEach(async (domain) => {

            const lastChecked = domain.lastChecked || 0
            const nextCheck = lastChecked + domain.heartbeat_interval

            if(now >= nextCheck){
                const jobCounts = await checkDomainQueue.getJobCounts();
                await checkDomainQueue.add({ domain }, { delay: 5000 });
            }

        })
    }catch(error){
        console.error(error)
    }
})

// Import domains routes
const domainRoutes = (await import('./src/routes/domain.js')).default

app.use('/domain', domainRoutes)

app.listen(port, () => {
    console.log(`Listening to port ${port}`)
})