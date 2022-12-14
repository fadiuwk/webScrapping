require('dotenv').config()
const express = require("express");
const app = express();
const port = process.env.PORT
let userAgent = require("user-agents");

const puppeteer = require('puppeteer');
const aliExpressScraper = require('aliexpress-product-scraper')
const { nanoid } = require('nanoid');


app.use(express.json())

app.get('/', (req, res) => res.send("Hello World!"))

app.post('/scrapingData', async (req, res) => {
    const { urls } = req.body;

    let result = await scrapProduct(urls)

    res.json({ message: "Done", result })
})

const scrapProduct = async (urls) => {

    let aliProducts = [];
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    try {
        
        for (let i = 0; i < urls.length; i++) {
            await page.setUserAgent(userAgent.toString());
            await page.goto(urls[i], {
                waitUntil: 'networkidle2', timeout: 30000
            });
            const id = Number(urls[i].split('/')[4].split('.')[0]);
            const aliProduct = await aliExpressScraper(id);
            aliProduct.sku = nanoid();
            if (aliProduct.salePrice === undefined) {
                aliProduct.salePrice = ''
            }
            aliProduct.productUrl = urls[i];


            let [el] = await page.$x('//*[@class="product-dynamic-shipping"]/div/div/div/span/strong/span');
            let txt = await el?.getProperty('textContent');
            let shipping = await txt?.jsonValue()
            let shippingPrice = Number(shipping?.toString().replace(/[^0-9.]/g, ''));
            aliProduct.shippingPrice = shippingPrice;

            aliProducts.push(aliProduct);
        }
        await browser.close()

        return aliProducts;

    } catch (e) {
        res.send({ data: null });

    } finally {
        await browser.close();
    }
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))