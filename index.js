import 'dotenv/config'
import express from 'express';
import cron from 'node-cron';
import axios from 'axios';
import Bull from 'bull';

import './src/db/connection.js'
import Domains from './src/models/domains.js'
import transporter from './src/sendMail.js';

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

const sendSlackNotification = async(slack_webhook_url, message) =>{
    try{
        await axios.post(slack_webhook_url, {text: message})
        console.log('Slack notification sent successfully');
    }catch(error){
        console.error('Failed to send Slack notification:', error.message);
    }
}

const sendEmailNotification = async(email, subject, message) => {
    try{
        await transporter.sendMail({
            from: "Uptime Monitor",
            to: email,
            subject: subject,
            text: message
        })
        console.log('Email notification sent successfully');
    }catch(error){
        console.error('Failed to send email notification:', error.message);
    }
}

const checkDomainStatus = async(domain, retry=0) => {
    try{
        await axios.get(`${domain.domain}`, {timeout: 900})
        console.log(`${domain.domain} site is up`);
    }catch(error){
        if(retry > domain.retries){
            const message = `Warning: The site ${domain.domain} is down`

            if(domain.notification_type == 'slack' && domain.slack_webhook_url){
                await sendSlackNotification(domain.slack_webhook_url, message)
            }else if(domain.notification_type == 'email' && domain.email){
                let subject = `Site Down Alert: ${domain.domain}`
                await sendEmailNotification(domain.email, subject, message)
            }else{
                console.log(message)
            }
        }else{
            checkDomainStatus(domain, retry+1)
        }
    }
}

checkDomainQueue.process(async (job, done) => {
    const { domain } = job.data

    await checkDomainStatus(domain)
    
    const now = Math.floor(Date.now() / 1000);
    await Domains.findOneAndUpdate(
        { _id: domain._id},
        { last_checked: now }
    )

    done();
})

cron.schedule('*/10 * * * * *', async () => {
    try{
        const domains = await Domains.find()
        const now = Math.floor(Date.now() / 1000);

        domains.forEach(async (domain) => {

            const lastChecked = domain.last_checked || 0
            const nextCheck = lastChecked + domain.heartbeat_interval

            if(now >= nextCheck){
                await checkDomainQueue.add({ domain });
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