require('dotenv').config()
const puppeteer = require('puppeteer');
var admin = require('firebase-admin');
var serviceAccount = require("../firebasekey.json")


const firebase = admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://easen-my-life.firebaseio.com"
    },
    "server"
  );

(async () => {
    const initialLinkedinUrl = "https://www.linkedin.com/jobs/search/?distance=50&f_E=2%2C3%2C4&f_LF=f_AL&f_T=9%2C24%2C2490%2C3549%2C25201&f_TPR=r604800&geoId=104194190&keywords=software%20engineer&location=Dallas%2C%20Texas%2C%20United%20States"
    const {LINKEDIN_EMAIL, LINKEDIN_PASSWORD} = process.env;
    const browser = await puppeteer.launch({ headless: false});
    const page = await browser.newPage();
    await page.goto('https://www.linkedin.com/login');
    await page.focus('#username');
    await page.keyboard.type(LINKEDIN_EMAIL);
    await page.focus('#password');
    await page.keyboard.type(LINKEDIN_PASSWORD);
    await page.click('.btn__primary--large');
    await page.goto(initialLinkedinUrl);
    const jobIds = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".occludable-update > div")).map((d) => {
            const jobAttribute = d.getAttribute("data-job-id");
            let jobId = '';
            for(let i = jobAttribute.length - 1; i >= 0; i--){
                if(jobAttribute[i] == ':'){
                    return jobId;
                } else {
                    jobId = jobAttribute[i] + jobId;
                }
            }
        })
    }
  )
     jobIds.forEach(async(job) => {
       console.log(job)
      const jobUrl = `https://www.linkedin.com/jobs/search/?currentJobId=${job}&distance=50&f_E=2%2C3%2C4&f_LF=f_AL&f_T=9%2C24%2C2490%2C3549%2C25201&f_TPR=r604800&geoId=104194190&keywords=software%20engineer&location=Dallas%2C%20Texas%2C%20United%20States`
      await page.goto(jobUrl);
      await page.evaluate(async () => {
        try {
          const applybtn = await page.$('.jobs-apply-button');
          if(applybtn) {
            await page.click('.jobs-apply-button');
            await page.evaluate(async() => {
              const submitbtn = await page.$('.jobs-apply-form__submit-button');
              if(submitbtn) {
                await page.click('.jobs-apply-form__submit-button');
              }
            })
          }
        }catch(e) {
          console.log('err', e)
        }
      })
    })
    await browser.close();
  })();
