var express = require('express');
var bodyParser = require('body-parser'); 
var app = express();
var mongoose = require('mongoose');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var md5 = require('md5');


// Database stuffs
mongoose.connect("mongodb://fingerprinter:f1ngerprinter@ds131373.mlab.com:31373/fingerprints", { useNewUrlParser: true });

var userInformationsSchema = new mongoose.Schema({
    timezone : String,
    platform : String,
    cookieEnabled : String,
    doNotTrack : String,
    vendor : String,
    renderer : String
});
var userInformationsModel = mongoose.model('UserInformations', userInformationsSchema);

// ******************************

app.use(express.static('public'));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.post('/process', function (req, res) {
    // Getting informations thanks to JS functions executed on client side
   var clientJS = req.body;
   console.log(clientJS);

    // TODO HTTP Headers
   
   var userInformations = new userInformationsModel(clientJS);
   userInformations.save(function(err){
        if(err) throw err;
        console.log("New user informations saved");
   });
})

app.get('/getResults', function(req, res) {
    userInformationsModel.find(null,function(err, allUserInformations){
        if(err) throw err;
        var resData = {nbDataUsed: allUserInformations.length, nbCollisions: 0}
        var hashList = [];
        var userString = ""
        allUserInformations.forEach(userInformations => {
            userString = ""
            Object.keys(userInformations["_doc"]).forEach(key => {
                if(!key.startsWith("_"))
                {
                    userString = userString.concat(userInformations[key])
                }
            });
            hashList.push(md5(userString))
        });
        console.log(hashList)
        // Compute the number of identic fingerprint

        hashList.forEach(hash => {
            var found = 0;
            hashList.forEach(compareWith => {
                if(hash.localeCompare(compareWith) == 0) 
                    {
                        found += 1
                    }
            });
            if(found > 1) resData.nbCollisions += 1
        });
        resData.nbCollisions = resData.nbCollisions;
        resData.nbDataUsed = hashList.length;
        res.json(resData);
    });
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
 
   console.log("Example app listening at http://%s:%s", host, port)
})