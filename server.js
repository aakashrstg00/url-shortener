const express = require('express');
const mongojs = require('mongojs');
const path = require('path');

var app = express();
app.use(express.static(path.join(__dirname,'public')));

// const bodyParser = require('body-parser');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:false}));

const db = mongojs('mongodb://rastogi:rastogi1@ds121575.mlab.com:21575/url-shortener',['conversions']);

app.get('/',(req,res)=>{
    res.sendFile('index.html');
});

app.get('/shorten',(req,res)=>{
    db.conversions.findOne({url: req.query.url},(err,data)=>{
        if(err) throw err;
        else {
            if(data && data.shortened){
                console.log(req.hostname);
                res.send(`<a href="${req.headers.host}/${data.shortened}">${req.headers.host}/${data.shortened}</a>`);
            }
            else {
                var shortened = shortenLogic(req.query.url);
                if(shortened.done){ 
                    db.conversions.save({
                        shortened: shortened.value,
                        url: shortened.url
                    },(e,d)=>{
                        if(e) throw e;
                        else res.send(`<a href="${req.headers.host}/${d.shortened}">${req.headers.host}/${d.shortened}</a>`);
                    });
                }
                else res.send('Invalid Url');
            }
        }
    })
});

app.get('/:short',(req,res)=>{
    db.conversions.findOne({shortened: req.params.short},(err,data)=>{
        if(err) throw err;
        else {
            if(data && data.shortened){
                res.redirect(data.url);
            }
            else {
                res.send('No such link exists!');
            }
        }
    });
})

function shortenLogic(url){
    var match = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    if(match.test(url)){
        let epochDate = (new Date()).getTime() - '910915200000';
        console.log(epochDate);
        // let buf = Buffer.from(epochDate.toString()).toString('base64');
        let buf = epochDate.toString(36);
        if(url.indexOf('http://')!=0 || url.indexOf('https://')!=0) return {
            done: true,
            value: buf,
            url: 'http://' + url
        };
        else return {
            done: true,
            value: buf,
            url: url
        };
    }
    else{
        console.log(url);
        return {
            done: false,
            url: url
        }
    }
}
// app.use('*',function(req,res){
//     res.sendFile(path.join(__dirname, '/views/index.html'));
// });

app.set('port',process.env.PORT||3000);
app.listen(app.get('port'),()=>{
    console.log('Server started at '+app.get('port'));
});