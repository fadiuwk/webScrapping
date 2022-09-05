const express = require("express");
const app = express();
const port = 3000;

const puppeteer = require('puppeteer');
const aliExpressScraper = require('aliexpress-product-scraper')
const { nanoid } = require('nanoid');


app.use(express.json())

app.post('/scrapingData', async (req, res) => {
    const { urls } = req.body;

    let result = await scrapProduct(urls)

    res.json({ message: "Done", result })
})

const scrapProduct = async (urls) => {

    let aliProducts = [];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {

        for (let i = 0; i < urls.length; i++) {
            await page.goto(urls[i], {
                waitUntil: 'networkidle2', timeout: 0
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
        browser.close()

        return aliProducts;

    } catch (error) {
        console.log('Our Error', error);
    }
}

app.listen(port, () => {
    console.log("running.....");
})