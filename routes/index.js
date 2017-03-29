var express = require('express');
var router = express.Router();
const url = require('url');
const phantom = require('phantom');
const cheerio = require('cheerio');
const Promise = require('bluebird');

/* GET home page. */
router.get('/', function(req, res, next) {
    var params = req.query;
    loadApartments(params).then(function (appartments) {
        res.json(appartments);
    }).catch(function (err) {
        res.json(err);
    });

});

function createUrl(params, page_number) {
    var urlObj = {};
    if(page_number > 1)
        params['Page'] = page_number;
    urlObj.hostname = 'www.yad2.co.il';
    urlObj.pathname = '/Nadlan/rent.php';
    urlObj.protocol = "http:";
    urlObj.query = params;
    return url.format(urlObj);
}

function getRss() {

}

function loadApartments(request_params) {
    return new Promise(function (resolve, reject) {

        var appartments = [];
        for (var page_number = 1; page_number <= 1; page_number++) {
            console.log("Url Parsed: ",createUrl(request_params, page_number));
            getUrlHtml(createUrl(request_params, page_number)).then(function (html) {
                var $ = cheerio.load(html);
                $("#main_table tr[id^='tr_Ad_']").each(function (i, elem) {
                    var cells_html = $(this).html();
                    appartments.push(Apartment(cells_html));

                    if (page_number == 2) {
                        resolve(appartments);
                    }
                })
            }).catch(reject)
        }
    })
}

function getUrlHtml(url) {
    return new Promise(function (resolve, reject) {
        var _ph = null;
        phantom.create().then(ph => {
            _ph = ph;
            return _ph.createPage();
        }).then(page => {
            page.setting('userAgent','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.71 Safari/537.36');
            page.invokeAsyncMethod('open',url).then(function (status) {
                page.property('content').then(function (html) {
                    _ph.exit();
                    resolve(html);
                })
            }).catch(reject)
        })
    })
}

function Apartment(cells_html) {

        var $ = cheerio.load(cells_html);
        var cells = $("td");
        var link = cells.last().find("a").attr("href");
        return {
                address:    cells.eq(8).text(),
                price:      cells.eq(10).text(),
                room_count: cells.eq(12).text(),
                entry_date: cells.eq(14).text(),
                floor:      cells.eq(16).text(),
                link:       link
            }

}

module.exports = router;



